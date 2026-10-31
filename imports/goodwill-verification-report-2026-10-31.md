# Goodwill verification report — 31 October 2026

## Verdict

The isolated local test copy passed the checks below. No blocking failure was found in these tested paths. This is not an A-to-Z guarantee or approval to launch the original database/runtime. Real payments, delivered email, hosting and business acceptance remain outstanding.

No real database migration, product deletion, image deletion or production deployment was performed. Automated mutations ran against a disposable copy. Browser cart changes were cleared without placing an additional order.

## Fresh verification results

| Area | Result | Scope |
|---|---|---|
| Workflow regression | 31 passed, 0 failed | Stock concurrency, retries, cancellation, purchases, fractional metres, COD cash, returns/refunds, delivery, permissions, auth/recovery, quotations, image validation, payment fixtures, encrypted restore |
| Public pages and internal links | 248 HTTP checks passed | Includes all 219 active product detail URLs, main public pages and links extracted from home/catalogue; HTTP success is not proof of every interaction |
| Product media | 401 distinct image URLs returned 200 | URL availability; not a visual verification of every product/model against the supplied catalogue |
| Admin navigation | 13 destinations rendered expected content | Dashboard, products, orders, customers, operations, enquiries, quotations, emails, payments, backups, categories/brands, coupons, settings |
| Shop operations | All 8 tabs opened their corresponding content | Deliveries/cash, purchases, counter sales, returns, service, reports, delivery rules, audit history |
| Database integrity | Both databases: OK | Original and test DB read-only integrity and foreign-key checks |
| Duplicate product checks | 0 duplicate exact names or SKU groups | Does not infer whether differently named products are semantically duplicates |
| Product completeness | 0 products without image records; 0 negative stock | Both databases contain 219 products |
| Admin/store sync | Passed automated test | Admin edits reflected without stale catalogue caching; internal cost remains private |
| Customer browser path | Passed | Add socket to cart, cart product link, checkout, unsupported pincode blocked, free showroom pickup and matching Rs255 total |
| Mobile customer UI | No horizontal overflow at 390px | Catalogue and checkout; mobile menu expanded correctly |
| Browser errors | None captured in final customer checks | Not a global production error-monitoring result |
| Protected recovery download | Anonymous request rejected with 403 | Verified against existing test recovery URL |

Automated tests specifically cover duplicate submission protection, concurrent buyers, stale totals, mandatory variants, cash collection vs remittance, bounded fractional refunds, single-use recovery, exactly-once quotation conversion, signed/captured payment validation and webhook replay. Provider payment tests use fixtures, not actual Razorpay transactions.

## Findings and remaining work

1. **Opening stock requires confirmation:** 179 of 219 test products have zero stock. They correctly show out of stock and cannot be purchased. Enter real opening stock through Products & stock or purchases before customer launch; do not invent quantities.
2. **Small naming inconsistencies:** sidebar Customer enquiries / Discount coupons / Store settings open headings Enquiries / Coupons / Settings. Links work; this is wording polish, not a functional mismatch. Cart also says “1 items”.
3. **Authentication deployment configuration:** auth tests emitted a warning that no trusted client IP was available and rate limiting fell back to a shared per-path bucket. Configure and verify trusted proxy/IP forwarding for the chosen host before launch.
4. **Payment integration:** real test credentials, reachable webhook and actual provider checkout/failure/refund acceptance are still required. Live payments remain disabled.
5. **Email:** verification/recovery/order messages are verified in the private test mailbox only. Real sender setup and inbox delivery are not proven.
6. **Backup continuity:** local isolated restore passed. Off-machine storage, retained encryption key and recovery from that destination still need acceptance. Current scheduled work depends on the app running.
7. **Availability/hosting:** the test process was no longer listening after the interrupted session and was restarted successfully. This local preview is not an always-on hosting service. A managed startup/restart service and persistent database/media storage are required for deployment.
8. **Business acceptance:** owner must confirm real prices, stock, delivery coverage, policies, invoice/GST details and staff permissions. Physical scanner/printer, real delivery and external phone/WhatsApp/map destinations were not exercised.
9. **Original deployment remains separate:** original database safety counts still match the saved baseline: 219 products, 0 orders, 0 QA admins, no new workflow tables. New workflows have not been migrated to it. Do not assume ports 3000/3001 or the original frozen runtime contain these changes.

## Performance boundary

In the 248 sequential local page checks, median response time was 41 ms and maximum 92 ms. A separate products check was 120 ms. These measure local HTTP responses only, not mobile network rendering, Core Web Vitals, simultaneous-user capacity or production latency. No load test was performed.

## Earlier verification retained, not rerun in full here

The preceding UI build passed Next.js compilation and TypeScript. Earlier browser acceptance covered a COD order reaching admin, delivery/cash/returns, quotation acceptance and conversion, photo upload and recovery rehearsal. Those detailed earlier results are in premium-website-readiness.md. This audit reran the 31 regression tests and the navigation/data/customer checks listed above; it did not repeat every destructive admin form or external integration.

## Client launch sequence

1. Review the test copy and approve menu roles and business workflow.
2. Confirm catalogue, stock, prices, delivery rules and business policies.
3. Configure hosting, HTTPS, persistent storage, trusted proxy and offsite backups.
4. Connect verified email and real payment test mode; exercise success, failure, retry, cancellation and refund.
5. Separately authorize migration of the original database after a fresh backup and row comparison.
6. Repeat a real deployment customer order through fulfilment, stock, cash/refund and recovery with the client before enabling live payments.

## Evidence

- audit-readonly-results.json: per-page/per-image response results and database counts.
- premium-final-verification.json: protected download, media, SEO endpoints and original DB safety baseline check.
- Automated run: 31 tests passed, duration approximately 15.9 seconds.
- Test website: http://localhost:3031/products

No application code was changed during this audit; a reusable read-only audit script and this report were added.
