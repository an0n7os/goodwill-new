"use server";

import { db } from "./db";
import { readProducts, readProduct, readCategories, readBrands, readBanners, type CatalogFilters } from "./liveCatalog";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth, isGoogleAuthEnabled } from "./auth";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
  verifyPassword,
  isHashedPassword,
  hashPassword,
} from "./adminSession";
import { requireAdmin } from "./adminGuard";
import { placeOrderCore, type OrderInput } from "./business/orders";
import {adjustStock} from "./business/stock";
import {saveProductCore,type ProductEdit} from "./business/products";
import {audit, manager} from "./business/shared";
import {businessMessage} from "./business/errors";
import {checkRateLimit,clearRateLimit} from "./business/rateLimit";
import {deliveryQuote, readDeliveryRules} from "./deliveryPolicy";
import {escapeHtml} from "./site";
import {orderNotification,queueEmail,sendNotification} from "./business/notifications";
import {after} from "next/server";

// Storefront and admin share the same configured database.
export async function getCategories() { return readCategories(); }
export async function getBrands() { return readBrands(); }
export async function getBanners() { return readBanners(); }
export async function getProducts(filters: CatalogFilters) { return readProducts(filters); }
export async function getProductById(idOrSlug: string) { return readProduct(idOrSlug); }

// Create an order (Guest / Logged-in checkout).
// Only identity, address, choices and item ids/quantities are trusted from the client:
// prices, stock, coupon and every total are re-derived from the database here.
export async function createOrder(orderData: OrderInput) {
  try {
    if(orderData.deliveryType === "delivery" && !deliveryQuote(await readDeliveryRules(), orderData.pincode?.trim() || "")) {
      return {success:false,error:"Outside our regular delivery area. Choose store pickup or contact us on WhatsApp to arrange delivery."};
    }
    const session = await auth.api.getSession({headers:await headers()});
    const result = await placeOrderCore(orderData, undefined, session?.user.id);
    if(!result.replayed) after(async()=>{await orderNotification(result.order.id,"PLACED").catch(()=>{});});
    revalidatePath("/admin/orders"); revalidatePath("/admin/products"); revalidatePath("/admin/dashboard");
    revalidatePath("/products"); revalidatePath("/product/[slug]", "page"); revalidatePath("/");
    return {success:true,orderNumber:result.order.orderNumber,orderId:result.order.id};
  } catch(error) { return {success:false,error:businessMessage(error)}; }
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

    after(async()=>{for(const recipient of new Set([process.env.ADMIN_NOTIFICATION_EMAIL,enquiryData.email].filter((x):x is string=>Boolean(x)))){const n=await queueEmail({key:'enquiry-'+result.id+'-'+recipient,recipient,subject:'Goodwill material-list enquiry received',html:`<h2>Enquiry received</h2><p>${escapeHtml(enquiryData.name)}</p><p>${escapeHtml(enquiryData.projectName)}</p><p>${escapeHtml(enquiryData.requirement)}</p><p>The shop will review the material list and contact you with a quotation.</p>`});if(n)await sendNotification(n.id);}});

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
    const lowStockProducts = (await db.product.findMany({
      where: { isActive: true },
      include: { brand: true },
    })).filter(product=>product.stock<=product.lowStockAlert).slice(0,5);

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

// Get admin products list (Optimized in-memory join to prevent SQLite parameter limit P2029)
export async function getAdminProductsList() {
  try {
    await requireAdmin();
    const [products, categories, brands, variants, images] = await Promise.all([
      db.product.findMany({ orderBy: { createdAt: "desc" } }),
      db.category.findMany(),
      db.brand.findMany(),
      db.productVariant.findMany(),
      db.productImage.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));
    const varMap = new Map<string, typeof variants>();
    for (const v of variants) {
      const arr = varMap.get(v.productId) || [];
      arr.push(v);
      varMap.set(v.productId, arr);
    }
    const imgMap = new Map<string, typeof images>();
    for (const img of images) {
      const arr = imgMap.get(img.productId) || [];
      arr.push(img);
      imgMap.set(img.productId, arr);
    }

    return products.map((p) => ({
      ...p,
      category: catMap.get(p.categoryId) || null,
      brand: p.brandId ? brandMap.get(p.brandId) || null : null,
      variants: varMap.get(p.id) || [],
      images: imgMap.get(p.id) || [],
    })) as unknown as (typeof products[0] & {
      category: typeof categories[0] | null;
      brand: typeof brands[0] | null;
      variants: typeof variants;
      images: typeof images;
    })[];
  } catch (error) {
    console.error("Error getting admin products list:", error);
    return [];
  }
}

// Manually trigger catalogue sync between admin DB and storefront
export async function syncWebsiteCatalogAction(): Promise<{success:true;count:number}|{success:false;error:string}> {
  try {
    await requireAdmin();
    const count = await db.product.count({ where: { isActive: true } });
    const res = { success: true as const, count };
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/");
    revalidatePath("/");
    return res;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}

// Inline edit stock quantity
export async function updateStockInline(productId:string,variantId:string|null,newStock:number,expectedStock?:number) {
 try {const admin=await requireAdmin(); await adjustStock({productId,variantId,stock:newStock,expectedStock,reason:"Admin stock adjustment"},admin);
 revalidatePath("/admin/products");revalidatePath("/admin/dashboard");revalidatePath("/products");revalidatePath("/product/[slug]","page");revalidatePath("/");return {success:true};
 } catch(error){return {success:false,error:error instanceof Error?error.message:"Could not update stock."};}
}

// Inline edit price
export async function updatePriceInline(productId:string,variantId:string|null,newPrice:number) {
 try {const admin=await requireAdmin();manager(admin);if(!Number.isFinite(newPrice)||newPrice<0)throw Error("Enter a valid non-negative price.");
 await db.$transaction(async tx=>{if(variantId){const v=await tx.productVariant.findFirst({where:{id:variantId,productId}});if(!v)throw Error("Variant does not belong to product.");await tx.productVariant.update({where:{id:variantId},data:{price:newPrice}});}else await tx.product.update({where:{id:productId},data:{price:newPrice}});await audit(tx,admin,"price.update",productId,{variantId,price:newPrice});});
 revalidatePath("/admin/products");revalidatePath("/products");revalidatePath("/product/[slug]","page");revalidatePath("/");return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Could not update price."};}
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
export async function createProductAdmin(data:ProductEdit){
 try{const product=await saveProductCore(data,await requireAdmin());revalidatePath("/","layout");return {success:true,product};}
 catch(e){return {success:false,error:e instanceof Error?e.message:"Could not create product."};}
}
export async function updateProductAdmin(productId:string,data:ProductEdit){
 try{const product=await saveProductCore(data,await requireAdmin(),productId);revalidatePath("/","layout");return {success:true,product};}
 catch(e){return {success:false,error:e instanceof Error?e.message:"Could not update product."};}
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
    const actor=await requireAdmin(); manager(actor);
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

      await saveProductCore({name:row.name,slug:prodSlug,sku:row.sku,mrp:Number(row.mrp)||Number(row.price),price:Number(row.price),costPrice:row.costPrice?Number(row.costPrice):undefined,stock:Number(row.stock)||0,categoryId:category.id,brandId:brandId||undefined,imageUrl:row.imageUrl},actor);

      createdCount++;
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/product/[slug]", "page");
    revalidatePath("/");
    revalidatePath("/");

    return { success: true, createdCount, skippedCount };
  } catch (error: unknown) {
    console.error("Error bulk importing products:", error);
    return { success: false, error: (error instanceof Error ? error.message : "Unexpected error") || "Failed to bulk import products" };
  }
}

// Admin login action
export async function loginAdminUser(email: string, pass: string) {
  email = email.toLowerCase().trim();
  if (email === "admin") email = "admin@goodwill.com";
  try {
    if(!await checkRateLimit("admin-login",email||"unknown"))return {success:false,error:"Too many attempts. Please try again in 15 minutes."};
    const user = await db.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Same message for unknown email and wrong password, so accounts can't be enumerated
    if (!user || !user.isActive || !verifyPassword(pass, user.password)) {
      return { success: false, error: "Invalid username or password." };
    }

    await clearRateLimit("admin-login",email);
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
      createAdminToken({ id: user.id, name: user.name, email: user.email, role: user.role, version: user.sessionVersion }),
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
        version:user.sessionVersion,
      },
    };
  } catch (error: unknown) {
    console.error("Error logging in admin user:", error);
    return { success: false, error: "Authentication failed. Try again." };
  }
}

export async function logoutAdminUser() {
  const cookieStore = await cookies();
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
  cookieStore.set(ADMIN_COOKIE, "", clearOptions);
  cookieStore.delete(ADMIN_COOKIE);
  cookieStore.set("gw_admin_session", "", clearOptions);
  cookieStore.delete("gw_admin_session");
  cookieStore.set("gw_admin_workflow_session", "", clearOptions);
  cookieStore.delete("gw_admin_workflow_session");

  revalidatePath("/admin", "layout");
  return { success: true };
}

// Current admin (for the admin shell's name / role display)
export async function getAdminSession(){try{return await requireAdmin();}catch{return null;}}

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

