# TSG receiving-agent handoff — 6 November 2026

## Authority and current state

Transfer only. No release, endpoint switch, Google write, customer email, reminder change or production activation is authorized by this archive. Read exact original AGENTS.md. Root main is behind the website/review work; do not infer production state from main. The receiving repository may place this snapshot on codex/transfer-handoff, with existing origin/main 51ddd8f as its sole parent. Source review commits are provenance, not imported ancestry.

Recorded live website: https://the-skate-guys-site.vercel.app at 5592c39bfd6a0f8db850b048e83b770bdd64e402, deployment dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n. Immutable fallback: https://the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app . These identities are historical recorded evidence; reverify before later operations. The live flow prepares a WhatsApp request to https://wa.me/18682766878; no Google booking system is connected to that approved path.

booking-review pins b4c6ada, the prepared-only branch codex/single-session-booking-review. The original local review worktree is .review/booking-flow. Do not switch the main checkout to it. The two snapshots deliberately preserve different website states; do not merge all files together.

## Product and design

Offer: one-person minimum, by appointment, TT$80 per person / 75 minutes, skate rentals included. A request is not confirmation; TSG checks coach/location/skate availability before payment. Deposit preferred; arrival payment by arrangement.

Seven approved policy rules: (1) 24+ hours notice carries paid amount forward as credit; (2) late cancellation/no-show has no automatic credit, emergencies individually reviewed; (3) TSG/coach cancellation or unsafe weather/venue gives full credit without penalty; (4) credit expires one calendar month after original session, using month-end when needed; (5) extend expiry reasonably if TSG cannot offer replacement, confirming revised expiry; (6) transfer needs approval and participant/skate suitability; (7) credit rather than refunds.

Visual system: dark background, Bebas Neue display and DM Sans body, neon cyan/pink with gold accents. Preserve responsive layouts, reduced-motion and accessible controls. Elite is retired in the approved live flow. assets/events/events-data.js has an events array but the current page does not load it: do not promise a functioning feed without reviewing integration.

Merch prices (TTD): Community Tee 160; Circle Logo Bucket Hat 80; Solid With SK8 Hoodie 350+; Pocket Keychain 20; Therapy Roll Hoodie 350+; Skate Mom Tee 160; F8 Roll Hoodie 350+; Skate Over Running Hoodie 350+; Holiday Roll Tee 160; Community Crew Socks 35. Draft adds Black, Charcoal Grey, White, Heather Grey and Navy community tee choices. Navy applies CSS image filtering. The draft remains local/unreleased. merch-draft is an overlay, not a complete standalone site: preview by copying a chosen website snapshot into a fresh disposable folder, then overlay merch.html and assets/merch from merch-draft. Review the diff against baseline-merch.html (0aadc8d) before approving integration; do not overlay booking sources accidentally.

## Google intake strategy and evidence limits

Use a clean independent new Sheet/project strategy. Do not import, migrate, deduplicate, repair or rewrite old customer rows. automation/NEW_INTAKE_CUTOVER_RUNBOOK.md and NEW_INTAKE_RELEASE_REVIEW.md are the detailed register/gates. Operational project and Sheet IDs are retained there; they are identifiers, not credentials.

The synthetic acceptance project and copied test Sheet are isolated. Keep reminders false and zero triggers. The reserved future Sheet was created header-only; the separate production Apps Script project and production URL have NOT been created. Never promote the synthetic endpoint/project to production or retarget it to the old live Sheet.

Recorded historical evidence: local mock/unit/browser checks; separate actual isolated Google acceptance with one acknowledgement email, one Lead/Booking/Follow Up record and no subscriber row; unchanged same-ID retry changed no cells/counts and produced no second email. Native timings were approximately 5.12s and 5.22s; WhatsApp preparation 2.4ms. The 25-second abort was exercised with browser mocks, not delayed real Google. Protected preview sources matched the isolated artifact; this was not production intake verification. Raw evidence/customer record files and generated email previews are deliberately excluded; the manifest records each omission. Do not rerun email fixtures: prior one-email permission was consumed.

The old daily reminder trigger was observed active on 16 October 2026 only. Its present status is unknown. Old version 2 does not honor the new false reminder property. Any deletion/pause, drain, source change, restore or manual execution requires explicit destination-specific authority and fresh owner-visible evidence. A zero-running observation is bounded, not proof all writers stopped.

Before any production preparation, resolve weekly newsletter ownership, cadence, delivery and unsubscribe process, plus separate consent-path acceptance, or obtain approval to defer promises/forms. Reminders do not provide a newsletter. Obtain explicit production project/URL/Sheet creation and binding approval; then exact release artifact/alias activation authority, monitoring owner/window, rollback authority and authorized verification/email effects. Keep the live WhatsApp release until those gates are satisfied.

Backend limits: sequential Sheet writes are not transactional. Same-ID unchanged retry may fill missing booking/follow-up records, but does not recover subscriber work after Leads already exists. Email occurs after storage, outside the save lock; retry skips it. Rows do not prove inbox delivery; lost responses may follow sent email. Preserve original ID/payload, inspect evidence, and never create a new ID or resend automatically. Repairs/resends need explicit authority. Rollback does not undo rows, mail or running jobs, and reminders never restore automatically.

## Local work and guard limitations

For website-only preview, work inside website-whatsapp, run node automation/build-whatsapp-release.mjs and then node automation/serve-whatsapp-release.mjs; open http://127.0.0.1:4201. These commands create local output. Do not click outbound contact actions or send fabricated messages. A generic HTTP server does NOT block Google calls or form submissions: do not use it as isolation for booking-review. Automated-flow preview requires the reviewed network-blocked harness and its original guard dependencies. Mock/local checks do not establish actual Google or production behavior.

Source-local checks verified on this copied booking-review folder (no network or real email):

    node automation/check-lead-flow.mjs
    node automation/check-booking-system.mjs

Run node verify-transfer.mjs from the transfer root to verify the payload hashes and archive boundaries.

History-dependent checks, retained for future reviewed restoration rather than claimed portable here: new-intake-web/test.mjs, rollback/test.mjs and rollback/test-binding.mjs.

Some commands require original Git objects, exact branch/ancestry, tracked tree and destination denylist scans. This transfer intentionally does not carry historical Git objects. source-baselines contains selective website contract files at e27ea9b and rollback/binding.mjs, approved rollback website 52467abc, bound website/backend 02639f8 and legacy backend sources eff7a9be. These files aid inspection, but do NOT satisfy original guards. Expected guard failures are safety behavior. Do not rewrite binders/runtimes, fake hashes, bypass guards or claim these commits are accepted. Restoring runnable guarded tooling needs a separately reviewed plan with source provenance and scoped authorization.

Root vercel.json has git.deploymentEnabled=false solely for the handoff branch. Included nested historical config is source reference. Do not deploy the repository root, booking review root or an arbitrary historic artifact. Preserve the live fallback identity above. Production site verification and future activation are distinct from archive validation.

## Verification and next action

MANIFEST.json records exact source commits/paths, SHA-256 bytes and privacy transformations. MANIFEST.sha256 protects that manifest. No original source files are changed by snapshot creation; source state checks are recorded in BUILD_CHECKS.json. Source hashes are content provenance, not production validation. Excluded raw artifact links in retained docs refer to unavailable private evidence, not missing permission to recreate it.

Recommended next action: gpt-6-astra reviews privacy, scope and branch-only release controls; gpt-6.1-sol handles any separately approved implementation; gpt-6-luna can inspect narrow inventories. No user decision is required merely to read this archive. New external actions require their explicit scoped instruction.

## Technical and content quick reference

Repository: https://github.com/theskateguys/The-Skate-Guys-Site . Transfer branch: codex/transfer-handoff. Stack: standalone HTML/CSS/vanilla JavaScript, Vercel static hosting, external Shopify and WhatsApp; no application package.json or framework build. Production source and prepared automation are separate folders. Original checkout C:/Users/infot/OneDrive/Documents/Dylon has not been switched or modified.

Palette: background #050508; cyan #00f5ff; pink #ff2d6b; gold #ffd166; text #f8f8fb. Main fonts Bebas Neue/DM Sans. Responsive breakpoints: home 960/620, booking 850/550, merch 900/780/560/420, retired Elite 680px. Preserve real coach/community imagery and honest temporary merch mockup labels.

Booking fields: contact name/WhatsApp, island, area, date, time and 1-20 participants. Each participant has age, experience and rental choice; rental size/system required for rental Yes, guardian name/WhatsApp required below 18. Trinidad location agreed during booking; Tobago Rec TT Black Rock or another agreed available location. Current live form has no email or Google submission; automatic candidate has optional booking email and separate consent. Price and credit rules are not an automated scheduling, inventory, payment or credit-ledger system.

Entry animation preference uses tsgIntroEnteredAt and a roughly 14-day inactivity window; ?intro=1 forces it. That preference storage is separate from live booking details, which stay only in page memory. Editing invalidates a prepared WhatsApp link. The user must press Send in WhatsApp.

Current homepage loads updates-data.js and prefers an update whose href is book.html. It does not render the separate events array. No active automatic event expiration/CMS is established. Some historical update/sitemap dates remain stale. Merch Buy Now opens the generic Shopify store; no selected colour/product variant is passed. Do not restore retired class packages or Elite offers from older snapshots.

Backend Sheet tabs: Leads (26 columns), Bookings (21), Email Subscribers (10), Follow Up Status (11); exact headers are in Code.gs. Protected statuses and custom columns must be preserved. Public code has no proven rate-limiting or exactly-once email outbox. Same-ID retry, matching readable acknowledgement and 25-second client timeout do not prove the server did not save after a timeout.

Configuration names only: window.TSG_LEAD_CONFIG.endpoint, whatsappNumber, requestTimeoutMs, whatsappAutoOpenDelayMs; Apps Script properties TSG_LEADS_SPREADSHEET_ID and TSG_AUTOMATIC_REMINDERS_ENABLED; deployment tooling may use VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID. No secret values are stored in this handoff. Historical source endpoint identifiers are not approved production bindings.

Public links: https://theskateguys.myshopify.com ; https://wa.me/18682766878 ; https://chat.whatsapp.com/KO19GyeuQfi3K1FEJ5GKLi ; https://instagram.com/the_skateguys . No verified Figma/Canva design source URL was found. Existing source assets are under each snapshot's assets folder.

Priorities: preserve transferred source; decide newsletter scope/owner; separately authorize clean production provisioning/binding and verification; separately authorize any legacy trigger drain and activation; then address durable recovery, exact merch colour imagery/variants, event publishing, physical-phone handoff and stale metadata. Source transfer is complete independently of those unapproved production tasks.
