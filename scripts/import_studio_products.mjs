import { createClient } from "@libsql/client";
import fs from "fs";
import { randomBytes } from "crypto";

function genId(prefix = "cmstd") {
  return prefix + "_" + Date.now().toString(36) + "_" + randomBytes(6).toString("hex");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function importStudioProducts() {
  const client = createClient({ url: "file:dev.db" });
  const data = JSON.parse(fs.readFileSync("public/products/studio/products.json", "utf8"));

  // Lighting Category
  const catRes = await client.execute("SELECT id FROM Category WHERE slug = 'led-bulbs-lights' LIMIT 1");
  const categoryId = catRes.rows[0]?.id || "cmrxw6wd000081wi9unkfg6qo";

  console.log(`Starting import of ${data.products.length} studio products...`);

  const pricingMap = [
    { match: /inverter|bulb|candle/i, mrp: 350, price: 249 },
    { match: /panel|downlight/i, mrp: 590, price: 390 },
    { match: /spotlight/i, mrp: 750, price: 499 },
    { match: /strip/i, mrp: 850, price: 550 },
    { match: /batten/i, mrp: 450, price: 320 },
    { match: /wall/i, mrp: 1450, price: 980 },
    { match: /lamp|table/i, mrp: 1850, price: 1290 },
  ];

  let insertedCount = 0;

  for (let i = 0; i < data.products.length; i++) {
    const item = data.products[i];
    const indexStr = String(i + 1).padStart(2, "0");
    const sku = `GW-STD-${indexStr}`;

    // Check if product with this SKU already exists
    const existing = await client.execute({
      sql: "SELECT id FROM Product WHERE sku = ?",
      args: [sku],
    });

    if (existing.rows.length > 0) {
      console.log(`SKU ${sku} already exists, skipping.`);
      continue;
    }

    const title = `Goodwill ${item.product_type} (Studio ${indexStr})`;
    const slug = slugify(`goodwill-${item.product_type}-${indexStr}`);
    const imgFilename = item.studio_image.replace(/^studio\//, "");
    const imgUrl = `/products/studio/${imgFilename}`;

    // Determine price
    let mrp = 650;
    let price = 450;
    for (const rule of pricingMap) {
      if (rule.match.test(item.product_type) || rule.match.test(item.visual_description)) {
        mrp = rule.mrp;
        price = rule.price;
        break;
      }
    }

    const productId = genId("cmprod");
    const imageId = genId("cmimg");

    const specsObj = {
      "Product Type": item.product_type,
      "Mounting": item.mounting_type,
      "Colors": (item.visible_colors || []).join(", ") || "Standard",
      "Finish": "Studio Finished Lighting"
    };

    // Insert Product
    await client.execute({
      sql: `INSERT INTO Product (
        id, name, slug, sku, description, specs,
        mrp, price, stock, damagedStock, lowStockAlert,
        trackStock, categoryId, gstRate, unit, isFeatured, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        productId,
        title,
        slug,
        sku,
        item.visual_description,
        JSON.stringify(specsObj),
        mrp,
        price,
        25, // in stock: 25 pieces
        0,
        5,
        1, // trackStock = true
        categoryId,
        18,
        "piece",
        i < 6 ? 1 : 0, // Feature the first 6 on the home page
        1, // isActive = true
      ],
    });

    // Insert ProductImage
    await client.execute({
      sql: `INSERT INTO ProductImage (id, productId, url, alt, sortOrder) VALUES (?, ?, ?, ?, ?)`,
      args: [imageId, productId, imgUrl, title, 0],
    });

    insertedCount++;
    console.log(`[${indexStr}/38] Inserted: ${title} -> ${imgUrl}`);
  }

  console.log(`\nImport complete! Total inserted: ${insertedCount}`);

  const totalProducts = await client.execute("SELECT COUNT(*) as c FROM Product");
  const totalImages = await client.execute("SELECT COUNT(*) as c FROM ProductImage");
  console.log(`Total Products in DB: ${totalProducts.rows[0].c}`);
  console.log(`Total Images in DB: ${totalImages.rows[0].c}`);
}

importStudioProducts().catch(console.error);

