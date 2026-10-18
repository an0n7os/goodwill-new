// One-off copy of the old local SQLite database (dev.db) into Neon Postgres.
// Prerequisites: DATABASE_URL / DIRECT_URL point at Neon and `npx prisma db push` has created the tables.
// Run: npx tsx prisma/migrate-sqlite-to-neon.ts [path-to-sqlite-file]
// Safe to re-run: rows that already exist (same id / unique key) are skipped.
import "dotenv/config";
import { createClient } from "@libsql/client";
import { Prisma } from "@prisma/client";
import { db } from "../src/lib/db";

const sqlitePath = process.argv[2] || "./dev.db";
const sqlite = createClient({ url: `file:${sqlitePath}` });

// Parents before children so foreign keys are satisfied
const ORDER = [
  "Category",
  "Brand",
  "Product",
  "ProductImage",
  "ProductVariant",
  "Customer",
  "Address",
  "Coupon",
  "Order",
  "OrderItem",
  "OrderEvent",
  "StockMovement",
  "BulkEnquiry",
  "Banner",
  "AdminUser",
  "ServiceRequest",
  "DeliveryZone",
  "CustomerUser",
  "User",
  "Session",
  "Account",
  "Verification",
];

type Row = Record<string, unknown>;

function convert(value: unknown, type: string): unknown {
  if (value === null || value === undefined) return null;
  switch (type) {
    case "Boolean":
      return value === 1 || value === "1" || value === true;
    case "DateTime":
      return new Date(typeof value === "number" ? value : String(value));
    case "Int":
      return Number(value);
    case "Float":
      return Number(value);
    default:
      return value;
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) throw new Error("DATABASE_URL must be the Neon connection string.");

  for (const modelName of ORDER) {
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
    if (!model) throw new Error(`Unknown model ${modelName}`);
    const table = model.dbName ?? model.name;

    let rows: Row[];
    try {
      rows = (await sqlite.execute(`SELECT * FROM "${table}"`)).rows as unknown as Row[];
    } catch {
      console.log(`${modelName}: no table in SQLite, skipped`);
      continue;
    }

    const scalarFields = model.fields.filter((f) => f.kind === "scalar" || f.kind === "enum");
    let data = rows.map((row) => Object.fromEntries(scalarFields.filter((f) => f.name in row).map((f) => [f.name, convert(row[f.name], f.type)])));

    // Self-relation: top-level categories first
    if (modelName === "Category") data = [...data.filter((d) => !d.parentId), ...data.filter((d) => d.parentId)];

    const delegate = (db as unknown as Record<string, { createMany: (args: { data: Row[]; skipDuplicates: boolean }) => Promise<{ count: number }> }>)[
      modelName.charAt(0).toLowerCase() + modelName.slice(1)
    ];
    let created = 0;
    // Batches keep each statement small
    for (let i = 0; i < data.length; i += 200) {
      created += (await delegate.createMany({ data: data.slice(i, i + 200), skipDuplicates: true })).count;
    }
    console.log(`${modelName}: ${rows.length} in SQLite, ${created} copied`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await db.$disconnect();
  });
