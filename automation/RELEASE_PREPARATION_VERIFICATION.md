# Release Preparation Verification

Date: 16 October 2026, America/Port_of_Spain. Base commit: 52467abc209a51f7a42f33c2e41297e1621a3b48.
Scope: local preparation plus explicitly authorized read-only production inspection. No live Sheet writes, request submissions, emails, endpoint changes, push, merge or deployment.

## Actual Legacy Inspection

The serving production version and current Head source were read through authenticated Apps Script Project History, fingerprinted and matched to the pinned repository blob. Details and all status-write paths are in LEGACY_ENDPOINT_INSPECTION.json and LEGACY_ENDPOINT_COMPATIBILITY.md.

Confirmed: legacy status paths are unsafe; the owner's existing daily Head reminder trigger is ACTIVE, last displayed run 16 October at 10:04:04 AM GMT-04. No script properties are configured. No setting/trigger changed. Disabled isolated reminders are not evidence that production reminders are disabled.

Offline risk reproduction: node automation/check-legacy-status-risk.mjs passed 15 mocked comparisons of the exact pinned legacy source and the local guarded candidate. It confirms risk, not a production fix. A separately approved compatibility patch and live-trigger shutdown remain release blockers.

## Scoped Copy Change

The only runtime backend diff is the newsletter welcome changing to "class, event and merch updates." No booking acknowledgement, price, policy, storage or status behavior changed. Booking-system assertions check the exact new welcome and unchanged booking acknowledgement assembly. No email was sent to test the change.

The runbook and setup notes now distinguish completed isolated strict version-2 acceptance from future production/legacy-compatibility acceptance. Production steps require reminder shutdown and owner/in-flight quiescence before editor or setup changes.

## Compliant Offline Fallback

Built output/rollback/precommit-review-52467abc from current approved pages/backend. It contains 43 allowlisted source files, plus external-to-website provenance manifest/checksum. Only generated assets/lead-config.js is transformed: endpoint becomes empty. The tracked config and both production endpoint deployments remain unchanged.

- Current approved TT$80 / 75-minute / rental-included pages, seven policy rules, participant form and retired Elite/Tally cleanup retained.
- Actual 25000ms config and immediate WhatsApp behavior retained.
- Code.gs plus EmailLogo.gs are included only under backend/, never website/.
- Source and output SHA-256 hashes, transformation and canonical manifest hash recorded.
- Working-tree test artifact has sourceSHA null and productionReady false. It is not a staged production rollback.
- Explicit full-SHA builder is used after the reviewed commit; generated provenance remains ignored to avoid a self-referential commit hash.
- d8a6a5a, implicit/short source refs, changed approved website bytes, unsafe output paths, overwrite, extra helper/customer files and manifest tampering are rejected.
- Common-mode baseline can undo future changes, not cure a defect shared by release and fallback. Future endpoint binding/staging and any maintenance alternative need separate approval.

## Checks Performed

- node automation/check-booking-system.mjs: PASS; mocked Sheet/MailApp storage, consent/email, schema, duplicate/repair and protected statuses; newsletter copy and booking acknowledgement comparison.
- node automation/check-lead-flow.mjs: PASS.
- node automation/check-whatsapp-links.mjs: PASS; 19 direct links use 18682766878, two View Group Invite links, form booking paths preserved.
- node automation/check-legacy-status-risk.mjs: PASS; 15 offline risk/candidate comparisons.
- node --test automation/rollback/test.mjs: PASS; six tests, zero failures. Deterministic manifests, artifact/backend regressions, default disabled endpoint, integrity/allowlist/tamper checks and unsafe-input rejection.
- check-booking-browser.js against the actual artifact via loopback 4188: PASS. Real Chromium; synthetic intercepted delivery; 390/768/1440 layout, participant/rental/guardian validation, truthful opaque/failure/timeout states, retained values, unchanged and refresh retries, prepared message contents, intercepted WhatsApp popup, newsletter and dynamic homepage copy.
- check-booking-timeout.js against that artifact: PASS. Reads actual 25000ms config, overrides only endpoint for mocked delivery. Real wall-clock holds of 9245/12394/18000ms remain pending until matching synthetic acknowledgement; unanswered request reaches 25-second timeout without saved; immediate WhatsApp popup, retained details, late mocked completion and unchanged-ID/timestamp retry pass. No Google response or save was involved.
- Four-page artifact smoke/link check: PASS at 390/768/1440; five HTML pages loaded including verification file; 22 local targets; 14 booking actions; correct two group links; mobile menus; no horizontal overflow, broken eager images or page errors; zero write attempts.
- Intentional synthetic network failure produces the expected console ERR_FAILED in the failure test. It is not an unexpected application exception. Local analytics/CSP warnings are preview constraints, not production verification.
- git diff --check: PASS.

Local screenshot artifacts are ignored under output/playwright/booking-*.png and rollback-*.png. None contains real customer details. Existing real isolated tests were NOT repeated; no extra email was sent.

## Review and Finalization

Astra found a conflicting old setup sequence during review; Sol replaced it with separate canonical production gates and isolated-only steps. Parent requested final Astra reassessment after that fix and all passing checks.

Final gpt-6-astra reassessment found no remaining material local-preparation findings and approved the local commit. Production release remains HOLD for the separately authorized operational and compatibility gates below. Astra independently rechecked the corrected documentation and whitespace; the parent performed the artifact browser and wall-clock tests.

After approval, commit only these preparation changes, rebuild/check the fallback from the actual full commit SHA and retain its manifest under output/rollback/<SHA>/. The final report supplies the commit, artifact and exact diff. This source-SHA artifact remains OFFLINE_UNBOUND, not deployable until separately approved binding/staging.

Production release remains HOLD until live-reminder shutdown and the compatibility-safe legacy handler are separately authorized, implemented and verified. Thereafter require backup/migration, explicit new-endpoint binding, tested staged release/fallback and approved production acceptance. Never promote d8a6a5a or restore pre-release Sheet data over new leads.
