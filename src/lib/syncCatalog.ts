import fs from "node:fs";
import path from "node:path";
import { db } from "./db";

/**
 * Synchronizes the local dev.db database catalog to src/data/catalog.json
 * so that both the Admin Dashboard and the Public Storefront share 100% identical,
 * up-to-date data with full relations and image URLs.
 */
export async function syncCatalogSnapshot() {
  try {
    const [products, categories, brands, variants, images] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
      db.category.findMany({
        where: { isActive: true },
        include: { children: { where: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      db.brand.findMany({ orderBy: { name: "asc" } }),
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

    const publicProducts = products.map((p) => {
      const { costPrice, ...rest } = p;
      void costPrice;
      return {
        ...rest,
        category: catMap.get(p.categoryId) || null,
        brand: p.brandId ? brandMap.get(p.brandId) || null : null,
        variants: varMap.get(p.id) || [],
        images: imgMap.get(p.id) || [],
      };
    });

    const out = path.join(process.cwd(), "src", "data", "catalog.json");
    fs.writeFileSync(
      out,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          products: publicProducts,
          categories,
          brands,
        },
        null,
        1
      )
    );
    return { success: true, count: publicProducts.length };
  } catch (err: unknown) {
    console.error("Error syncing catalog snapshot:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
