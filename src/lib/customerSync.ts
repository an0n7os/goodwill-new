"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { CartItem } from "@/store/cart";
import { minimumQuantity } from "./units";

export interface SyncCartInput {
  id: string; // CartItem.id
  productId: string;
  variantId?: string | null;
  quantity: number;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600";

// Fetch user session helper
async function getSessionUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch (error) {
    console.error("Session lookup error in customerSync:", error);
    return null;
  }
}

/**
 * Sync guest local cart with signed-in user's database cart:
 * - Upserts local items into the database.
 * - Loads all items stored in user's DB cart.
 * - Fetches fresh catalog data (price, stock, image, unit, etc.) for each.
 * - Returns the unified CartItem list.
 */
export async function syncCustomerCart(clientItems: SyncCartInput[] = []): Promise<{
  ok: boolean;
  signedIn: boolean;
  items: CartItem[];
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, signedIn: false, items: [] };
  }

  const userId = user.id;

  try {
    // 1. Merge client items into DB
    for (const item of clientItems) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const itemId = item.id || (item.variantId ? item.variantId : item.productId);

      const existing = await db.customerCartItem.findUnique({
        where: {
          userId_itemId: { userId, itemId },
        },
      });

      if (existing) {
        // Keep the higher or recent quantity
        const mergedQty = Math.max(existing.quantity, item.quantity);
        await db.customerCartItem.update({
          where: { id: existing.id },
          data: { quantity: mergedQty },
        });
      } else {
        await db.customerCartItem.create({
          data: {
            userId,
            itemId,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          },
        });
      }
    }

    // 2. Fetch all cart items from DB for this user
    const dbItems = await db.customerCartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (dbItems.length === 0) {
      return { ok: true, signedIn: true, items: [] };
    }

    // 3. Hydrate with latest product and variant data
    const enrichedItems: CartItem[] = [];

    for (const row of dbItems) {
      const product = await db.product.findUnique({
        where: { id: row.productId },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: true,
        },
      });

      if (!product || !product.isActive) {
        // Product no longer available; remove stale cart item
        await db.customerCartItem.delete({ where: { id: row.id } }).catch(() => {});
        continue;
      }

      let price = product.price;
      let sku = product.sku;
      let stock = product.stock;
      let variantName: string | null = null;

      if (row.variantId) {
        const variant = product.variants.find((v) => v.id === row.variantId);
        if (variant) {
          price = variant.price;
          sku = variant.sku;
          stock = variant.stock;
          variantName = variant.name;
        }
      }

      if (stock <= 0) {
        // Out of stock, don't include in checkoutable cart
        continue;
      }

      const rawImage = product.images?.[0]?.url || FALLBACK_IMAGE;
      const image = rawImage.startsWith("/products/lisha-generated/") && rawImage.endsWith(".webp")
        ? rawImage.replace("/lisha-generated/", "/lisha-thumbnails/")
        : rawImage;

      const safeQuantity = Math.min(Math.max(row.quantity, minimumQuantity(product.unit)), stock);

      enrichedItems.push({
        id: row.itemId,
        productId: product.id,
        name: product.name,
        price,
        image,
        quantity: safeQuantity,
        variantName,
        sku,
        unit: product.unit,
        stock,
        gstRate: product.gstRate,
      });
    }

    return { ok: true, signedIn: true, items: enrichedItems };
  } catch (error) {
    console.error("Failed to sync customer cart:", error);
    return { ok: false, signedIn: true, items: [] };
  }
}

/**
 * Persist current cart items to database for signed-in user.
 */
export async function persistCustomerCart(items: SyncCartInput[]): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const userId = user.id;

  try {
    const itemIds = items.map((i) => i.id || (i.variantId ? i.variantId : i.productId));

    // Delete items no longer in cart
    await db.customerCartItem.deleteMany({
      where: {
        userId,
        itemId: { notIn: itemIds },
      },
    });

    // Upsert remaining items
    for (const item of items) {
      if (!item.productId || !(item.quantity > 0)) continue;
      const itemId = item.id || (item.variantId ? item.variantId : item.productId);

      await db.customerCartItem.upsert({
        where: {
          userId_itemId: { userId, itemId },
        },
        create: {
          userId,
          itemId,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        },
        update: {
          quantity: item.quantity,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to persist customer cart:", error);
    return false;
  }
}

/**
 * Sync guest local favorites with signed-in user's database favorites.
 */
export async function syncCustomerFavorites(clientProductIds: string[] = []): Promise<{
  ok: boolean;
  signedIn: boolean;
  favorites: string[];
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, signedIn: false, favorites: clientProductIds };
  }

  const userId = user.id;

  try {
    // 1. Merge client favorites into DB
    for (const productId of clientProductIds) {
      if (!productId) continue;
      await db.customerFavorite.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        create: {
          userId,
          productId,
        },
        update: {},
      });
    }

    // 2. Fetch all user favorites from DB
    const dbFavorites = await db.customerFavorite.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    const favorites = dbFavorites.map((f) => f.productId);
    return { ok: true, signedIn: true, favorites };
  } catch (error) {
    console.error("Failed to sync customer favorites:", error);
    return { ok: false, signedIn: true, favorites: clientProductIds };
  }
}

/**
 * Toggle favorite for a product in the user's account.
 */
export async function toggleCustomerFavoriteAction(productId: string): Promise<{
  ok: boolean;
  signedIn: boolean;
  isFavorite: boolean;
  favorites: string[];
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, signedIn: false, isFavorite: false, favorites: [] };
  }

  const userId = user.id;

  try {
    const existing = await db.customerFavorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      await db.customerFavorite.delete({ where: { id: existing.id } });
    } else {
      await db.customerFavorite.create({
        data: { userId, productId },
      });
    }

    const all = await db.customerFavorite.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    const favorites = all.map((f) => f.productId);
    return {
      ok: true,
      signedIn: true,
      isFavorite: !existing,
      favorites,
    };
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return { ok: false, signedIn: true, isFavorite: false, favorites: [] };
  }
}

/**
 * Detailed favorite products for Wishlist / Saved items page or drawer.
 */
export async function getCustomerFavoritesDetailed() {
  const user = await getSessionUser();
  if (!user) return [];

  try {
    const favs = await db.customerFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (favs.length === 0) return [];

    const productIds = favs.map((f) => f.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { select: { id: true, stock: true } },
      },
    });

    // Preserve order of favorites
    const productMap = new Map(products.map((p) => [p.id, p]));
    return productIds.map((id) => productMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error("Failed to get detailed favorites:", error);
    return [];
  }
}

/**
 * Fetch catalog products by specific product IDs (works for guest or logged-in users).
 */
export async function getFavoriteProductsByIds(productIds: string[]) {
  if (!productIds || productIds.length === 0) return [];
  try {
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { select: { id: true, stock: true } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return productIds.map((id) => productMap.get(id)).filter(Boolean);
  } catch (error) {
    console.error("Failed to load favorite products by IDs:", error);
    return [];
  }
}
