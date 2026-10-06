"use server";

// Admin panel actions for catalogue setup, coupons and settings.
// Every export is a public endpoint, so each one starts with requireAdmin()/requireOwner().
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin, requireOwner } from "./adminGuard";
import { hashPassword, verifyPassword } from "./adminSession";

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function fail(error: unknown, fallback: string): { success: false; error: string } {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Unauthorized") || message.startsWith("Only the shop owner")) return { success: false, error: message };
  if (message.includes("Unique constraint")) return { success: false, error: "That name, code or slug is already in use." };
  return { success: false, error: fallback };
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
}

// ============ PRODUCTS ============

export async function setProductFlags(productId: string, flags: { isActive?: boolean; isFeatured?: boolean }): Promise<Result> {
  try {
    await requireAdmin();
    await db.product.update({
      where: { id: productId },
      data: {
        ...(flags.isActive !== undefined ? { isActive: flags.isActive } : {}),
        ...(flags.isFeatured !== undefined ? { isFeatured: flags.isFeatured } : {}),
      },
    });
    revalidateStorefront();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not update the product.");
  }
}

// Products that appear on past orders are hidden instead of deleted, so invoices stay intact
export async function deleteProductAdmin(productId: string): Promise<Result<{ archived: boolean }>> {
  try {
    await requireAdmin();
    const orderLines = await db.orderItem.count({ where: { productId } });
    if (orderLines > 0) {
      await db.product.update({ where: { id: productId }, data: { isActive: false } });
      revalidateStorefront();
      return { success: true, archived: true };
    }
    await db.$transaction([
      db.stockMovement.deleteMany({ where: { productId } }),
      db.product.delete({ where: { id: productId } }),
    ]);
    revalidateStorefront();
    return { success: true, archived: false };
  } catch (error) {
    return fail(error, "Could not delete the product.");
  }
}

// ============ CATEGORIES & BRANDS ============

export async function getCatalogSetup() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([
    db.category.findMany({
      include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true, children: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  return { categories, brands };
}

export async function saveCategory(input: {
  id?: string;
  name: string;
  nameML?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<Result> {
  try {
    await requireAdmin();
    const name = input.name?.trim();
    if (!name) return { success: false, error: "Category name is required." };
    if (input.id && input.parentId === input.id) return { success: false, error: "A category can't be its own parent." };

    const data = {
      name,
      nameML: input.nameML?.trim() || null,
      parentId: input.parentId || null,
      sortOrder: Number(input.sortOrder) || 0,
      isActive: input.isActive ?? true,
    };
    if (input.id) await db.category.update({ where: { id: input.id }, data });
    else await db.category.create({ data: { ...data, slug: slugify(name) } });
    revalidateStorefront();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not save the category.");
  }
}

export async function deleteCategory(id: string): Promise<Result> {
  try {
    await requireAdmin();
    const [products, children] = await Promise.all([
      db.product.count({ where: { categoryId: id } }),
      db.category.count({ where: { parentId: id } }),
    ]);
    if (products > 0 || children > 0) {
      return { success: false, error: "Move its products and sub-categories first, or hide it instead." };
    }
    await db.category.delete({ where: { id } });
    revalidateStorefront();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not delete the category.");
  }
}

export async function saveBrand(input: {
  id?: string;
  name: string;
  logo?: string;
  tagline?: string;
  isFeatured?: boolean;
  sortOrder?: number;
}): Promise<Result> {
  try {
    await requireAdmin();
    const name = input.name?.trim();
    if (!name) return { success: false, error: "Brand name is required." };
    const data = {
      name,
      logo: input.logo?.trim() || null,
      tagline: input.tagline?.trim() || null,
      isFeatured: Boolean(input.isFeatured),
      sortOrder: Number(input.sortOrder) || 0,
    };
    if (input.id) await db.brand.update({ where: { id: input.id }, data });
    else await db.brand.create({ data: { ...data, slug: slugify(name) } });
    revalidateStorefront();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not save the brand.");
  }
}

export async function deleteBrand(id: string): Promise<Result> {
  try {
    await requireAdmin();
    const products = await db.product.count({ where: { brandId: id } });
    if (products > 0) return { success: false, error: `${products} product(s) use this brand. Reassign them first.` };
    await db.brand.delete({ where: { id } });
    revalidateStorefront();
    return { success: true };
  } catch (error) {
    return fail(error, "Could not delete the brand.");
  }
}

// ============ COUPONS ============

export async function getCouponsAdmin() {
  await requireAdmin();
  return db.coupon.findMany({ orderBy: [{ isActive: "desc" }, { code: "asc" }] });
}

const COUPON_TYPES = ["percentage", "flat", "free_delivery"] as const;

export async function saveCoupon(input: {
  id?: string;
  code: string;
  type: string;
  value: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}): Promise<Result> {
  try {
    await requireAdmin();
    const code = input.code?.trim().toUpperCase().replace(/\s+/g, "");
    if (!code || !/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return { success: false, error: "Code must be 3–20 letters, numbers, - or _." };
    }
    if (!COUPON_TYPES.includes(input.type as (typeof COUPON_TYPES)[number])) {
      return { success: false, error: "Choose a coupon type." };
    }
    const value = input.type === "free_delivery" ? 0 : Number(input.value);
    if (input.type !== "free_delivery" && !(value > 0)) return { success: false, error: "Enter a discount value above 0." };
    if (input.type === "percentage" && value > 90) return { success: false, error: "Percentage discount can't exceed 90%." };

    const optional = (n: number | null | undefined) => (n && Number(n) > 0 ? Number(n) : null);
    const data = {
      code,
      type: input.type,
      value,
      minOrder: optional(input.minOrder),
      maxDiscount: input.type === "percentage" ? optional(input.maxDiscount) : null,
      usageLimit: optional(input.usageLimit) ? Math.floor(Number(input.usageLimit)) : null,
      expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T23:59:59+05:30`) : null,
      isActive: input.isActive ?? true,
    };
    if (input.id) await db.coupon.update({ where: { id: input.id }, data });
    else await db.coupon.create({ data });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not save the coupon.");
  }
}

export async function setCouponActive(id: string, isActive: boolean): Promise<Result> {
  try {
    await requireAdmin();
    await db.coupon.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not update the coupon.");
  }
}

export async function deleteCoupon(id: string): Promise<Result> {
  try {
    await requireAdmin();
    await db.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not delete the coupon.");
  }
}

// ============ SETTINGS: ADMIN ACCOUNTS ============

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<Result> {
  try {
    const session = await requireAdmin();
    if (!newPassword || newPassword.length < 10) return { success: false, error: "New password must be at least 10 characters." };
    const user = await db.adminUser.findUnique({ where: { id: session.id } });
    if (!user || !verifyPassword(currentPassword || "", user.password)) {
      return { success: false, error: "Current password is incorrect." };
    }
    await db.adminUser.update({ where: { id: user.id }, data: { password: hashPassword(newPassword) } });
    return { success: true };
  } catch (error) {
    return fail(error, "Could not change the password.");
  }
}

export async function getAdminUsers() {
  const session = await requireAdmin();
  const users = await db.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return { me: { id: session.id, role: session.role }, users };
}

const ADMIN_ROLES = ["owner", "manager", "staff"] as const;

export async function createAdminUserAccount(input: {
  name: string;
  email: string;
  role: string;
  password: string;
}): Promise<Result> {
  try {
    await requireOwner();
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!name) return { success: false, error: "Name is required." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: "Enter a valid email." };
    if (!ADMIN_ROLES.includes(input.role as (typeof ADMIN_ROLES)[number])) return { success: false, error: "Choose a role." };
    if (!input.password || input.password.length < 10) return { success: false, error: "Password must be at least 10 characters." };
    await db.adminUser.create({ data: { name, email, role: input.role, password: hashPassword(input.password) } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not create the account.");
  }
}

export async function setAdminUserActive(id: string, isActive: boolean): Promise<Result> {
  try {
    const session = await requireOwner();
    if (id === session.id) return { success: false, error: "You can't disable your own account." };
    await db.adminUser.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    return fail(error, "Could not update the account.");
  }
}
