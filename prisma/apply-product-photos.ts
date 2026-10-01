// Sets each product's image to the curated Unsplash photo in prisma/product-photos.json
// (free to use under the Unsplash License). Safe to re-run.
// Run: npx tsx prisma/apply-product-photos.ts          (all mapped products)
//      npx tsx prisma/apply-product-photos.ts --keep-uploads   (skip products whose photo was uploaded in admin)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const db = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

const photos: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "prisma", "product-photos.json"), "utf8")
);
const keepUploads = process.argv.includes("--keep-uploads");
export const photoUrl = (id: string) => `https://images.unsplash.com/${id}?w=1200&h=1200&fit=crop&auto=format&q=80`;

async function main() {
  const products = await db.product.findMany({ include: { images: true } });
  let updated = 0;
  const missing: string[] = [];

  for (const p of products) {
    const id = photos[p.sku];
    if (!id) {
      missing.push(p.sku);
      continue;
    }
    // Leave photos that were uploaded through the admin panel alone
    if (keepUploads && p.images.some((i) => !i.url.includes("images.unsplash.com") && !i.url.startsWith("/products/"))) continue;

    await db.productImage.deleteMany({ where: { productId: p.id } });
    await db.productImage.create({ data: { productId: p.id, url: photoUrl(id), alt: p.name, sortOrder: 0 } });
    updated++;
  }

  console.log(`Updated ${updated} of ${products.length} products.`);
  if (missing.length) console.log(`No photo mapped for: ${missing.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
