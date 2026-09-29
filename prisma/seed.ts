import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

console.log("SEED DATABASE_URL IN ENV:", process.env.DATABASE_URL);

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing data
  await db.stockMovement.deleteMany({});
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.address.deleteMany({});
  await db.customer.deleteMany({});
  await db.bulkEnquiry.deleteMany({});
  await db.coupon.deleteMany({});
  await db.banner.deleteMany({});
  await db.adminUser.deleteMany({});
  await db.productImage.deleteMany({});
  await db.productVariant.deleteMany({});
  await db.product.deleteMany({});
  await db.brand.deleteMany({});
  await db.category.deleteMany({});

  console.log("Cleared database.");

  // 2. Create Admin Users
  const owner = await db.adminUser.create({
    data: {
      name: "Yahya Peersha",
      email: "yahya@goodwill.com",
      password: "password123", // Simple for local testing
      role: "owner",
    },
  });

  const manager = await db.adminUser.create({
    data: {
      name: "Aswin Manager",
      email: "manager@goodwill.com",
      password: "password123",
      role: "manager",
    },
  });

  console.log("Created admin users.");

  // 3. Create Categories
  const electrical = await db.category.create({
    data: {
      name: "Electrical",
      nameML: "ഇലക്ട്രിക്കൽ",
      slug: "electrical",
      sortOrder: 1,
    },
  });

  const plumbing = await db.category.create({
    data: {
      name: "Plumbing",
      nameML: "പ്ലംബിംഗ്",
      slug: "plumbing",
      sortOrder: 2,
    },
  });

  const sanitary = await db.category.create({
    data: {
      name: "Sanitary Ware",
      nameML: "സാനിറ്ററി വെയർ",
      slug: "sanitary-ware",
      sortOrder: 3,
    },
  });

  const bathFittings = await db.category.create({
    data: {
      name: "Bath Fittings",
      nameML: "ബാത്ത് ഫിറ്റിംഗ്സ്",
      slug: "bath-fittings",
      sortOrder: 4,
    },
  });

  // Create Subcategories
  const swsockets = await db.category.create({
    data: {
      name: "Switches & Sockets",
      nameML: "സ്വിച്ചുകൾ & സോക്കറ്റുകൾ",
      slug: "switches-sockets",
      parentId: electrical.id,
      sortOrder: 1,
    },
  });

  const wires = await db.category.create({
    data: {
      name: "Wires & Cables",
      nameML: "വയറുകൾ & കേബിളുകൾ",
      slug: "wires-cables",
      parentId: electrical.id,
      sortOrder: 2,
    },
  });

  const lighting = await db.category.create({
    data: {
      name: "LED Bulbs & Lights",
      nameML: "എൽഇഡി ബൾബുകൾ & ലൈറ്റുകൾ",
      slug: "led-bulbs-lights",
      parentId: electrical.id,
      sortOrder: 3,
    },
  });

  const pipes = await db.category.create({
    data: {
      name: "UPVC & CPVC Pipes",
      nameML: "യുപിവിസി & സിപിവിസി പൈപ്പുകൾ",
      slug: "upvc-cpvc-pipes",
      parentId: plumbing.id,
      sortOrder: 1,
    },
  });

  const closets = await db.category.create({
    data: {
      name: "Water Closets",
      nameML: "ക്ലോസറ്റുകൾ",
      slug: "water-closets",
      parentId: sanitary.id,
      sortOrder: 1,
    },
  });

  const basins = await db.category.create({
    data: {
      name: "Wash Basins",
      nameML: "വാഷ് ബേസിനുകൾ",
      slug: "wash-basins",
      parentId: sanitary.id,
      sortOrder: 2,
    },
  });

  const taps = await db.category.create({
    data: {
      name: "Taps & Mixers",
      nameML: "ടാപ്പുകൾ & മിക്സറുകൾ",
      slug: "taps-mixers",
      parentId: bathFittings.id,
      sortOrder: 1,
    },
  });

  const showers = await db.category.create({
    data: {
      name: "Showers",
      nameML: "ഷവറുകൾ",
      slug: "showers",
      parentId: bathFittings.id,
      sortOrder: 2,
    },
  });

  console.log("Created categories.");

  // 4. Create Brands
  const legrand = await db.brand.create({
    data: { name: "Legrand", slug: "legrand", isFeatured: true },
  });
  const lt = await db.brand.create({
    data: { name: "L&T", slug: "l-and-t", isFeatured: true },
  });
  const jaquar = await db.brand.create({
    data: { name: "Jaquar", slug: "jaquar", isFeatured: true },
  });
  const cera = await db.brand.create({
    data: { name: "CERA", slug: "cera", isFeatured: true },
  });
  const parryware = await db.brand.create({
    data: { name: "Parryware", slug: "parryware", isFeatured: true },
  });
  const supreme = await db.brand.create({
    data: { name: "Supreme", slug: "supreme", isFeatured: true },
  });
  const goldmedal = await db.brand.create({
    data: { name: "Goldmedal", slug: "goldmedal", isFeatured: true },
  });
  const philips = await db.brand.create({
    data: { name: "Philips", slug: "philips", isFeatured: true },
  });
  const finolex = await db.brand.create({
    data: { name: "Finolex", slug: "finolex", isFeatured: true },
  });

  console.log("Created brands.");

  // 5. Create Products
  // 5.1 Legrand Arteor Switch (Electrical -> Switches)
  const arteor = await db.product.create({
    data: {
      name: "Legrand Arteor 10A Modular Switch",
      nameML: "ലെഗ്രാൻഡ് ആർട്ടിയോർ 10A മോഡുലാർ സ്വിച്ച്",
      slug: "legrand-arteor-10a-modular-switch",
      sku: "LEG-ART-10A",
      description: "Premium Legrand modular switch, smooth operations and flame retardant body.",
      descriptionML: "ഉയർന്ന നിലവാരമുള്ള ലെഗ്രാൻഡ് മോഡുലാർ സ്വിച്ച്, മികച്ച സുരക്ഷ ഉറപ്പുനൽകുന്നു.",
      specs: JSON.stringify({ Amperage: "10A", Color: "White", Modular: "Yes", Warranty: "10 Years" }),
      mrp: 120.0,
      price: 85.0,
      costPrice: 60.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 120,
      categoryId: swsockets.id,
      brandId: legrand.id,
      isFeatured: true,
    },
  });

  await db.productImage.create({
    data: { productId: arteor.id, url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=60", alt: "Legrand Arteor" },
  });

  // 5.2 Goldmedal 2.5 sq mm Wire (Electrical -> Wires)
  const gmWire = await db.product.create({
    data: {
      name: "Goldmedal FR PVC Insulated Wire 2.5 sq mm",
      nameML: "ഗോൾഡ്മെഡൽ ഫയർ റെസിസ്റ്റന്റ് വയർ 2.5 sq mm",
      slug: "goldmedal-fr-insulated-wire-2-5",
      sku: "GM-WIRE-25",
      description: "Flame Retardant PVC insulated wire for house wiring. Length: 90 meters.",
      descriptionML: "വീട്ടു വയറിംഗിന് അനുയോജ്യമായ ഫയർ റെസിസ്റ്റന്റ് ഇൻസുലേറ്റഡ് വയർ. നീളം 90 മീറ്റർ.",
      specs: JSON.stringify({ Length: "90m", Gauge: "2.5 sq mm", Conductor: "Copper", Type: "FR PVC" }),
      mrp: 3200.0,
      price: 2450.0,
      costPrice: 1900.0,
      gstRate: 18.0,
      unit: "roll",
      stock: 45,
      categoryId: wires.id,
      brandId: goldmedal.id,
      isFeatured: true,
    },
  });

  await db.productImage.create({
    data: { productId: gmWire.id, url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60", alt: "Goldmedal Wire" },
  });

  // Variants for Wire (Colors)
  await db.productVariant.createMany({
    data: [
      { productId: gmWire.id, name: "Red", sku: "GM-WIRE-25-RED", price: 2450.0, stock: 15 },
      { productId: gmWire.id, name: "Blue", sku: "GM-WIRE-25-BLU", price: 2450.0, stock: 10 },
      { productId: gmWire.id, name: "Green", sku: "GM-WIRE-25-GRN", price: 2450.0, stock: 12 },
      { productId: gmWire.id, name: "Black", sku: "GM-WIRE-25-BLK", price: 2450.0, stock: 8 },
    ],
  });

  // 5.3 Philips 9W LED Bulb (Electrical -> Lighting)
  const ledBulb = await db.product.create({
    data: {
      name: "Philips Stellar Bright 9W LED Bulb",
      nameML: "ഫിലിപ്സ് സ്റ്റെല്ലാർ ബ്രൈറ്റ് 9W എൽഇഡി ബൾബ്",
      slug: "philips-stellar-bright-9w-led-bulb",
      sku: "PH-LED-9W",
      description: "Bright energy efficient 9W LED bulb with cool day light color temperature.",
      descriptionML: "ഊർജ്ജ ലാഭമുള്ള ഫിലിപ്സ് 9W എൽഇഡി ബൾബ്. വെളുത്ത വെളിച്ചം നൽകുന്നു.",
      specs: JSON.stringify({ Wattage: "9W", Lumens: "900 lm", ColorTemp: "6500K (Cool Day Light)", Base: "B22" }),
      mrp: 140.0,
      price: 99.0,
      costPrice: 70.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 200,
      categoryId: lighting.id,
      brandId: philips.id,
      isFeatured: true,
    },
  });

  await db.productImage.create({
    data: { productId: ledBulb.id, url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=500&auto=format&fit=crop&q=60", alt: "Philips LED Bulb" },
  });

  // 5.4 Supreme 1" CPVC Pipe (Plumbing -> Pipes)
  const cpvcPipe = await db.product.create({
    data: {
      name: "Supreme FlowGuard 1 inch CPVC SDR-11 Pipe",
      nameML: "സുപ്രീം ഫ്ലോഗാർഡ് 1 ഇഞ്ച് സിപിവിസി പൈപ്പ്",
      slug: "supreme-flowguard-1-inch-cpvc-pipe",
      sku: "SUP-CPVC-1IN",
      description: "Supreme hot and cold water CPVC plumbing pipe. High tensile strength, 3 meters length.",
      descriptionML: "ചൂടുവെള്ളത്തിനും തണുത്ത വെള്ളത്തിനും ഉപയോഗിക്കാവുന്ന സുപ്രീം സിപിവിസി പൈപ്പ്. നീളം 3 മീറ്റർ.",
      specs: JSON.stringify({ Size: "1 inch", Length: "3 meters", Class: "SDR-11", Standard: "ASTM D2846" }),
      mrp: 450.0,
      price: 360.0,
      costPrice: 280.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 80,
      categoryId: pipes.id,
      brandId: supreme.id,
      isFeatured: false,
    },
  });

  await db.productImage.create({
    data: { productId: cpvcPipe.id, url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=60", alt: "Supreme Pipe" },
  });

  // Variants for Pipe sizes
  await db.productVariant.createMany({
    data: [
      { productId: cpvcPipe.id, name: "1/2 inch (3m)", sku: "SUP-CPVC-05IN", price: 210.0, stock: 100 },
      { productId: cpvcPipe.id, name: "3/4 inch (3m)", sku: "SUP-CPVC-75IN", price: 280.0, stock: 90 },
      { productId: cpvcPipe.id, name: "1 inch (3m)", sku: "SUP-CPVC-10IN", price: 360.0, stock: 80 },
      { productId: cpvcPipe.id, name: "1.5 inch (3m)", sku: "SUP-CPVC-15IN", price: 540.0, stock: 40 },
    ],
  });

  // 5.5 Jaquar Lyric Basin Mixer (Bath Fittings -> Taps)
  const basinMixer = await db.product.create({
    data: {
      name: "Jaquar Lyric Single Lever Basin Mixer",
      nameML: "ജാക്വാർ ലിറിക് സിംഗിൾ ലിവർ ബേസിൻ മിക്സർ",
      slug: "jaquar-lyric-single-lever-basin-mixer",
      sku: "JAQ-LYR-BM",
      description: "Elegant single-lever basin mixer tap with chrome finish and smooth foam flow.",
      descriptionML: "ആകർഷകമായ ഡിസൈനുള്ള ജാക്വാർ സിംഗിൾ ലിവർ വാഷ് ബേസിൻ ടാപ്പ്. ക്രോം ഫിനിഷ്.",
      specs: JSON.stringify({ Type: "Single Lever", Finish: "Chrome", Flow: "Foamy", Warranty: "10 Years" }),
      mrp: 4800.0,
      price: 3650.0,
      costPrice: 2900.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 15,
      categoryId: taps.id,
      brandId: jaquar.id,
      isFeatured: true,
    },
  });

  await db.productImage.create({
    data: { productId: basinMixer.id, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60", alt: "Jaquar Mixer Tap" },
  });

  // 5.6 CERA Wall-Hung Sanitary Closet (Sanitary -> Closets)
  const closet = await db.product.create({
    data: {
      name: "CERA Campbell Wall-Hung Water Closet",
      nameML: "സെറ കാംബെൽ വാൾ-ഹങ് വാട്ടർ ക്ലോസറ്റ്",
      slug: "cera-campbell-wall-hung-water-closet",
      sku: "CER-CAM-WH",
      description: "Premium wall-hung closet with wash down flushing system and soft close seat cover.",
      descriptionML: "ചുവരിൽ ഫിറ്റ് ചെയ്യാവുന്ന പ്രീമിയം വാട്ടർ ക്ലോസറ്റ്. സോഫ്റ്റ് ക്ലോസ് സീറ്റ് കവർ ഉൾപ്പെടെ.",
      specs: JSON.stringify({ Type: "Wall Hung", FlushType: "Wash Down", SeatCover: "Soft Close", Material: "Ceramic" }),
      mrp: 9500.0,
      price: 7200.0,
      costPrice: 5500.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 12,
      categoryId: closets.id,
      brandId: cera.id,
      isFeatured: true,
    },
  });

  await db.productImage.create({
    data: { productId: closet.id, url: "https://images.unsplash.com/photo-1521207418485-99c705420785?w=500&auto=format&fit=crop&q=60", alt: "CERA Wall-hung closet" },
  });

  // 5.7 Legrand Lyncus 6A 2-Way Switch
  const lyncusSwitch = await db.product.create({
    data: {
      name: "Legrand Lyncus 6A 2-Way Modular Switch",
      nameML: "ലെഗ്രാൻഡ് ലിൻകസ് 6A 2-വേ മോഡുലാർ സ്വിച്ച്",
      slug: "legrand-lyncus-6a-2-way-switch",
      sku: "LEG-LYN-2WAY",
      description: "Dual control staircase/bedroom switch with silver contact points and glossy white cover.",
      descriptionML: "ഡ്യുവൽ കൺട്രോൾ ആവശ്യങ്ങൾക്കുള്ള ലെഗ്രാൻഡ് 6A 2-വേ സ്വിച്ച്.",
      specs: JSON.stringify({ Amperage: "6A", Type: "2-Way", Material: "Polycarbonate", Color: "White" }),
      mrp: 180.0,
      price: 135.0,
      costPrice: 95.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 90,
      categoryId: swsockets.id,
      brandId: legrand.id,
      isFeatured: true,
    },
  });
  await db.productImage.create({
    data: { productId: lyncusSwitch.id, url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=60", alt: "Legrand Lyncus 2-Way Switch" },
  });

  // 5.8 Finolex 1.5 sq mm House Wire (90m Coil)
  const finolexWire = await db.product.create({
    data: {
      name: "Finolex 1.5 sq mm Flame Retardant Copper Wire (90m)",
      nameML: "ഫിനോലെക്സ് 1.5 sq mm ഫയർ റെസിസ്റ്റന്റ് വയർ (90 മീറ്റർ)",
      slug: "finolex-1-5-sq-mm-fr-copper-wire",
      sku: "FIN-WIRE-15",
      description: "High conductivity 100% pure copper insulated lighting circuit house wire.",
      descriptionML: "ലൈറ്റിംഗ് വയറിംഗിന് അനുയോജ്യമായ ഫിനോലെക്സ് കോപ്പർ ഇൻസുലേറ്റഡ് വയർ.",
      specs: JSON.stringify({ Length: "90m", Gauge: "1.5 sq mm", Conductor: "Copper", Rating: "1100V" }),
      mrp: 2200.0,
      price: 1750.0,
      costPrice: 1380.0,
      gstRate: 18.0,
      unit: "roll",
      stock: 55,
      categoryId: wires.id,
      brandId: finolex.id,
      isFeatured: true,
    },
  });
  await db.productImage.create({
    data: { productId: finolexWire.id, url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=60", alt: "Finolex 1.5 sq mm Wire" },
  });

  // 5.9 Supreme Eco-Clean 110mm PVC Soil Pipe
  const supremePipe = await db.product.create({
    data: {
      name: "Supreme Eco-Clean 110mm SWR PVC Drainage Pipe (10ft)",
      nameML: "സുപ്രീം 110mm പിവിസി ഡ്രൈനേജ് പൈപ്പ് (10 അടി)",
      slug: "supreme-eco-clean-110mm-pvc-pipe",
      sku: "SUP-PVC-110MM",
      description: "Ring-fit rubber gasket leak-proof soil and waste water drainage pipe.",
      descriptionML: "മാലിന്യ ഡ്രൈനേജിന് അനുയോജ്യമായ ഉയർന്ന നിലവാരമുള്ള സുപ്രീം പിവിസി പൈപ്പ്.",
      specs: JSON.stringify({ Diameter: "110mm (4 inch)", Length: "10 feet", Type: "Ringfit SWR", Class: "Type B" }),
      mrp: 980.0,
      price: 790.0,
      costPrice: 610.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 40,
      categoryId: pipes.id,
      brandId: supreme.id,
      isFeatured: true,
    },
  });
  await db.productImage.create({
    data: { productId: supremePipe.id, url: "https://images.unsplash.com/photo-1542013936693-884638332954?w=500&auto=format&fit=crop&q=60", alt: "Supreme PVC Pipe" },
  });

  // 5.10 Jaquar Rain Shower Rose 200mm Chrome
  const jaquarShower = await db.product.create({
    data: {
      name: "Jaquar Maze 200mm Overhead Rain Shower Head",
      nameML: "ജൈക്വാർ മേസ് 200mm റെയിൻ ഷവർ ഹെഡ്",
      slug: "jaquar-maze-200mm-overhead-rain-shower",
      sku: "JAQ-SHWR-200",
      description: "Rub-it easy clean silicone nozzles with mirror finish brass body for spa bath experience.",
      descriptionML: "പ്രീമിയം മിറർ ഫിനിഷുള്ള ജൈക്വാർ 200mm റെയിൻ ഷവർ ഹെഡ്.",
      specs: JSON.stringify({ Size: "200mm x 200mm", Finish: "Chrome Plated", Nozzles: "Silicone Anti-Limescale" }),
      mrp: 3250.0,
      price: 2650.0,
      costPrice: 2050.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 20,
      categoryId: taps.id,
      brandId: jaquar.id,
      isFeatured: true,
    },
  });
  await db.productImage.create({
    data: { productId: jaquarShower.id, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60", alt: "Jaquar Rain Shower" },
  });

  // 5.11 CERA Oval Ceramic Counter Top Wash Basin
  const ceraBasin = await db.product.create({
    data: {
      name: "CERA Snow-White Counter Top Designer Wash Basin",
      nameML: "സെറ സ്നോ-വൈറ്റ് കൗണ്ടർ ടോപ് വാഷ് ബേസിൻ",
      slug: "cera-snow-white-counter-top-wash-basin",
      sku: "CER-BSN-CT",
      description: "Stain-resistant glaze polished ceramic counter-top vessel basin.",
      descriptionML: "കൗണ്ടർടോപ്പിൽ ഫിറ്റ് ചെയ്യാവുന്ന സെറ ഡിസൈനർ വാഷ് ബേസിൻ.",
      specs: JSON.stringify({ Type: "Counter Top", Dimensions: "520 x 380 x 140 mm", Color: "Snow White" }),
      mrp: 4500.0,
      price: 3450.0,
      costPrice: 2600.0,
      gstRate: 18.0,
      unit: "piece",
      stock: 18,
      categoryId: basins.id,
      brandId: cera.id,
      isFeatured: true,
    },
  });
  await db.productImage.create({
    data: { productId: ceraBasin.id, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60", alt: "CERA Wash Basin" },
  });

  console.log("Created products and variants.");

  // 6. Create Coupons
  await db.coupon.create({
    data: {
      code: "WELCOME10",
      type: "percentage",
      value: 10.0,
      minOrder: 500.0,
      maxDiscount: 200.0,
      isActive: true,
    },
  });

  await db.coupon.create({
    data: {
      code: "FREEKULAPPULLY",
      type: "free_delivery",
      value: 0,
      minOrder: 100.0,
      isActive: true,
    },
  });

  await db.coupon.create({
    data: {
      code: "FLAT500",
      type: "flat",
      value: 500.0,
      minOrder: 5000.0,
      isActive: true,
    },
  });

  console.log("Created coupons.");

  // 7. Create Customers & Addresses
  const customer1 = await db.customer.create({
    data: {
      name: "Sajeev Shoranur",
      phone: "9876543210",
      email: "sajeev@gmail.com",
      tier: "retail",
    },
  });

  const address1 = await db.address.create({
    data: {
      customerId: customer1.id,
      name: "Sajeev S",
      phone: "9876543210",
      line1: "Sreevalsam House, Kulappully",
      landmark: "Near Bus Stand",
      city: "Shoranur",
      district: "Palakkad",
      pincode: "679122",
      isDefault: true,
    },
  });

  const customer2 = await db.customer.create({
    data: {
      name: "Ratheesh Plumber",
      phone: "9447123456",
      tier: "contractor",
    },
  });

  const address2 = await db.address.create({
    data: {
      customerId: customer2.id,
      name: "Ratheesh K",
      phone: "9447123456",
      line1: "Siva Temple Road, Ottapalam",
      city: "Ottapalam",
      district: "Palakkad",
      pincode: "679101",
      isDefault: true,
    },
  });

  console.log("Created customers and addresses.");

  // 8. Create Orders
  const order1 = await db.order.create({
    data: {
      orderNumber: "GW-2026-0001",
      customerId: customer1.id,
      subtotal: 198.0,
      gstAmount: 35.64,
      deliveryCharge: 0.0,
      total: 233.64,
      deliveryType: "pickup",
      shippingAddress: JSON.stringify({
        name: address1.name,
        phone: address1.phone,
        line1: address1.line1,
        city: address1.city,
        pincode: address1.pincode,
      }),
      status: "DELIVERED",
      paymentMethod: "cod",
      paymentStatus: "paid",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });

  await db.orderItem.create({
    data: {
      orderId: order1.id,
      productId: ledBulb.id,
      productName: ledBulb.name,
      price: ledBulb.price,
      quantity: 2,
      total: ledBulb.price * 2,
    },
  });

  const order2 = await db.order.create({
    data: {
      orderNumber: "GW-2026-0002",
      customerId: customer2.id,
      subtotal: 3650.0,
      gstAmount: 657.0,
      deliveryCharge: 80.0,
      total: 4387.0,
      deliveryType: "delivery",
      shippingAddress: JSON.stringify({
        name: address2.name,
        phone: address2.phone,
        line1: address2.line1,
        city: address2.city,
        pincode: address2.pincode,
      }),
      status: "PLACED",
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId: "order_mock_123",
      razorpayPaymentId: "pay_mock_123",
      createdAt: new Date(), // Today
    },
  });

  await db.orderItem.create({
    data: {
      orderId: order2.id,
      productId: basinMixer.id,
      productName: basinMixer.name,
      price: basinMixer.price,
      quantity: 1,
      total: basinMixer.price,
    },
  });

  console.log("Created sample orders.");

  // 9. Create Bulk Enquiries
  await db.bulkEnquiry.create({
    data: {
      name: "Gireesh Builder",
      phone: "9946112233",
      projectName: "Shoranur Apartment Project",
      requirement: "Need quote for 50 Wall-hung closets (CERA/Parryware) and 50 basin mixers.",
      status: "new",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bulkEnquiry.create({
    data: {
      name: "Biju Plumber",
      phone: "9845334455",
      requirement: "Supreme CPVC pipes 1 inch - 20 pieces, 3/4 inch - 40 pieces, solvent cement 500ml - 5 tins. Urgent delivery at Kulappully.",
      status: "contacted",
      createdAt: new Date(),
    },
  });

  console.log("Created enquiries.");

  // 10. Create Banners
  await db.banner.create({
    data: {
      title: "Direct Company Price - No Middlemen",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
      link: "/products",
      position: "hero",
      sortOrder: 1,
    },
  });

  await db.banner.create({
    data: {
      title: "Premium Jaquar Bath Fittings",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80",
      link: "/brand/jaquar",
      position: "hero",
      sortOrder: 2,
    },
  });

  console.log("Created banners.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
