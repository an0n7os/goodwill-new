// Adds the shop's own photographed products (prisma/shop-products.json, photos in
// public/products/shop/<slug>-<n>.jpg). Prices are not known yet, so they are created
// with price 0 = "price on request" until updated in the admin panel.
// Safe to re-run: upserts by slug and never overwrites a price that has been set.
// Run: npx tsx prisma/seed-shop-products.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const db = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

interface ShopProduct {
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  photos: string[];
  specs: Record<string, string>;
  description: string;
}

// Sub-categories these products need, under existing top-level categories
const NEW_SUBCATEGORIES = [
  { slug: "extension-boards", name: "Extension Boards", parent: "electrical", sortOrder: 4 },
  { slug: "holders-accessories", name: "Holders & Accessories", parent: "electrical", sortOrder: 5 },
  { slug: "door-bells", name: "Door Bells", parent: "electrical", sortOrder: 6 },
  { slug: "fans", name: "Fans", parent: "electrical", sortOrder: 7 },
  { slug: "valves-fittings", name: "Valves & Fittings", parent: "plumbing", sortOrder: 2 },
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const list: ShopProduct[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "prisma", "shop-products.json"), "utf8"));

  for (const c of NEW_SUBCATEGORIES) {
    const parent = await db.category.findUnique({ where: { slug: c.parent } });
    if (!parent) throw new Error(`Parent category "${c.parent}" not found — run the main seed first.`);
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, parentId: parent.id },
      create: { slug: c.slug, name: c.name, parentId: parent.id, sortOrder: c.sortOrder },
    });
  }

  let created = 0;
  let updated = 0;
  for (const [i, p] of list.entries()) {
    const category = await db.category.findUnique({ where: { slug: p.category } });
    if (!category) throw new Error(`Category "${p.category}" not found for ${p.slug}`);

    let brandId: string | null = null;
    if (p.brand) {
      const brandSlug = slugify(p.brand);
      const brand =
        (await db.brand.findUnique({ where: { slug: brandSlug } })) ??
        (await db.brand.findFirst({ where: { name: p.brand } })) ??
        (await db.brand.create({ data: { name: p.brand, slug: brandSlug } }));
      brandId = brand.id;
    }

    const sku = `GW-${String(i + 1).padStart(3, "0")}-${p.slug.split("-").slice(0, 2).join("-").toUpperCase()}`;
    const data = {
      name: p.name,
      description: p.description,
      specs: JSON.stringify(p.specs),
      categoryId: category.id,
      brandId,
      isActive: true,
    };

    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    const product = existing
      ? await db.product.update({ where: { slug: p.slug }, data })
      : await db.product.create({ data: { ...data, slug: p.slug, sku, mrp: 0, price: 0, stock: 20, unit: "piece" } });
    existing ? updated++ : created++;

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: p.photos.map((_, n) => ({
        productId: product.id,
        url: `/products/shop/${p.slug}-${n + 1}.jpg`,
        alt: n === 0 ? p.name : `${p.name} — view ${n + 1}`,
        sortOrder: n,
      })),
    });
  }

  console.log(`Shop products: ${created} created, ${updated} updated (${list.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
