# Goodwill catalogue image work — local completion

Authoritative selection: generated/final-manifest.json. Independent result: generated/verification-report.json. Do not use old progress.json or rerun resume.mjs over the reviewed manifest.

- 176 standalone generated studio images are connected to 180 photographed catalogue models. Original generated PNGs and retained source catalogue pages are preserved.
- 1038 active products: 64 existing products, 180 photographed model entries, and 794 table-only catalogue options. Table-only options remain in the local database/admin and reference documents. Public cards show standalone product photos.
- HTTP check of /products?brand=lisha returned 200 with 180 generated product image tags and zero whole-page catalogue image cards. Representative product page returned 200 with image and model code.
- Shared source labels mapped for 1801/1802, 2006/2007, 8009/8010, 8018/8019, 4036/4037. Model 7604 has separate inside/outside views.
- Source-isolated regeneration corrected wrong widths, colors, shapes and missing switch inserts. Contact sheets were visually inspected. Final images are compressed WebP; preserved PNGs retain provenance.
- Withheld 27 unsupported or source-unavailable finish options: Turbo Chrome Matt Black and catalogue-starred Slimz Matt Black. Records retained inactive. Unsupported generated support-frame illustrations excluded from final selections.
- Added source-listed Platina Icon Graphite Grey, Tint Icon Carbon Black with Matt Black Border, missing S7 7049/7050 table rows and 2214 bell photo.
- Printed MRP is the editable selling price. Hot Star 2204=405 and 2205=360. Pictured graphite S7 items use the graphite MRP column. Stock is unconfirmed; pack quantity is not stock.
- Local DB and public src/data/catalog.json updated. TypeScript and targeted ESLint passed.
- Local website: port 3001. Earlier Supabase sync failed with network errors; remote publication is not verified.

Reapply with generated/apply.ts, then export prisma/export-catalog.ts using DATABASE_URL=file:./dev.db. Do not rerun initial import blindly: it has superseded descriptions/rates. Do not reassign crop images or whole catalogue pages as main product images.
