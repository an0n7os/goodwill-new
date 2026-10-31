# Goodwill business workflow acceptance

Keep payment gateway disabled until prerequisites pass. Preserve catalogue assets and original business rows.

- [x] Atomic stock adjustment, actor log, variant ownership and conflict checks
- [x] Exactly-once order submission and cancellation; stable variant identities; allowed status transitions
- [x] Shared editable delivery zones/fees across product check, cart, checkout and server
- [x] Customer account order isolation; login throttling and explicit local auth origin
- [x] Purchase receipts/suppliers, base-unit conversion and fractional metre quantities
- [x] Counter sales using the same stock/order ledger
- [x] Returns with saleable/damaged separation and explicit refund recording
- [x] Delivery failure/retry, COD collection and remittance separately
- [x] Role enforcement, audit history, barcode lookup and operational reports
- [x] Owner-only backup/download, scheduled local backups and isolated restore verification
- [x] Accurate order-summary/receipt wording, no invented GST identity
- [x] Isolated workflow/concurrency/permission tests, build and browser checks

Existing Goodwill admin palette/type/shell are retained. New operations screens answer: what needs receiving, delivering, collecting, returning or reconciling today? Real database records only, with empty states and no fabricated totals.


## Verification boundary (2026-10-31)

These checkmarks apply to the isolated workflow test implementation, not production acceptance. The user explicitly requested that the migration stay in the test copy. The original dev.db remains on the frozen original build at port 3030. New source refuses to open dev.db. Do not run build:fast until a real migration is separately authorized.

- Test site: http://localhost:3031/ and /admin/operations
- Build/start: node scripts/workflow-test.mjs build / start
- Disposable integration tests: node scripts/workflow-test.mjs test
- 31 automated tests passed, including races, overselling, roles, replay payload changes, fractional quantities and paise-conserving refunds.
- TypeScript and targeted lint passed. Optimized test build passed.
- Actual browser checks: QA owner sign-in, supplier creation, receipt of 2 packs x 5 pieces, counter sale of 2 pieces, collection/remittance of Rs230, saleable return of 1 piece, refund of Rs115, date report, backup creation/download. A website COD order for Rs115 plus Rs80 delivery appeared in admin as Rs195. No real payment or notification was sent.
- Staff cannot see privileged operation tabs; opening the owner backup endpoint as staff displays Owner access required. Anonymous backup request returns 403.
- Browser screenshots inspected at desktop, tablet and mobile sizes. Mobile admin and order tracking fit within the viewport. Browser testing caught and fixed whole-piece HTML step validation. Checkout inputs now have associated labels; unknown delivery cost no longer displays as free.
- Backup opened as a separate restored SQLite database and integrity/row count checked.
- Source customer-account ownership guards, service assignment and settings are implemented; customer signup, email verification and password reset passed through real auth handlers in disposable tests. Real Google OAuth, physical barcode hardware, external email delivery, real delivery operations and full production acceptance still require separate verification.
- Local HTTP timings are in workflow-http-verification.json; these are server response measurements, not internet/device load timings.
- Real database safety snapshot is in workflow-real-db-safety.json. It contains 219 products, no QA admin accounts and no new workflow tables.
- Test QA records intentionally remain in the test copy for review. Credentials are in ignored .env.workflow-test.local; never use them for the real site.
- Backup schedule runs only while the local server runs; it is not an off-machine backup service.
- Gateway code is implemented and covered by provider-fixture tests. Real Razorpay test transactions, real migration/deployment and production sign-off remain pending. Live payments remain disabled. See premium-website-readiness.md for the current handoff.
