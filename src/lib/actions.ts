"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth, isGoogleAuthEnabled } from "./auth";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
  verifyAdminToken,
  verifyPassword,
  isHashedPassword,
  hashPassword,
} from "./adminSession";
import { requireAdmin } from "./adminGuard";
import { computeTotals } from "./pricing";
import { deliveryEstimate } from "./delivery";
import type { Prisma, Brand } from "@prisma/client";
import { fallbackBrands, fallbackCategories, fallbackProductBySlugOrId, fallbackProducts } from "./catalogFallback";

// Shapes returned by the storefront queries (the JSON fallback is cast to these)
type CategoryWithChildren = Prisma.CategoryGetPayload<{ include: { children: true } }>;
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { brand: true; category: { include: { parent: true } }; images: true; variants: true };
}>;

// ============ STOREFRONT ACTIONS ============

// Get categories with hierarchy
export async function getCategories() {
  try {
    return await db.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Error fetching categories, using catalogue snapshot:", error);
    return fallbackCategories() as unknown as CategoryWithChildren[];
  }
}

// Get featured brands
export async function getBrands() {
  try {
    return await db.brand.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching brands, using catalogue snapshot:", error);
    return fallbackBrands() as unknown as Brand[];
  }
}

// Get banners
export async function getBanners() {
  try {
    return await db.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

// Get products matching filters
export async function getProducts(filters: {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
}) {
  try {
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Category filter
    if (filters.category) {
      // Find subcategories if it's a parent
      const cat = await db.category.findUnique({
        where: { slug: filters.category },
        include: { children: true },
      });
      if (cat) {
        const catIds = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      }
    }

    // Brand filter
    if (filters.brand) {
      const b = await db.brand.findUnique({ where: { slug: filters.brand } });
      if (b) {
        where.brandId = b.id;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { nameML: { contains: searchLower } },
        { sku: { contains: searchLower } },
        { description: { contains: searchLower } },
        { brand: { name: { contains: searchLower } } },
      ];
    }

    // Price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = { gte: filters.minPrice, lte: filters.maxPrice };
    }

    // In Stock filter
    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (filters.sort) {
      switch (filters.sort) {
        case "price-low":
          orderBy = { price: "asc" };
          break;
        case "price-high":
          orderBy = { price: "desc" };
          break;
        case "popular":
          orderBy = { soldCount: "desc" };
          break;
        case "name-az":
          orderBy = { name: "asc" };
          break;
      }
    }

    return await db.product.findMany({
      where,
      include: {
        brand: true,
        category: { include: { parent: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy,
    });
  } catch (error) {
    console.error("Error fetching products, using catalogue snapshot:", error);
    return fallbackProducts(filters) as unknown as ProductWithRelations[];
  }
}

// Get single product details
export async function getProductById(idOrSlug: string) {
  try {
    return await db.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });
  } catch (error) {
    console.error("Error fetching product, using catalogue snapshot:", error);
    return fallbackProductBySlugOrId(idOrSlug) as unknown as ProductWithRelations | null;
  }
}

// Create an order (Guest / Logged-in checkout).
// Only identity, address, choices and item ids/quantities are trusted from the client:
// prices, stock, coupon and every total are re-derived from the database here.
export async function createOrder(orderData: {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  city: string;
  pincode: string;
  deliveryType: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
}) {
  const name = orderData.name?.trim();
  const phone = orderData.phone?.replace(/\D/g, "").slice(-10);
  const line1 = orderData.line1?.trim();
  const city = orderData.city?.trim();
  const pincode = orderData.pincode?.trim();
  const deliveryType = orderData.deliveryType === "pickup" ? "pickup" : "delivery";
  const paymentMethod = orderData.paymentMethod === "razorpay" ? "razorpay" : "cod";

  if (!name || !line1 || !city) return { success: false, error: "Please fill in all required address fields." };
  if (!phone || phone.length !== 10) return { success: false, error: "Please enter a valid 10-digit phone number." };
  if (!/^\d{6}$/.test(pincode || "")) return { success: false, error: "Please enter a valid 6-digit pincode." };
  if (deliveryType === "delivery" && !deliveryEstimate(pincode!)) {
    return { success: false, error: "Outside our regular delivery area. Choose store pickup or contact us on WhatsApp to arrange delivery." };
  }
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }
  for (const item of orderData.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) {
      return { success: false, error: "Invalid item quantity in cart." };
    }
  }

  // Retry a couple of times in case two orders race for the same order number
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.$transaction(async (tx) => {
        // Order number: GW-<year>-<running number for the year>
        const year = new Date().getFullYear();
        const prefix = `GW-${year}-`;
        const yearCount = await tx.order.count({ where: { orderNumber: { startsWith: prefix } } });
        const orderNo = `${prefix}${String(yearCount + 1 + attempt).padStart(4, "0")}`;

        // 1. Resolve every line from the DB and lock in current price / stock
        const lines: Array<{
          productId: string;
          variantId: string | null;
          name: string;
          variantName: string | null;
          price: number;
          quantity: number;
          gstRate: number;
        }> = [];

        for (const item of orderData.items) {
          const product = await tx.product.findFirst({ where: { id: item.productId, isActive: true } });
          if (!product) throw new Error("A product in your cart is no longer available.");
          if (!item.variantId && !(product.price > 0)) {
            throw new Error(`${product.name} is price on request. Please contact us on WhatsApp to order it.`);
          }

          if (item.variantId) {
            const variant = await tx.productVariant.findFirst({
              where: { id: item.variantId, productId: product.id },
            });
            if (!variant) throw new Error(`Selected option for ${product.name} is no longer available.`);
            if (!(variant.price > 0)) {
              throw new Error(`${product.name} (${variant.name}) is price on request. Please contact us on WhatsApp to order it.`);
            }

            // Conditional decrement so concurrent orders can't oversell
            const updated = await tx.productVariant.updateMany({
              where: { id: variant.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count === 0) throw new Error(`Out of stock: ${product.name} (${variant.name})`);

            await tx.stockMovement.create({
              data: {
                productId: product.id,
                variantId: variant.id,
                type: "sale",
                qty: item.quantity,
                balanceAfter: variant.stock - item.quantity,
                reason: `Customer Order: ${orderNo}`,
              },
            });
            lines.push({
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              variantName: variant.name,
              price: variant.price,
              quantity: item.quantity,
              gstRate: product.gstRate,
            });
          } else {
            const updated = await tx.product.updateMany({
              where: { id: product.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count === 0) throw new Error(`Out of stock: ${product.name}`);

            await tx.stockMovement.create({
              data: {
                productId: product.id,
                type: "sale",
                qty: item.quantity,
                balanceAfter: product.stock - item.quantity,
                reason: `Customer Order: ${orderNo}`,
              },
            });
            lines.push({
              productId: product.id,
              variantId: null,
              name: product.name,
              variantName: null,
              price: product.price,
              quantity: item.quantity,
              gstRate: product.gstRate,
            });
          }

          await tx.product.update({
            where: { id: product.id },
            data: { soldCount: { increment: item.quantity } },
          });
        }

        // 2. Re-validate the coupon against the DB subtotal
        const dbSubtotal = lines.reduce((acc, l) => acc + l.price * l.quantity, 0);
        let coupon: { code: string; type: string; value: number; maxDiscount: number | null } | null = null;
        if (orderData.couponCode) {
          const c = await tx.coupon.findUnique({ where: { code: orderData.couponCode.trim().toUpperCase() } });
          const valid =
            c &&
            c.isActive &&
            (!c.expiresAt || c.expiresAt > new Date()) &&
            (!c.usageLimit || c.usedCount < c.usageLimit) &&
            (!c.minOrder || dbSubtotal >= c.minOrder);
          if (!valid) throw new Error("Your coupon is no longer valid. Please remove it and try again.");
          coupon = c;
          await tx.coupon.update({ where: { code: c.code }, data: { usedCount: { increment: 1 } } });
        }

        const totals = computeTotals({ lines, coupon, deliveryType });

        // 3. Customer + address
        const email = orderData.email?.trim().toLowerCase() || null;
        let customer = await tx.customer.findUnique({ where: { phone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: { name, phone, email, tier: "retail" },
          });
        } else if (email && !customer.email) {
          // Lets a signed-in customer (matched by email) see this order in their account
          customer = await tx.customer.update({ where: { id: customer.id }, data: { email } });
        }
        const existingAddress = await tx.address.findFirst({ where: { customerId: customer.id, line1 } });
        if (!existingAddress) {
          await tx.address.create({
            data: { customerId: customer.id, name, phone, line1, city, pincode: pincode!, isDefault: true },
          });
        }

        // 4. Order + line items
        const newOrder = await tx.order.create({
          data: {
            orderNumber: orderNo,
            customerId: customer.id,
            subtotal: totals.subtotal,
            gstAmount: totals.gstAmount,
            deliveryCharge: totals.deliveryCharge,
            discount: totals.discount,
            total: totals.total,
            couponCode: coupon?.code ?? null,
            deliveryType,
            shippingAddress: JSON.stringify({ name, phone, line1, city, pincode }),
            status: "PLACED",
            paymentMethod,
            // No payment gateway is wired up yet, so nothing is "paid" at checkout
            paymentStatus: "pending",
            notes: orderData.notes?.trim().slice(0, 300) || null,
          },
        });

        await tx.orderEvent.create({
          data: { orderId: newOrder.id, status: "PLACED", actor: "customer" },
        });

        for (const l of lines) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: l.productId,
              productName: l.name,
              variantName: l.variantName,
              price: l.price,
              quantity: l.quantity,
              total: l.price * l.quantity,
            },
          });
        }

        return newOrder;
      });

      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/orders");
      revalidatePath("/admin/products");
      return { success: true, orderNumber: result.orderNumber, orderId: result.id };
    } catch (error: unknown) {
      // P2002 = unique constraint (order number collision) -> retry with the next number
      if (error && typeof error === "object" && "code" in error && error.code === "P2002" && attempt < 2) continue;
      console.error("Order Transaction Error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to place order. Please try again." };
    }
  }
  return { success: false, error: "Failed to place order. Please try again." };
}

// Create Bulk / Contractor Enquiry
export async function createEnquiry(enquiryData: {
  name: string;
  phone: string;
  email?: string;
  projectName?: string;
  requirement: string;
}) {
  try {
    const result = await db.bulkEnquiry.create({
      data: {
        name: enquiryData.name,
        phone: enquiryData.phone,
        email: enquiryData.email || null,
        projectName: enquiryData.projectName || null,
        requirement: enquiryData.requirement,
        status: "new",
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/enquiries");
    return { success: true, enquiryId: result.id };
  } catch (error) {
    console.error("Enquiry Creation Error:", error);
    return { success: false, error: "Failed to submit enquiry." };
  }
}

// Validate Coupon
export async function validateCoupon(code: string, cartTotal: number) {
  try {
    const coupon = await db.coupon.findUnique({
      where: { code, isActive: true },
    });

    if (!coupon) {
      return { valid: false, error: "Invalid coupon code." };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: "Coupon has expired." };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached." };
    }

    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return { valid: false, error: `Minimum order value of ₹${coupon.minOrder} required.` };
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Error checking coupon." };
  }
}

// ============ ADMIN / CRM ACTIONS ============

// Get Dashboard Statistics
export async function getAdminStats() {
  try {
    await requireAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales totals
    const totalOrdersCount = await db.order.count();
    const pendingOrdersCount = await db.order.count({
      where: { status: { in: ["PLACED", "CONFIRMED", "PACKED"] } },
    });

    // Today sales
    const todayOrders = await db.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: "CANCELLED" },
      },
    });
    const todaySales = todayOrders.reduce((acc, o) => acc + o.total, 0);

    // Monthly sales
    const monthlyOrders = await db.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    });
    const monthlySales = monthlyOrders.reduce((acc, o) => acc + o.total, 0);

    // Enquiries stats
    const totalEnquiries = await db.bulkEnquiry.count();
    const pendingEnquiries = await db.bulkEnquiry.count({
      where: { status: { in: ["new", "contacted"] } },
    });

    // Low stock alert list
    const lowStockProducts = await db.product.findMany({
      where: {
        isActive: true,
        stock: { lte: db.product.fields.lowStockAlert },
      },
      include: { brand: true },
      take: 5,
    });

    // Top selling products
    const topProducts = await db.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 5,
      include: { brand: true },
    });

    // Activity feed (Recent Orders)
    const recentActivity = await db.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Generate simple SVG-friendly sales history for charts (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayOrders = await db.order.findMany({
        where: {
          createdAt: { gte: d, lt: nextD },
          status: { not: "CANCELLED" },
        },
      });

      const daySalesTotal = dayOrders.reduce((acc, o) => acc + o.total, 0);
      chartData.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        sales: daySalesTotal,
        orders: dayOrders.length,
      });
    }

    return {
      todaySales,
      todayOrders: todayOrders.length,
      monthlySales,
      monthlyOrders: monthlyOrders.length,
      totalOrdersCount,
      pendingOrdersCount,
      totalEnquiries,
      pendingEnquiries,
      lowStockProducts,
      topProducts,
      recentActivity,
      chartData,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return {
      todaySales: 0,
      todayOrders: 0,
      monthlySales: 0,
      monthlyOrders: 0,
      totalOrdersCount: 0,
      pendingOrdersCount: 0,
      totalEnquiries: 0,
      pendingEnquiries: 0,
      lowStockProducts: [],
      topProducts: [],
      recentActivity: [],
      chartData: [],
    };
  }
}

// Get admin products list
export async function getAdminProductsList() {
  try {
    await requireAdmin();
    return await db.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting admin products list:", error);
    return [];
  }
}

// Inline edit stock quantity
export async function updateStockInline(
  productId: string,
  variantId: string | null,
  newStock: number
) {
  try {
    await requireAdmin();
    if (variantId) {
      const variant = await db.productVariant.findUnique({ where: { id: variantId } });
      const currentStock = variant?.stock || 0;
      await db.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });
      await db.stockMovement.create({
        data: {
          productId,
          variantId,
          type: "adjustment",
          qty: newStock - currentStock,
          balanceAfter: newStock,
          reason: "Admin inline stock manual edit",
        },
      });
    } else {
      const product = await db.product.findUnique({ where: { id: productId } });
      const currentStock = product?.stock || 0;
      await db.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });
      await db.stockMovement.create({
        data: {
          productId,
          type: "adjustment",
          qty: newStock - currentStock,
          balanceAfter: newStock,
          reason: "Admin inline stock manual edit",
        },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating stock inline:", error);
    return { success: false, error: "Failed to update stock." };
  }
}

// Inline edit price
export async function updatePriceInline(
  productId: string,
  variantId: string | null,
  newPrice: number
) {
  try {
    await requireAdmin();
    if (variantId) {
      await db.productVariant.update({
        where: { id: variantId },
        data: { price: newPrice },
      });
    } else {
      await db.product.update({
        where: { id: productId },
        data: { price: newPrice },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error updating price inline:", error);
    return { success: false, error: "Failed to update price." };
  }
}

// Get admin orders
export async function getAdminOrdersList() {
  try {
    await requireAdmin();
    return await db.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting admin orders list:", error);
    return [];
  }
}

// Get admin enquiries
export async function getAdminEnquiriesList() {
  try {
    await requireAdmin();
    return await db.bulkEnquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting admin enquiries list:", error);
    return [];
  }
}

// Update enquiry CRM status (new, contacted, quoted_sent, won, lost)
export async function updateEnquiryStatus(enquiryId: string, newStatus: string) {
  try {
    await requireAdmin();
    await db.bulkEnquiry.update({
      where: { id: enquiryId },
      data: { status: newStatus },
    });

    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    return { success: false, error: "Failed to update enquiry status." };
  }
}

// Get customer database
export async function getAdminCustomersList() {
  try {
    await requireAdmin();
    return await db.customer.findMany({
      include: {
        orders: true,
        addresses: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error getting admin customer list:", error);
    return [];
  }
}

// Create new product inside CRM
export async function createProductAdmin(data: {
  name: string;
  nameML?: string;
  slug: string;
  sku: string;
  description?: string;
  descriptionML?: string;
  mrp: number;
  price: number;
  costPrice?: number;
  gstRate?: number;
  unit?: string;
  stock: number;
  categoryId: string;
  brandId?: string;
  imageUrl?: string;
}) {
  try {
    await requireAdmin();
    const product = await db.product.create({
      data: {
        name: data.name,
        nameML: data.nameML || null,
        slug: data.slug,
        sku: data.sku,
        description: data.description || null,
        descriptionML: data.descriptionML || null,
        mrp: data.mrp,
        price: data.price,
        costPrice: data.costPrice || null,
        gstRate: data.gstRate || 18,
        unit: data.unit || "piece",
        stock: data.stock,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        isActive: true,
      },
    });

    if (data.imageUrl) {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: data.imageUrl,
          alt: data.name,
          sortOrder: 0,
        },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    return { success: false, error: (error instanceof Error ? error.message : "Unexpected error") || "Failed to create product" };
  }
}

// Update existing product inside CRM
export async function updateProductAdmin(
  productId: string,
  data: {
    name: string;
    nameML?: string;
    slug: string;
    sku: string;
    description?: string;
    descriptionML?: string;
    mrp: number;
    price: number;
    costPrice?: number;
    gstRate?: number;
    unit?: string;
    stock: number;
    categoryId: string;
    brandId?: string;
    imageUrl?: string;
  }
) {
  try {
    await requireAdmin();
    const product = await db.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        nameML: data.nameML || null,
        slug: data.slug,
        sku: data.sku,
        description: data.description || null,
        descriptionML: data.descriptionML || null,
        mrp: data.mrp,
        price: data.price,
        costPrice: data.costPrice || null,
        gstRate: data.gstRate || 18,
        unit: data.unit || "piece",
        stock: data.stock,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
      },
    });

    // Only the main photo is edited here; extra gallery photos are kept
    if (data.imageUrl) {
      const main = await db.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
      if (main) {
        if (main.url !== data.imageUrl) {
          await db.productImage.update({ where: { id: main.id }, data: { url: data.imageUrl, alt: data.name } });
        }
      } else {
        await db.productImage.create({ data: { productId, url: data.imageUrl, alt: data.name, sortOrder: 0 } });
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/");
    return { success: true, product };
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    return { success: false, error: (error instanceof Error ? error.message : "Unexpected error") || "Failed to update product" };
  }
}

// Bulk import products from CSV / JSON dataset
export async function bulkImportProducts(
  rows: Array<{
    name: string;
    sku: string;
    price: number;
    mrp: number;
    costPrice?: number;
    stock: number;
    categoryName: string;
    brandName?: string;
    imageUrl?: string;
  }>
) {
  try {
    await requireAdmin();
    let createdCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (!row.name || !row.sku || !row.price) {
        skippedCount++;
        continue;
      }

      // Check if SKU exists
      const existing = await db.product.findUnique({
        where: { sku: row.sku },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Find or create Category
      const catSlug = row.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let category = await db.category.findFirst({
        where: { OR: [{ name: row.categoryName }, { slug: catSlug }] },
      });

      if (!category) {
        category = await db.category.create({
          data: {
            name: row.categoryName,
            slug: catSlug,
          },
        });
      }

      // Find or create Brand if provided
      let brandId: string | null = null;
      if (row.brandName) {
        const brandSlug = row.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let brand = await db.brand.findFirst({
          where: { OR: [{ name: row.brandName }, { slug: brandSlug }] },
        });

        if (!brand) {
          brand = await db.brand.create({
            data: {
              name: row.brandName,
              slug: brandSlug,
            },
          });
        }
        brandId = brand.id;
      }

      const prodSlug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 1000);

      // Create product
      const newProd = await db.product.create({
        data: {
          name: row.name,
          slug: prodSlug,
          sku: row.sku,
          mrp: Number(row.mrp) || Number(row.price),
          price: Number(row.price),
          costPrice: row.costPrice ? Number(row.costPrice) : null,
          stock: Number(row.stock) || 10,
          categoryId: category.id,
          brandId,
        },
      });

      if (row.imageUrl) {
        await db.productImage.create({
          data: {
            productId: newProd.id,
            url: row.imageUrl,
            alt: row.name,
            sortOrder: 0,
          },
        });
      }

      createdCount++;
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, createdCount, skippedCount };
  } catch (error: unknown) {
    console.error("Error bulk importing products:", error);
    return { success: false, error: (error instanceof Error ? error.message : "Unexpected error") || "Failed to bulk import products" };
  }
}

// Admin login action
export async function loginAdminUser(email: string, pass: string) {
  try {
    const user = await db.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Same message for unknown email and wrong password, so accounts can't be enumerated
    if (!user || !user.isActive || !verifyPassword(pass, user.password)) {
      return { success: false, error: "Invalid email or password." };
    }

    // Update last login time, and upgrade a legacy plain-text password to a scrypt hash
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        ...(isHashedPassword(user.password) ? {} : { password: hashPassword(pass) }),
      },
    });

    (await cookies()).set(
      ADMIN_COOKIE,
      createAdminToken({ id: user.id, name: user.name, email: user.email, role: user.role }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_SESSION_MAX_AGE,
      }
    );

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: unknown) {
    console.error("Error logging in admin user:", error);
    return { success: false, error: "Authentication failed. Try again." };
  }
}

export async function logoutAdminUser() {
  (await cookies()).delete(ADMIN_COOKIE);
  return { success: true };
}

// Current admin (for the admin shell's name / role display)
export async function getAdminSession() {
  const session = verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  return session ? { name: session.name, email: session.email, role: session.role } : null;
}

// Service Request submission action
export async function createServiceRequest(data: {
  serviceType: string;
  name: string;
  phone: string;
  location: string;
  preferredDate?: string;
  details?: string;
}) {
  try {
    const req = await db.serviceRequest.create({
      data: {
        serviceType: data.serviceType,
        name: data.name,
        phone: data.phone,
        location: data.location,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        details: data.details || null,
        status: "new",
      },
    });

    return { success: true, request: req };
  } catch (error: unknown) {
    console.error("Error creating service request:", error);
    return { success: false, error: (error instanceof Error ? error.message : "Unexpected error") || "Failed to submit service request." };
  }
}

// Fetch all customers for CRM Customer Directory
export async function getCustomersAdmin() {
  try {
    await requireAdmin();
    const customers = await db.customer.findMany({
      include: {
        orders: {
          select: { id: true, total: true, status: true, createdAt: true },
        },
        addresses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return customers.map((c) => {
      const totalOrders = c.orders.length;
      const totalSpent = c.orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.total : 0), 0);
      return {
        ...c,
        totalOrders,
        totalSpent,
      };
    });
  } catch (error) {
    console.error("Error fetching customers for admin:", error);
    return [];
  }
}

// ============ CUSTOMER ACCOUNTS ============
// Sign-in / sign-up run through Better Auth (src/lib/auth.ts, client in src/lib/authClient.ts).
// These actions read that session on the server.

async function currentCustomer() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    const u = session.user as typeof session.user & { phone?: string | null };
    return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? null, image: u.image ?? null };
  } catch (error) {
    console.error("Customer session error:", error);
    return null;
  }
}

export async function logoutCustomer() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Already signed out
  }
  return { success: true };
}

// Current signed-in customer (null when signed out or the session expired)
export async function getCustomerSession() {
  return currentCustomer();
}

export async function getAuthProviders() {
  return { google: isGoogleAuthEnabled };
}

