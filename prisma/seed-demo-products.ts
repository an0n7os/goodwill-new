// Adds demo products to the catalogue without touching existing data.
// Safe to re-run: products are upserted by SKU.
// Run: npx tsx prisma/seed-demo-products.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const db = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

const PRODUCT_PHOTOS: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "prisma", "product-photos.json"), "utf8")
);

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=70`;

const IMAGES = {
  electrician: img("1621905251189-08b45d6a269e"),
  electricianPanel: img("1621905252507-b35492cc74b4"),
  mcbBoard: img("1544724569-5f546fd6f2b5"),
  wiresFlatlay: img("1597484661643-2f5fef640dd1"),
  pendantLight: img("1513506003901-1e6a229e2d15"),
  ceilingLight: img("1524484485831-a92ffc0de03f"),
  floorLamp: img("1507473885765-e6ed057f782c"),
  pipeWork: img("1504328345606-18bbc8c9d7d1"),
  drill: img("1504148455328-c376907d081c"),
  bathroomCloset: img("1631889993959-41b4e9c6e3c5"),
  basinPlants: img("1552321554-5fefe8c9ef14"),
  basinBlack: img("1604709177225-055f99402ea3"),
  bathtub: img("1600566752355-35792bedcfea"),
  tapWater: img("1542013936693-884638332954"),
};

interface DemoProduct {
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  mrp: number;
  price: number;
  stock: number;
  unit?: string;
  description: string;
  specs: Record<string, string>;
  image: string;
  isFeatured?: boolean;
  soldCount?: number;
  variants?: { name: string; sku: string; price: number; stock: number }[];
}

const products: DemoProduct[] = [
  // ── Electrical: switches, sockets, protection ──
  {
    name: "Legrand Myrius 16A 3-Pin Power Socket",
    slug: "legrand-myrius-16a-power-socket",
    sku: "LEG-MYR-16S",
    category: "switches-sockets",
    brand: "legrand",
    mrp: 320,
    price: 255,
    stock: 120,
    description: "Heavy-duty 16A 3-pin socket for geysers, ACs and kitchen appliances. Shuttered for child safety.",
    specs: { Rating: "16A, 240V", Pins: "3-pin (6/16A universal)", Modules: "2M", Colour: "White" },
    image: IMAGES.electrician,
    soldCount: 64,
  },
  {
    name: "Goldmedal i-Series 6A One-Way Switch (Pack of 10)",
    slug: "goldmedal-i-series-6a-one-way-switch-pack-10",
    sku: "GM-ISR-6A-10",
    category: "switches-sockets",
    brand: "goldmedal",
    mrp: 750,
    price: 590,
    stock: 85,
    unit: "pack",
    description: "Smooth-action modular switches with silver-alloy contacts. Builder pack of 10 for room-wise wiring.",
    specs: { Rating: "6A, 240V", Type: "1-Way", Modules: "1M each", Quantity: "10 switches" },
    image: IMAGES.electricianPanel,
    isFeatured: true,
    soldCount: 88,
  },
  {
    name: "L&T 32A Double Pole MCB (C-Curve)",
    slug: "l-and-t-32a-double-pole-mcb",
    sku: "LT-MCB-32DP",
    category: "switches-sockets",
    brand: "l-and-t",
    mrp: 980,
    price: 765,
    stock: 40,
    description: "C-curve miniature circuit breaker for main incomer and high-load circuits. 10kA breaking capacity.",
    specs: { Rating: "32A", Poles: "Double pole (DP)", Curve: "C", "Breaking capacity": "10kA" },
    image: IMAGES.mcbBoard,
    soldCount: 31,
  },
  {
    name: "L&T 8-Way SPN Distribution Board (Double Door)",
    slug: "l-and-t-8-way-spn-distribution-board",
    sku: "LT-DB-8W",
    category: "switches-sockets",
    brand: "l-and-t",
    mrp: 2650,
    price: 2140,
    stock: 18,
    description: "Powder-coated double-door DB for homes and small shops. Space for 8 single-pole MCBs plus incomer.",
    specs: { Ways: "8 (SPN)", Door: "Double door", Material: "CRCA steel", Mounting: "Flush" },
    image: IMAGES.mcbBoard,
    isFeatured: true,
    soldCount: 22,
  },

  // ── Electrical: wires ──
  {
    name: "Finolex 2.5 sq mm FR PVC Copper Wire (90m)",
    slug: "finolex-2-5-sq-mm-fr-copper-wire-90m",
    sku: "FIN-WIRE-25",
    category: "wires-cables",
    brand: "finolex",
    mrp: 3200,
    price: 2680,
    stock: 35,
    unit: "coil",
    description: "Flame-retardant single-core copper wire for power circuits and sockets. ISI marked, 1100V grade.",
    specs: { Size: "2.5 sq mm", Length: "90 m", Conductor: "Electrolytic copper", Grade: "1100V FR" },
    image: IMAGES.wiresFlatlay,
    isFeatured: true,
    soldCount: 57,
    variants: [
      { name: "Red", sku: "FIN-WIRE-25-RED", price: 2680, stock: 12 },
      { name: "Black", sku: "FIN-WIRE-25-BLK", price: 2680, stock: 10 },
      { name: "Green", sku: "FIN-WIRE-25-GRN", price: 2680, stock: 8 },
      { name: "Yellow", sku: "FIN-WIRE-25-YEL", price: 2680, stock: 5 },
    ],
  },
  {
    name: "Goldmedal 4 sq mm FR Copper Wire (90m)",
    slug: "goldmedal-4-sq-mm-fr-copper-wire-90m",
    sku: "GM-WIRE-40",
    category: "wires-cables",
    brand: "goldmedal",
    mrp: 5100,
    price: 4290,
    stock: 14,
    unit: "coil",
    description: "Heavy-gauge wire for AC, geyser and main supply lines. Flame retardant insulation.",
    specs: { Size: "4 sq mm", Length: "90 m", Conductor: "Copper", Grade: "1100V FR" },
    image: IMAGES.wiresFlatlay,
    soldCount: 19,
  },

  // ── Electrical: lighting ──
  {
    name: "Philips 20W LED Batten 4ft (Cool Day Light)",
    slug: "philips-20w-led-batten-4ft",
    sku: "PH-BAT-20W",
    category: "led-bulbs-lights",
    brand: "philips",
    mrp: 620,
    price: 449,
    stock: 95,
    description: "Slim 4-foot LED tube light with even, flicker-free light. Replaces 40W fluorescent tubes.",
    specs: { Wattage: "20W", Length: "4 ft", "Colour temp": "6500K", Lumens: "2000 lm" },
    image: IMAGES.ceilingLight,
    isFeatured: true,
    soldCount: 112,
  },
  {
    name: "Philips 12W Round LED Downlight (Recessed)",
    slug: "philips-12w-round-led-downlight",
    sku: "PH-DL-12W",
    category: "led-bulbs-lights",
    brand: "philips",
    mrp: 540,
    price: 399,
    stock: 70,
    description: "Recessed slim panel for false ceilings. Clean, glare-free light for living rooms and offices.",
    specs: { Wattage: "12W", Shape: "Round", "Cut-out": "150 mm", "Colour temp": "4000K Neutral White" },
    image: IMAGES.pendantLight,
    soldCount: 46,
  },
  {
    name: "Philips Decorative LED Pendant Light",
    slug: "philips-decorative-led-pendant-light",
    sku: "PH-PEND-01",
    category: "led-bulbs-lights",
    brand: "philips",
    mrp: 2490,
    price: 1890,
    stock: 12,
    description: "Matte-finish pendant for dining tables and kitchen islands. Uses a standard E27 LED bulb.",
    specs: { Holder: "E27", Finish: "Matte", "Cable length": "1.2 m (adjustable)", Bulb: "Not included" },
    image: IMAGES.floorLamp,
    soldCount: 9,
  },

  // ── Plumbing ──
  {
    name: "Supreme CPVC Elbow 90° (Pack of 10)",
    slug: "supreme-cpvc-elbow-90-pack-10",
    sku: "SUP-CPVC-ELB",
    category: "upvc-cpvc-pipes",
    brand: "supreme",
    mrp: 180,
    price: 140,
    stock: 200,
    unit: "pack",
    description: "SDR-11 CPVC elbows for hot and cold water lines. Solvent-weld fit with Supreme FlowGuard pipes.",
    specs: { Angle: "90°", Material: "CPVC", Standard: "ASTM D2846", Quantity: "10 pieces" },
    image: IMAGES.pipeWork,
    soldCount: 73,
    variants: [
      { name: "1/2 inch", sku: "SUP-CPVC-ELB-05", price: 140, stock: 120 },
      { name: "3/4 inch", sku: "SUP-CPVC-ELB-075", price: 210, stock: 60 },
      { name: "1 inch", sku: "SUP-CPVC-ELB-10", price: 320, stock: 30 },
    ],
  },
  {
    name: "Supreme UPVC 1 inch SCH-40 Pipe (3m)",
    slug: "supreme-upvc-1-inch-sch40-pipe",
    sku: "SUP-UPVC-1IN",
    category: "upvc-cpvc-pipes",
    brand: "supreme",
    mrp: 520,
    price: 435,
    stock: 80,
    unit: "length",
    description: "Lead-free UPVC pipe for cold water supply and overhead tank lines. UV stabilised.",
    specs: { Size: "1 inch", Length: "3 m", Schedule: "SCH-40", Application: "Cold water" },
    image: IMAGES.pipeWork,
    soldCount: 41,
  },
  {
    name: "APL Apollo GI Pipe 1 inch Medium Class (6m)",
    slug: "apl-apollo-gi-pipe-1-inch-medium",
    sku: "APL-GI-1IN",
    category: "upvc-cpvc-pipes",
    brand: "apl-apollo",
    mrp: 1850,
    price: 1620,
    stock: 25,
    unit: "length",
    description: "Galvanised steel pipe for borewell lines, outdoor plumbing and structural supports.",
    specs: { Size: "1 inch NB", Length: "6 m", Class: "Medium (B)", Finish: "Hot-dip galvanised" },
    image: IMAGES.drill,
    soldCount: 12,
  },

  // ── Sanitary ware ──
  {
    name: "Parryware Floor Mounted EWC with Soft-Close Seat",
    slug: "parryware-floor-mounted-ewc-soft-close",
    sku: "PAR-EWC-FM",
    category: "water-closets",
    brand: "parryware",
    mrp: 9800,
    price: 7650,
    stock: 10,
    description: "One-piece floor-mounted western closet with dual flush and slow-closing seat cover.",
    specs: { Type: "Floor mounted", Trap: "S-trap 220 mm", Flush: "Dual (3/6 L)", Seat: "Soft close" },
    image: IMAGES.bathroomCloset,
    isFeatured: true,
    soldCount: 16,
  },
  {
    name: "CERA Pedestal Wash Basin (White)",
    slug: "cera-pedestal-wash-basin-white",
    sku: "CER-BSN-PED",
    category: "wash-basins",
    brand: "cera",
    mrp: 3600,
    price: 2790,
    stock: 22,
    description: "Classic full-pedestal basin that hides plumbing. Glazed vitreous china, easy to clean.",
    specs: { Type: "Pedestal", Size: "550 × 420 mm", Material: "Vitreous china", Colour: "Snow white" },
    image: IMAGES.basinPlants,
    soldCount: 21,
  },
  {
    name: "Parryware Table-Top Basin (Matte Black)",
    slug: "parryware-table-top-basin-matte-black",
    sku: "PAR-BSN-TT-BLK",
    category: "wash-basins",
    brand: "parryware",
    mrp: 6900,
    price: 5450,
    stock: 6,
    description: "Designer counter-top basin in matte black for modern washrooms and dining areas.",
    specs: { Type: "Table top", Size: "450 mm round", Finish: "Matte black", Material: "Ceramic" },
    image: IMAGES.basinBlack,
    isFeatured: true,
    soldCount: 7,
  },

  // ── Bath fittings ──
  {
    name: "Jaquar Health Faucet with 1m Hose",
    slug: "jaquar-health-faucet-with-hose",
    sku: "JAQ-HF-01",
    category: "taps-mixers",
    brand: "jaquar",
    mrp: 1450,
    price: 1150,
    stock: 45,
    description: "ABS health faucet with chrome finish, 1-metre stainless steel hose and wall hook.",
    specs: { Finish: "Chrome", Hose: "1 m stainless steel", Body: "ABS", Warranty: "As per Jaquar" },
    image: IMAGES.tapWater,
    soldCount: 52,
  },
  {
    name: "Jaquar Continental Angle Valve 15mm",
    slug: "jaquar-continental-angle-valve-15mm",
    sku: "JAQ-AV-15",
    category: "taps-mixers",
    brand: "jaquar",
    mrp: 890,
    price: 720,
    stock: 60,
    description: "Brass angle valve with quarter-turn ceramic cartridge for basins, closets and geysers.",
    specs: { Size: "15 mm", Body: "Brass", Cartridge: "Quarter-turn ceramic", Finish: "Chrome" },
    image: IMAGES.tapWater,
    soldCount: 38,
  },
  {
    name: "Jaquar Round Overhead Shower 150mm",
    slug: "jaquar-round-overhead-shower-150mm",
    sku: "JAQ-OHS-150",
    category: "showers",
    brand: "jaquar",
    mrp: 2350,
    price: 1890,
    stock: 20,
    description: "Slim chrome overhead shower with anti-lime rubber nozzles for even spray.",
    specs: { Diameter: "150 mm", Nozzles: "Anti-lime rubber", Finish: "Chrome", Mounting: "Wall arm (sold separately)" },
    image: IMAGES.bathtub,
    soldCount: 14,
  },
  {
    name: "Parryware Pillar Cock for Wash Basin",
    slug: "parryware-pillar-cock-wash-basin",
    sku: "PAR-PC-01",
    category: "taps-mixers",
    brand: "parryware",
    mrp: 1290,
    price: 990,
    stock: 35,
    description: "Single-lever brass pillar tap for wash basins with aerator for splash-free flow.",
    specs: { Type: "Pillar cock", Body: "Brass", Finish: "Chrome", Aerator: "Yes" },
    image: IMAGES.tapWater,
    soldCount: 27,
  },
];

async function main() {
  const categories = await db.category.findMany();
  const brands = await db.brand.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b.id]));

  let created = 0;
  let updated = 0;

  for (const p of products) {
    const categoryId = catBySlug.get(p.category);
    if (!categoryId) throw new Error(`Category "${p.category}" not found — run the main seed first.`);
    const brandId = brandBySlug.get(p.brand) ?? null;

    const data = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      specs: JSON.stringify(p.specs),
      mrp: p.mrp,
      price: p.price,
      stock: p.stock,
      unit: p.unit ?? "piece",
      categoryId,
      brandId,
      isActive: true,
      isFeatured: p.isFeatured ?? false,
    };

    const existing = await db.product.findUnique({ where: { sku: p.sku } });
    const product = existing
      ? await db.product.update({ where: { sku: p.sku }, data })
      : await db.product.create({ data: { ...data, sku: p.sku, soldCount: p.soldCount ?? 0 } });
    existing ? updated++ : created++;

    // Replace the demo image and variants so re-runs stay in sync
    await db.productImage.deleteMany({ where: { productId: product.id } });
    // Prefer the curated product photo (prisma/product-photos.json) over the generic image
    const local = path.join(process.cwd(), "public", "products", `${p.sku}.jpg`);
    const url = fs.existsSync(local)
      ? `/products/${p.sku}.jpg`
      : PRODUCT_PHOTOS[p.sku]
      ? img(PRODUCT_PHOTOS[p.sku].replace(/^photo-/, ""))
      : p.image;
    await db.productImage.create({ data: { productId: product.id, url, alt: p.name, sortOrder: 0 } });

    if (p.variants) {
      for (const v of p.variants) {
        await db.productVariant.upsert({
          where: { sku: v.sku },
          update: { name: v.name, price: v.price, stock: v.stock, productId: product.id },
          create: { ...v, productId: product.id },
        });
      }
    }
  }

  console.log(`Demo products: ${created} created, ${updated} updated (${products.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
