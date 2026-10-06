"use server";

// Order lifecycle after checkout: customer tracking / cancelling, and admin dispatch updates.
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { auth } from "./auth";
import { requireAdmin } from "./adminGuard";
import { CUSTOMER_CANCELLABLE, ORDER_STATUSES } from "./orderStatus";

type Tx = Prisma.TransactionClient;
type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

const normalisePhone = (raw: string) => (raw || "").replace(/\D/g, "").slice(-10);

// Fields a customer may see (no admin note, no internal ids beyond what the page needs)
const customerOrderSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  subtotal: true,
  gstAmount: true,
  deliveryCharge: true,
  discount: true,
  total: true,
  couponCode: true,
  deliveryType: true,
  shippingAddress: true,
  paymentMethod: true,
  paymentStatus: true,
  notes: true,
  expectedDate: true,
  deliveryAgent: true,
  customer: { select: { name: true, phone: true } },
  items: { select: { id: true, productId: true, productName: true, variantName: true, price: true, quantity: true, total: true } },
  events: { select: { id: true, status: true, note: true, actor: true, createdAt: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderSelect;

export type TrackedOrder = Prisma.OrderGetPayload<{ select: typeof customerOrderSelect }>;

async function findCustomerOrder(orderNumber: string, phone: string) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    select: customerOrderSelect,
  });
  if (!order || order.customer.phone !== normalisePhone(phone)) return null;
  return order;
}

// Public order lookup: needs both the order number and the phone used at checkout
export async function getTrackedOrder(orderNumber: string, phone: string): Promise<TrackedOrder | null> {
  try {
    if (!orderNumber || normalisePhone(phone).length !== 10) return null;
    return await findCustomerOrder(orderNumber, phone);
  } catch (error) {
    console.error("Error tracking order:", error);
    return null;
  }
}

// Puts stock (and the coupon use) back when an order is cancelled
async function restoreOrder(tx: Tx, order: { id: string; orderNumber: string; couponCode: string | null }) {
  const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
  for (const item of items) {
    const variant = item.variantName
      ? await tx.productVariant.findFirst({ where: { productId: item.productId, name: item.variantName } })
      : null;
    if (variant) {
      const v = await tx.productVariant.update({ where: { id: variant.id }, data: { stock: { increment: item.quantity } } });
      await tx.stockMovement.create({
        data: { productId: item.productId, variantId: variant.id, type: "cancel_restore", qty: item.quantity, balanceAfter: v.stock, reason: `Order cancelled: ${order.orderNumber}` },
      });
    } else {
      const p = await tx.product.findUnique({ where: { id: item.productId } });
      if (!p) continue;
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, soldCount: { decrement: Math.min(item.quantity, p.soldCount) } },
      });
      await tx.stockMovement.create({
        data: { productId: item.productId, type: "cancel_restore", qty: item.quantity, balanceAfter: updated.stock, reason: `Order cancelled: ${order.orderNumber}` },
      });
    }
  }
  if (order.couponCode) {
    await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  }
}

function revalidateOrderViews() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/products");
  revalidatePath("/account");
}

export async function cancelMyOrder(orderNumber: string, phone: string, reason: string): Promise<Result<{ order: TrackedOrder }>> {
  try {
    const order = await findCustomerOrder(orderNumber, phone);
    if (!order) return { success: false, error: "Order not found." };
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      return { success: false, error: "This order is already packed. Please call or WhatsApp us on 97441 64444 to cancel." };
    }
    const why = (reason || "").trim().slice(0, 200);

    await db.$transaction(async (tx) => {
      // Re-check inside the transaction so a cancel can't race an admin status change
      const changed = await tx.order.updateMany({
        where: { id: order.id, status: { in: CUSTOMER_CANCELLABLE } },
        data: { status: "CANCELLED", paymentStatus: order.paymentStatus === "paid" ? "refund_due" : "cancelled" },
      });
      if (changed.count === 0) throw new Error("This order can no longer be cancelled online.");
      await restoreOrder(tx, order);
      await tx.orderEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: why ? `Cancelled by customer: ${why}` : "Cancelled by customer", actor: "customer" },
      });
    });

    revalidateOrderViews();
    const fresh = await findCustomerOrder(orderNumber, phone);
    return { success: true, order: fresh! };
  } catch (error) {
    console.error("Customer cancel error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Could not cancel the order." };
  }
}

// Current catalogue data for every line of a past order, so it can be added to the cart again
export async function getReorderLines(orderNumber: string, phone: string) {
  const order = await findCustomerOrder(orderNumber, phone);
  if (!order) return [];
  const products = await db.product.findMany({
    where: { id: { in: order.items.map((i) => i.productId) }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
  });
  return order.items.flatMap((item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return [];
    const v = item.variantName ? p.variants.find((x) => x.name === item.variantName) : null;
    const price = v ? v.price : p.price;
    const stock = v ? v.stock : p.stock;
    if (!(price > 0) || stock <= 0) return [];
    return [
      {
        id: v ? v.id : p.id,
        productId: p.id,
        name: p.name,
        price,
        image: p.images[0]?.url ?? "",
        quantity: Math.min(item.quantity, stock),
        variantName: v?.name ?? null,
        sku: v ? v.sku : p.sku,
        unit: p.unit,
        stock,
      },
    ];
  });
}

// ============ ADMIN ============

export async function getAdminOrders() {
  try {
    await requireAdmin();
    return await db.order.findMany({
      include: { customer: true, items: true, events: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting admin orders:", error);
    return [];
  }
}

export async function adminUpdateOrder(
  orderId: string,
  input: {
    status?: string;
    note?: string;
    expectedDate?: string | null;
    deliveryAgent?: string | null;
    adminNote?: string | null;
    paymentStatus?: string;
  }
): Promise<Result> {
  try {
    const admin = await requireAdmin();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Order not found." };

    const status = input.status && input.status !== order.status ? input.status : undefined;
    if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return { success: false, error: "Unknown order status." };
    }
    // Cancelling restores stock, so a cancelled order can't be silently revived
    if (status && order.status === "CANCELLED") {
      return { success: false, error: "Cancelled orders can't be reopened. Please place a new order." };
    }
    if (input.paymentStatus && !["pending", "paid", "refunded", "refund_due", "cancelled"].includes(input.paymentStatus)) {
      return { success: false, error: "Unknown payment status." };
    }

    const data: Prisma.OrderUpdateInput = {};
    if (status) data.status = status;
    if (status === "DELIVERED" && order.paymentMethod === "cod" && order.paymentStatus === "pending") data.paymentStatus = "paid";
    if (status === "CANCELLED") data.paymentStatus = order.paymentStatus === "paid" ? "refund_due" : "cancelled";
    if (input.paymentStatus && input.paymentStatus !== order.paymentStatus) data.paymentStatus = input.paymentStatus;
    if (input.expectedDate !== undefined) data.expectedDate = input.expectedDate ? new Date(`${input.expectedDate}T18:00:00+05:30`) : null;
    if (input.deliveryAgent !== undefined) data.deliveryAgent = input.deliveryAgent?.trim().slice(0, 120) || null;
    if (input.adminNote !== undefined) data.adminNote = input.adminNote?.trim().slice(0, 1000) || null;

    const note = input.note?.trim().slice(0, 300) || null;

    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data });
      if (status === "CANCELLED") await restoreOrder(tx, order);
      if (status || note) {
        await tx.orderEvent.create({
          data: { orderId, status: status ?? order.status, note, actor: admin.name },
        });
      }
      if (data.paymentStatus === "paid" && order.paymentStatus !== "paid") {
        await tx.orderEvent.create({ data: { orderId, status: status ?? order.status, note: "Payment received", actor: admin.name } });
      }
    });

    revalidateOrderViews();
    return { success: true };
  } catch (error) {
    console.error("Admin order update error:", error);
    return { success: false, error: error instanceof Error && error.message.startsWith("Unauthorized") ? error.message : "Failed to update the order." };
  }
}

// Count of orders still waiting for the shop (sidebar badge)
export async function getOpenOrderCount() {
  try {
    await requireAdmin();
    return await db.order.count({ where: { status: { in: ["PLACED", "CONFIRMED", "PACKED"] } } });
  } catch {
    return 0;
  }
}

// Signed-in customer's orders with their timeline (account page)
export async function getMyOrdersDetailed() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    const u = session.user as typeof session.user & { phone?: string | null };
    const customers = await db.customer.findMany({
      where: { OR: [...(u.phone ? [{ phone: u.phone }] : []), { email: u.email }] },
      select: { id: true },
    });
    if (customers.length === 0) return [];
    return await db.order.findMany({
      where: { customerId: { in: customers.map((c) => c.id) } },
      select: customerOrderSelect,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

