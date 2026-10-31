# Goodwill premium workflow handoff

Verified locally on 31 October 2026. Existing Goodwill UI, catalogue and studio product photos are retained.

## Review the test copy

- Storefront: http://localhost:3031/products
- Admin operations: http://localhost:3031/admin/operations
- Website tools: http://localhost:3031/admin/website
- Account recovery: http://localhost:3031/recover
- Private QA credentials: ignored `.env.workflow-test.local`. These are test-only accounts.

The user explicitly restricted database changes to the test copy. The original `dev.db` has 219 products, zero orders, zero QA staff accounts and no new workflow tables. The existing frozen `.next-production` runtime is separate. It has not been migrated, rebuilt, patched or deployed by this test implementation. Do not run the root production build or point new source at that database until a real migration is separately authorized.

## Completed implementation

- Admin and storefront share authoritative product prices, stock, variants, delivery rules and order data. Price/stock conflicts are checked on submission.
- Atomic inventory ledger, fractional metre stock, suppliers, pack-based purchases, counter sales, delivery failure/retry, COD collection/remittance, returns, damaged stock and bounded refunds.
- Role restrictions, audit history, rate limiting, fresh session checks and barcode lookup.
- Product photo upload with decoded-image validation, optimized WebP, retained private originals, gallery ordering and removal of links without deleting source files.
- Catalogue specifications, warranty and search metadata editing; filters use stored specifications. Generic star ratings are separate from electrical current ratings.
- Customer email verification, customer and staff password recovery, single-use expiring tokens and session revocation. Google sign-in is shown only when configured.
- Customer reorder uses current stock/prices and skips unavailable variants.
- Private quotations with fixed prices, customer acceptance, print/save PDF, exactly-once conversion to a stock-checked order and customer tracking.
- Deduplicated email queue, retry status and owner test mailbox. Test mode cannot send external notifications.
- Razorpay test-only checkout, captured-payment verification, signed webhooks, replay handling, pending-order reconciliation and idempotent refund handling. Live keys are rejected in this workflow.
- Consistent local database backups, owner-only downloads, isolated restore rehearsal and optional encrypted database-plus-photo mirror with checksum verification.
- Local fonts, optimized product thumbnails, limited listing payloads, product structured data, sitemap/robots controls and safe error reporting.
- Patched dependencies run inside `.workflow-preview`; original root `node_modules` is retained for the frozen original app. Package manifest/lock describe the patched versions for a future reviewed install.

## Verification

- 31 automated tests passed after the final filter correction. Coverage includes competing purchases, retries, stale prices, fractional quantities, permissions, delivery rules, cash settlement, returns, quotation conversion, image-byte validation, real auth handlers, payment-provider fixtures and encrypted restore round trips.
- Optimized Next.js 16.4.3 test build and TypeScript passed; targeted ESLint and whitespace checks passed.
- Patched isolated runtime dependency audit reports zero known vulnerabilities at audit time. This is not a security certification of the original runtime or a guarantee against all security issues.
- Actual browser: owner/staff access separation, purchase receipt, counter sale, delivery collection/remittance, return/refund, storefront COD order appearing in admin and owner backup access.
- Actual browser premium workflow: quotation Q-2026-F243A20B for 2 sockets at Rs240 each accepted by customer, converted once to GW-2026-000004, with Rs480 shown on customer tracking.
- Actual browser photo upload reached the gallery and generated a working WebP URL. Only the temporary QA gallery link was removed afterward; original catalogue gallery links remain.
- Actual owner recovery rehearsal opened a separate verified database copy with 219 products and 4 test orders. It did not overwrite the running database.
- Mobile 390px and tablet 768px pages fit without horizontal overflow. White colour filter correctly reduced 219 products to 4. Recovery page has noindex/nofollow. No console errors were captured on the final catalogue check.
- HTTP checks: products, recovery, robots, sitemap, product structured data and uploaded WebP served successfully; anonymous recovery download returned 403. Measurements are local response times, not internet/device performance scores.
- Evidence: `premium-final-verification.json`, `security-audit-test.json`, `workflow-real-db-safety.json` and `premium-mobile-check.png`, `premium-recovery-check.png` and `premium-admin-final.png`.

## Setup still required before launch

1. Supply real Razorpay **test** credentials and a reachable test webhook URL; perform a real test checkout, failed/abandoned payment, delayed webhook and refund in the Razorpay dashboard. Fixture tests do not prove provider connectivity. Live payments remain disabled.
2. Configure verified email sender/provider and verify inbox delivery for verification, recovery and order messages. Test mailbox checks do not prove deliverability.
3. Configure real Google OAuth redirect/domain credentials if Google sign-in is wanted. It remains disabled in the isolated test environment.
4. Configure an off-machine backup mirror destination plus securely retained encryption key, then rehearse recovery from that destination. The encrypted round trip was tested locally; no offsite destination is configured. Scheduled jobs currently run only while the app process runs.
5. Choose the HTTPS domain and hosting with persistent storage for SQLite, uploads and backups, or adapt those to managed persistent services. Verify trusted proxy/IP forwarding before using per-client auth rate limiting behind a proxy.
6. Confirm physical barcode hardware, real delivery workflow, business policies, GST identity/invoice requirements and actual opening inventory with the business owner.
7. Separately authorize the real database migration and deployment after reviewing the test copy. Take a fresh backup, compare preserved rows and repeat customer/admin acceptance on the actual deployment.

## Local commands

Run commands sequentially from the project root:

```
node scripts/workflow-test.mjs test
node scripts/workflow-test.mjs build
node scripts/workflow-test.mjs start
```

Tests clone the reviewed test database into a disposable integration database. Build/test use the isolated patched runtime. Stop the running 3031 process before restarting after a new build. The original database is never a test target.

## Admin consolidation update

- Product photo upload, gallery ordering and specifications/search metadata now live inside Inventory > Edit. Website tools has no separate product photo editor.
- Saving a new product keeps its Inventory editor open so photos and specifications can be added there. Editing product basics no longer overwrites the main photo with an older URL.
- Customer creation moved into the existing Customers page; the duplicate Operations customer tab/list was removed.
- Backup creation/download and restore rehearsal have one home: Website tools > Recovery & launch. Operations retains Audit history without duplicate backup controls.
- No product, customer, image asset or database record was deleted by this interface consolidation. This remains test-copy-only.

## Client-facing navigation update

The vague Website tools menu is replaced by direct pages:
- /admin/quotations — Quotations: prepare and share price quotes.
- /admin/messages — Customer emails: sent messages and delivery problems (owner).
- /admin/payments — Payments & refunds: online payments and customer refunds (owner).
- /admin/backups — Backup & recovery: save/recover data and review setup (owner).

Products & stock remains the single place for product editing. Shop operations has descriptive tab labels and a short explanation of the selected task. Sidebar items show their main heading and icon only, as requested; navigation scrolls within the sidebar on shorter screens. Existing workflows and permissions are retained. The old /admin/website URL redirects to Quotations. Earlier Website tools links in this report refer to these replacement pages.
