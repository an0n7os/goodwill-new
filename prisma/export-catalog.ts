// Writes a read-only snapshot of the catalogue (products, categories, brands) to src/data/catalog.json.
// The storefront falls back to it when the database is unavailable (e.g. a deploy without DATABASE_URL).
// Re-run after changing products: npx tsx prisma/export-catalog.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const db = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

async function main() {
  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        category: { include: { parent: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Strip admin-only fields from the public snapshot
  const publicProducts = products.map((product) => {
    const { costPrice, ...publicProduct } = product;
    void costPrice; // Deliberately excluded from the public catalogue.
    return publicProduct;
  });

  const out = path.join(process.cwd(), "src", "data", "catalog.json");
  fs.writeFileSync(out, JSON.stringify({ exportedAt: new Date().toISOString(), products: publicProducts, categories, brands }, null, 1));
  console.log(`Wrote ${publicProducts.length} products, ${categories.length} categories, ${brands.length} brands to ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
