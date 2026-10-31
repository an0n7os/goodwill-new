"use server";

// Order lifecycle after checkout: customer tracking / cancelling, and admin dispatch updates.
import { revalidatePath } from "next/cache";
import {after} from "next/server";
import {orderNotification} from "./business/notifications";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma";
import { db } from "./db";
import { auth } from "./auth";
import { requireAdmin } from "./adminGuard";
import { CUSTOMER_CANCELLABLE } from "./orderStatus";
import {changeOrderCore,type OrderChange} from "./business/orders";
import {checkRateLimit} from "./business/rateLimit";

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
  items: { select: { id: true, productId: true, productName: true, variantName: true, variantId: true, unit: true, price: true, quantity: true, total: true } },
  events: { select: { id: true, status: true, note: true, actor: true, createdAt: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderSelect;

export type TrackedOrder = Prisma.OrderGetPayload<{ select: typeof customerOrderSelect }>;

async function findCustomerOrder(orderNumber: string, phone: string) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    select: customerOrderSelect,
  });
  if(!order)return null;
  let checkoutPhone=order.customer.phone;
  try {checkoutPhone=JSON.parse(order.shippingAddress).phone||checkoutPhone;}catch{}
  if(normalisePhone(checkoutPhone)!==normalisePhone(phone))return null;
  return order;
}

// Public order lookup: needs both the order number and the phone used at checkout
export async function getTrackedOrder(orderNumber: string, phone: string): Promise<TrackedOrder | null> {
  try {
    if (!orderNumber || normalisePhone(phone).length !== 10) return null;
    if(!await checkRateLimit("tracking",normalisePhone(phone),30,60000))return null;
    return await findCustomerOrder(orderNumber, phone);
  } catch (error) {
    console.error("Error tracking order:", error);
    return null;
  }
}

function revalidateOrderViews() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/products");
  revalidatePath("/account");
  revalidatePath("/products");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/");
}

export async function cancelMyOrder(orderNumber: string, phone: string, reason: string): Promise<Result<{ order: TrackedOrder }>> {
  try {
    const order = await findCustomerOrder(orderNumber, phone);
    if (!order) return { success: false, error: "Order not found." };
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      return { success: false, error: "This order is already packed. Please call or WhatsApp us on 97441 64444 to cancel." };
    }
    const why = (reason || "").trim().slice(0, 200);

    await changeOrderCore(order.id,{status:"CANCELLED",note:why?`Cancelled by customer: ${why}`:"Cancelled by customer"},{id:"customer",name:"customer",role:"customer"},true);

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
    const v = item.variantId ? p.variants.find((x) => x.id === item.variantId) : item.variantName ? p.variants.find((x) => x.name === item.variantName) : null;
    if((item.variantId||item.variantName||p.variants.length)&&!v)return [];
    const price = v ? v.price : p.price;
    const stock = p.trackStock ? (v ? v.stock : p.stock) : 1000000;
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
        stock, gstRate:p.gstRate,
      },
    ];
  });
}

// ============ ADMIN ============

export async function getAdminOrders() {
  try {
    await requireAdmin();
    return await db.order.findMany({
      omit:{razorpaySignature:true},
      include: { customer: true, items: true, events: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting admin orders:", error);
    return [];
  }
}

export async function adminUpdateOrder(orderId:string,input:OrderChange):Promise<Result>{
 try{const admin=await requireAdmin();const updated=await changeOrderCore(orderId,input,admin);if(input.status)after(async()=>{await orderNotification(orderId,updated.status+" update "+updated.version).catch(()=>{});});revalidateOrderViews();return {success:true};}
 catch(error){return {success:false,error:error instanceof Error?error.message:"Could not update order."};}
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
    return await db.order.findMany({
      where: { accountUserId: session.user.id },
      select: customerOrderSelect,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}


export async function getAccountReorderLines(orderId:string){const session=await auth.api.getSession({headers:await headers()});if(!session)throw Error('Sign in first.');const order=await db.order.findFirst({where:{id:orderId,accountUserId:session.user.id},select:{orderNumber:true,shippingAddress:true,items:{select:{id:true}}}});if(!order)throw Error('Order not found.');const address=JSON.parse(order.shippingAddress);const lines=await getReorderLines(order.orderNumber,String(address.phone));return {lines,skipped:Math.max(0,order.items.length-lines.length)};}
