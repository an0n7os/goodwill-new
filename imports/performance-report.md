# Local performance verification

Historical baseline measurements below describe the frozen original build on port 3030. Workflow changes are currently approved for the test copy ONLY. Do not rebuild .next-production or run the new source against dev.db. Use node scripts/workflow-test.mjs build then node scripts/workflow-test.mjs start for the isolated site on port 3031. The new source refuses to open dev.db until the production migration is reviewed and authorized.

Measured on this computer, not a browser-device or internet benchmark:
- Product list serialized records: 451,533 to 126,095 bytes (72% smaller).
- 176 card images: 13,554,598 to 1,001,396 bytes (93% smaller). Full product images preserved for detail views; missing thumbnail falls back to original.
- Product page HTML: development before 653,684 bytes; optimized production 276,405 bytes (before the small category-filter correction).
- Warm production product-list response at port 3030: 47–103 ms; initial cold request 481 ms. Earlier development responses were 422–1021 ms, with recompilation occasionally taking seconds.
- Warm database list read: 26–32 ms. No persistent product cache added, so admin edits/hide/delete remain current.
- Admin renders 50 product rows at a time with Show more; search still matches the entire catalogue. Deferred searches keep inputs responsive.
- Listing queries filter category/brand/price and sort in the database. Detail/navigation reads are deduplicated only within a server render. Listing responses carry a main image and card fields, while detail pages retain full specifications/gallery.
- Optimized build and TypeScript passed; targeted ESLint passed. Isolated database integration test passed after price/stock/name/image/hide/delete changes. Authenticated admin click-through and real mobile browser timing were not measured.
