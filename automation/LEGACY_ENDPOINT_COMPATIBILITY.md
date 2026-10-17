# Legacy Endpoint Inspection and Compatibility Plan

## Status

Current local revision: target-ID isolation replaces the earlier global
duplicate-ID rejection. Global schema/header validation remains; any ambiguous
requested ID across the four tabs fails before target writes, leaving its rows
untouched, while unrelated unique IDs can proceed. Protected/conflicting statuses
are not reconciled or overwritten. The expanded 62-group offline suite passes;
actual isolated deployment/acceptance is a separate evidence gate. The historical
version-3/global-guard account below is retained for provenance, not as the current
candidate contract. Production code/data/trigger/endpoint remain unchanged.

Historical version-3 account: follow-up from b0709dd, optional blank legacy booking email was explicitly
approved; 42 offline groups pass. Exact reviewed source is deployed only in the
isolated project as version 3. Its first native Google request was rejected for
pre-existing copied-Sheet duplicate IDs; all further testing stopped, no rows or
statuses changed. Successful legacy acceptance remains BLOCKED. See
`LEGACY_ISOLATED_ACCEPTANCE.md` for source/backup/destination evidence, the stop
condition and next approval. Do not treat deployment alone as acceptance or
clean up historical rows without approval. Audit production ID/header integrity
before any future installation. That earlier candidate intentionally blocked
all mutations for any duplicate; the local revision above changes only that scope.

Read-only production inspection completed on 16 October 2026. The revised replacement is in `legacy-compatibility/Code.gs`, with 62 offline groups in `check-legacy-compatibility.mjs`. Exact-version native evidence is in `CLEAN_LEGACY_VERSION1_ACCEPTANCE.md` and `LEGACY_DUPLICATE_ISOLATION_ACCEPTANCE.md`; failures and latency concerns remain explicit. It is NOT deployed to production. Any accepted installation replaces original legacy `Code.gs`, never sits beside the strict handler or duplicate globals. Do not release the website while the live retained writer remains unguarded; strict duplicate handling and latency are independent release gates.

Production reminders are currently ACTIVE, not disabled. This inspection changed no trigger or setting. Disabling the existing production reminder trigger requires an explicit authorized operational step; setting a property alone cannot disable version 2, which never reads that property. Isolated test reminders remain a separate disabled configuration.

Machine-readable identity, settings, source fingerprint and all status-write paths are in LEGACY_ENDPOINT_INSPECTION.json. No customer rows were read or written.

## Verified Actual Identity

- Bound live Sheet: 1RCEUW2TP2Z1NaXdqeCjmmx041KyuTpBYY28Uz1EAqjU.
- Production project: 1wCcJh9WBnfpOqtun6gzhR5v-81pOLHJsxtXvwCnDRSTrR1w1kJEAy5YU.
- Serving deployment: AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g.
- Immutable version 2, displayed 11 July 2026 at 00:25 GMT-04; runs as info.theskateguys@gmail.com, access Anyone. One older archived deployment was listed.
- Project History version-2 Code.gs was copied read-only, not inferred from the editor. Its 298 lines have LF-normalized SHA-256 8a66986cf87ce39024a929a34b1e4c710606ecbc58c7a354c233a15d44b82dd2.
- Exact repository match: commit 51ddd8f4f17318c3537544a1ab58ae51ede090dd, automation/google-apps-script/Code.gs. Current Head independently matched the deployed version, including its manifest.
- Manifest: V8, America/Puerto_Rico (GMT-04), STACKDRIVER logging, no dependencies; USER_DEPLOYING / ANYONE_ANONYMOUS.
- Loaded Project Settings has no script properties. The code falls back to its bound active Sheet; it has no explicit Sheet-ID property and no reminder-disable property.
- Signed-in owner sees one Head time-driven runTSGFollowUpReminders trigger: Day timer, 10am-11am GMT-04. Last run displayed 16 October 2026 10:04:04 AM, error rate 0%. This proves a configured run, not that email was delivered.
- Installable triggers owned by other accounts are not necessarily visible to this owner. Audit other collaborators before claiming global quiescence.

## Every Booking/Follow-Up Status Writer

Line numbers below refer to the verified deployed version-2 source, not the current candidate.

| Entry path / helper | Lines | Write and risk |
| --- | --- | --- |
| doPost lead_submit -> saveLead_ | 63, 94, 102, 112 | Appends initial New Lead to Leads/Bookings. Only this submission path has a script lock. No cross-tab Confirmed/Paid snapshot; a missing parent/child can receive a conflicting initial state. |
| saveLead_ -> appendFollowUp_ | 125, 131 | Appends literal New Lead to missing Follow Up Status, even when another tab holds Confirmed/Paid. Existing Lead duplicate returns early and does not repair missing children. |
| doPost whatsapp_opened -> markWhatsAppOpened_ | 66, 159, 170-171 | Unlocked. Sets WhatsApp flag Yes, then overwrites Leads/Bookings status with WhatsApp Opened regardless of Confirmed/Paid/Replied. |
| Time trigger or menu -> runTSGFollowUpReminders | 176, 202-203 | Uses Follow Up Status only. If that row is stale, can send a reminder even when Leads/Bookings is Paid, then write Follow Up Needed and Last Contacted. No lock or disable guard. |
| Reminder -> updateLeadStatus_ | 218, 226 | Unconditionally overwrites matching Leads/Bookings statuses. Must be protected itself, not only by its current caller. |

Related paths:
- setupTSGLeadSystem (39-43) calls ensureSheet_, validation and the unconditional reminder installer. Do not execute it on production under this review.
- installTSGAutomationTriggers (47) deletes/recreates daily reminder triggers without a disable guard; the menu exposes it.
- ensureSheet_ (238-242) rewrites fixed legacy header prefixes; fixed-position append, subscriber and validation logic can corrupt interpretation if headers have been reordered or extended unexpectedly.
- upsertSubscriber_ (137-145) writes Subscribed only in Email Subscribers. It is not a booking-status writer, but full-row updates can overwrite custom subscriber columns.
- applyValidations_ (249) changes validation metadata at fixed positions, not existing status values.
- normalizeLead_ sets initial New Lead in memory; it does not accept a caller's arbitrary status.
- doGet is read-only and onOpen only adds the menu. No Run/setup/reminder action was invoked during inspection.

The offline reproduction in check-legacy-status-risk.mjs uses the pinned matching Git blob and mocked services. It confirms the old risk; it does NOT fix or run the production handler.

## Compatibility Contract and Deployment Gates

Keep the old /exec URL and legacy payload accepted while old/cached forms remain in use. Do NOT send participant-less legacy requests to the new strict participant endpoint, fabricate ages/sizes/guardians, silently reinterpret an old package as a confirmed offer or promise discontinued prices.

Implemented local replacement contract; installation/deployment still needs separate approval:
1. Preserve old lead_submit/whatsapp_opened field names, response envelope and unchanged-ID duplicate behavior. Retain raw legacy package/time preference as historical request information, clearly flag incomplete legacy requests for staff reconciliation, and collect missing participant details before confirming TT$80 availability/payment.
2. Route EVERY mutation through the same project script lock used by the new participant deployment. Keep both deployments in this production project so that lock is shared. Sheet UI/manual staff edits do not participate in that lock; avoid automated multi-step status edits and reread immediately before writes. Another project writing the Sheet would require separate coordination.
3. Under the lock, locate rows by Lead ID using exact unique headers, then read statuses from Leads, Bookings and Follow Up Status before any status write. Paid takes precedence over Confirmed. If either protected state exists anywhere, do not downgrade ANY existing protected row or automatically overwrite staff-owned states. Missing rows created to repair a request must inherit the protected state; never blindly default a missing child to New Lead.
4. Tracking may set WhatsApp Opened=Yes. It may advance only an actual New Lead row to WhatsApp Opened when no protected state exists anywhere. Preserve Replied and other later staff states. A flag is not proof a message was sent or a class was confirmed.
5. updateLeadStatus_ must enforce the same protection even when called directly by another helper. Reminder processing must be disabled by default, require explicit true, check all three tabs and eligibility immediately before any send, preserve Confirmed/Paid/Replied, and make no status changes when disabled. Keep it disabled throughout migration and acceptance.
6. Replace fixed-position appends/updates with header-mapped writes; preserve custom fields/formulas. Add only missing headers on the right, never overwrite/reorder current headers. Audit duplicate/missing header names and stop for human review on ambiguity.
7. Preserve all existing records, timestamps, statuses and Notes. Duplicate repair must check each tab separately and retain original Lead ID. Do not send a second acknowledgement just to repair a child row. Email/subscriber recovery after partial failures needs an explicit delivery ledger or manual reconciliation; do not claim exactly-once under crashes.
8. Remove retired Elite newsletter wording without adding marketing flows. Keep consent separate and optional; do not subscribe legacy consent-No contacts.
9. Do not copy the new strict validator wholesale into the old handler. Test both old and new contracts explicitly. The new participant endpoint remains strict and uses the approved single-session offer.
10. Keep a saved immutable version of the verified legacy source for audit, not as an approved operational fallback. Reverting to unsafe version 2 after protecting new bookings would reintroduce the risk.

The replacement appends only `Legacy Review Required` to the three status tabs;
it does not copy raw payloads into new PII columns or invent participant details.
Existing rows/Notes are not backfilled. Fresh legacy bookings retain one plain
transactional acknowledgement with the current offer and availability distinction;
duplicate/repair paths never resend. Mail/service failures require manual
reconciliation, not an exactly-once guarantee. See `legacy-compatibility/README.md`
for lock, schema, UI-edit and volume limits and the focused offline matrix.

## Acceptance Matrix Before Any Production Change

All initial checks run offline with mocks and then, only with authorization, against a separate isolated legacy-compatible deployment sharing a copied Sheet with the isolated strict deployment.

- For each of Leads/Bookings/Follow Up Status in turn: set Confirmed and Paid while other rows are New Lead or absent; legacy tracking, legacy submission retry/repair, helper status update and a due reminder must not downgrade or email that reference.
- Test Replied, unknown/missing IDs, exact unchanged retries, new legacy submissions and new strict participant submissions. No implicit conversion of old offers into confirmed availability.
- Race two tracking/submission/repair requests using shared locking. Test that an error after the first append repairs missing children with the same ID and protected state, not a second parent.
- Reorder/add custom columns and preserve custom subscriber formulas, Notes and existing records. Reject ambiguous duplicate/missing required headers rather than guessing.
- Reminder property absent/false must yield zero mocked sends/status writes and no installed reminder trigger. Explicit true behavior may be mocked only; no real reminder email is authorized.
- Verify any permitted transactional acknowledgement exactly once in a separately authorized isolated test. Do not send more emails during this local preparation.
- Verify native browser acknowledgement and old-form/new-form WhatsApp handoffs using the appropriate copied-Sheet endpoints. Existing isolated strict acceptance remains completed evidence, not acceptance of a future legacy compatibility patch.

## Later Production Sequence: Approval Required

1. Record live settings/versions/triggers and take fresh Sheet plus code/manifest/properties backups. Keep the current endpoint and website unchanged.
2. Explicitly approve disabling the existing production reminder trigger before any editor code/setup change. Remove only the recorded reminder trigger, inspect all owners, and allow in-flight executions to finish or stop them through an approved procedure. Do not assume trigger deletion cancels an already-running execution.
3. Review the prepared replacement and offline matrix, then explicitly authorize an isolated compatibility deployment and targeted copied-Sheet acceptance before production. Install reviewed compatibility-safe Head source and an explicit live-Sheet property only after the production approval/backup/pause gates; keep reminders false. Authorize and update only the existing legacy deployment to the tested compatible version, preserving its URL. Re-verify deployed source/version and status behavior and drain original unsafe in-flight requests before proceeding. These are FUTURE deployments, not performed here.
4. With the legacy writer safe, install the reviewed strict source plus EmailLogo.gs as the candidate new booking version in the same project. Current Head/manual menu/trigger functions will follow that source; keep reminders disabled and audit any compatibility-specific manual functions before replacing Head.
5. Run additive setup after backup, then verify all pre-existing populated cells/statuses/notes and schema. Create the new strict participant deployment without moving the old URL.
6. Bind the approved website release AND compliant fallback to the new strict /exec URL in a separately authorized release-config commit/build. Stage, test, then promote only with explicit approval.
7. Monitor/reconcile old queued requests without silently deleting them. Keep the compatibility-safe legacy endpoint until an approved retirement/maintenance plan; never restore original unsafe v2 as a shortcut.
8. Roll back only to tested compliant website/backend artifacts. Preserve all new data. Keep the compatibility-safe old writer and disabled reminders in place during rollback.

## Remaining Release Blocker

Inspection uncertainty is resolved: the deployed legacy code is confirmed unsafe and a production reminder trigger is active. A local replacement and offline tests do not protect live records until the guarded handler is deployed. Release remains blocked until isolated legacy acceptance and the production compatibility update/trigger pause are separately authorized and verified. The pinned strict fallback is exercised separately against the existing isolated strict version; that test does not deploy or verify the new legacy replacement. See `PRODUCTION_REMINDER_CUTOVER.md` for pause, quiescence, verification and separately approved restoration. No production changes are authorized by this preparation.

Official references: [script-scoped locks](https://developers.google.com/apps-script/reference/lock/lock-service), [installable trigger ownership and behavior](https://developers.google.com/apps-script/guides/triggers/installable), and [versioned deployment updates](https://developers.google.com/apps-script/concepts/deployments). A script lock coordinates guarded code sections, not manual Sheet edits or another script project.
