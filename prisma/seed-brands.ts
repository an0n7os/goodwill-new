import { db } from "../src/lib/db";

const brandData = [
  { name: "CERA", slug: "cera", tagline: "Sanitary Closets & Basins", logo: "/brands/cera.svg", sortOrder: 1 },
  { name: "Finolex", slug: "finolex", tagline: "Industrial Wires & Cables", logo: "/brands/finolex.svg", sortOrder: 2 },
  { name: "Goldmedal", slug: "goldmedal", tagline: "Designer Switches & Accessories", logo: "/brands/goldmedal.svg", sortOrder: 3 },
  { name: "Jaquar", slug: "jaquar", tagline: "Luxury Faucets & Showers", logo: "/brands/jaquar.svg", sortOrder: 4 },
  { name: "L&T", slug: "lt", tagline: "Authorised Supply Dealer", logo: "/brands/lt.svg", sortOrder: 5 },
  { name: "Legrand", slug: "legrand", tagline: "Modular Switches & MCBs", logo: "/brands/legrand.svg", sortOrder: 6 },
  { name: "Parryware", slug: "parryware", tagline: "Bathroom Ware & Fittings", logo: "/brands/parryware.svg", sortOrder: 7 },
  { name: "Philips", slug: "philips", tagline: "LED Lighting & Smart Lights", logo: "/brands/philips.svg", sortOrder: 8 },
  { name: "Supreme", slug: "supreme", tagline: "CPVC & UPVC Piping", logo: "/brands/supreme.svg", sortOrder: 9 },
  { name: "APL Apollo", slug: "apl-apollo", tagline: "Structural Steel Tubes", logo: "/brands/apl-apollo.svg", sortOrder: 10 },
  { name: "Tata Pipes", slug: "tata-pipes", tagline: "GI Pipes & Tubes", logo: "/brands/tata-pipes.svg", sortOrder: 11 },
  { name: "Johnson", slug: "johnson", tagline: "Tiles & Sanitary Ware", logo: "/brands/johnson.svg", sortOrder: 12 },
  { name: "AAA", slug: "aaa", tagline: "Bath Fittings", logo: "/brands/aaa.svg", sortOrder: 13 },
  { name: "TMS", slug: "tms", tagline: "Pipes & Fittings", logo: "/brands/tms.svg", sortOrder: 14 },
];

async function seedBrands() {
  console.log("Seeding brands data...");
  for (const b of brandData) {
    await db.brand.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        tagline: b.tagline,
        logo: b.logo,
        sortOrder: b.sortOrder,
        isFeatured: true,
      },
      create: {
        name: b.name,
        slug: b.slug,
        tagline: b.tagline,
        logo: b.logo,
        sortOrder: b.sortOrder,
        isFeatured: true,
      },
    });
  }
  console.log("Successfully seeded 14 manufacturer brands.");
}

seedBrands()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
