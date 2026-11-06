# New Intake Cutover Runbook

Status: PREPARATION / ISOLATED ACCEPTANCE ONLY. Not approved for production activation.

## Scope And Authority

- Review directory: `C:\Users\infot\OneDrive\Documents\Dylon\.review\booking-flow`; branch: `codex/single-session-booking-review`. Root checkout's unrelated changes are preserved.
- Objective 1 is COMPLETE: Vercel source hashes matched all 42 files of commit `5592c39bfd6a0f8db850b048e83b770bdd64e402`; the approved primary alias was assigned and actual homepage, booking and retired Elite UI checked. A prepared booking link targets `18682766878`; no message was sent and no Google booking flow connected.
- Objective 2 authorizes preparation/staging of a clean, independent intake system, not activation. No old-data import, deduplication, migration or automatic repair. Legacy source/schema changes are not prerequisites for this strategy.
- No automated-branch push, merge, production alias/endpoint change, live-Sheet write, old-script edit, old-trigger pause or extra email is authorized. The single approved isolated email and unchanged retry are complete; this approval is consumed. Both new Vercel deployments are protected PREVIEWS, without aliases.
- Sol handled scoped packaging, mock tests and documentation. Astra performs one final cross-system review after the actual isolated evidence is recorded. Passing tests never grant activation authority.

## Destination Register

| Role | Exact destination | Boundary |
| --- | --- | --- |
| Current primary website / shared-defect rollback | https://the-skate-guys-site.vercel.app | Exact `5592c39bfd6a0f8db850b048e83b770bdd64e402`; deployment `dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n` |
| Reserved future clean Sheet | `1oOvHxL2P4rM3-a5rxd4zTvmLE4iIM4RBEj5uWJ1NslI` | Header-only reservation, zero initial data rows; no current binding or test writes |
| Synthetic acceptance Sheet | `1mRV2mJuv5hU57j6uFMJWPm5IdihzjLdpkbltqbXlxV0` | Only destination for the approved isolated submission |
| New isolated Apps Script project | `15mf3aFuF6ZWDkP5qkk220XNGU4X1G0yYuQqI6gGXPc7E5olcdYuD7g-2` | Version 1, bound ONLY to synthetic acceptance Sheet |
| Future production project / URL | NOT CREATED | Separate approval required; must be independent of the isolated project and legacy project |
| Old project | `1wCcJh9WBnfpOqtun6gzhR5v-81pOLHJsxtXvwCnDRSTrR1w1kJEAy5YU` | Leave source, properties and deployments untouched under current authority |
| Old live Sheet | `1RCEUW2TP2Z1NaXdqeCjmmx041KyuTpBYY28Uz1EAqjU` | Read-only observation only; preserve all legacy records, including duplicates |

Isolated TEST endpoint, NEVER a production endpoint:

`https://script.google.com/macros/s/AKfycbwtS-JSw6zdr32pmqeuYIqTfX7umMo7PHeEb2vNeMsk0QYt-bMBXYqyCn7vUzOwdr1Eig/exec`

The unchanged old endpoint is `https://script.google.com/macros/s/AKfycbymjXSnhFomwbFB7aHQXMffD73hKy7dXr80rixGOuDumRcnLoPOjN6L8bj1rGUMUVkC8g/exec`; reverify its identity before any later cutover. Never retarget a new project to the old Sheet. Never promote the isolated project/URL to production, even after successful acceptance. The reserved future Sheet is not a test destination.

Both new Sheets were initially header-only with four tabs, in this order: `Leads` (26 headers), `Bookings` (21), `Email Subscribers` (10), `Follow Up Status` (11). Both have Trinidad and Tobago timezone (`America/Port_of_Spain`, GMT-04:00). Zero initial data rows is a creation baseline, not a claim about counts after acceptance.

## Evidence Ledger

| Evidence class | Recorded result / limit |
| --- | --- |
| Actual production website UI, parent-supplied | Primary alias proven against exact current deployment; booking, home and Elite checked; WhatsApp prepared for `18682766878`, not sent; no Google intake calls. This proves the published WhatsApp-only path, not the future Google integration. |
| Actual isolated Google UI, parent-supplied | Version 1 deployed; `TSG_LEADS_SPREADSHEET_ID` is synthetic Sheet only; `TSG_AUTOMATIC_REMINDERS_ENABLED=false`; zero triggers verified in UI. Keep these settings throughout isolation. |
| Saved Google source, clipboard readback | LF-normalized SHA-256 values below match review source. Code includes the later welcome-wording patch, not old version 2. Version number 1 belongs to this NEW project. |
| Local source verification, this task | Both LF-normalized local hashes independently match the supplied readbacks. No Google request or execution performed. |
| Local packaging / browser mocks, prior packaging report | Seven unit tests passed; reconstruction check passed for 126 public file entries; mocked browser checks included the actual 25000ms timeout and responsive screenshots. Not actual Google, email or production intake acceptance. |
| Actual isolated acceptance | COMPLETE: native Chromium CORS response, matching Lead ID before saved; fresh 5122.2ms, retry 5217.7ms; WhatsApp ready 2.4ms. Three row-2 booking records, no subscribers; all cells unchanged on same-ID retry. Sender and recipient confirmed exactly one branded email. See `NEW_INTAKE_ACCEPTANCE.json`. |
| Timeout evidence | Native Google replies completed below 25000ms, leaving 19877.8/19782.3ms margin. The full 25-second abort, uncertainty, retained details and retry were exercised with browser MOCKS, not a deliberately delayed Google request. No latency SLA claimed. |
| Vercel previews | READY / target null (preview), aliases empty, Vercel Authentication. Actual hosted booking UI inspected without submitting; all 42 source files per deployment matched the locally Google-tested artifact. Exact URLs/IDs below. Not production intake verification. |
| Future production intake | NOT CREATED / NOT ACTIVATED / NOT VERIFIED. |

LF-normalized saved-source hashes:

- `automation/google-apps-script/Code.gs`: `a761017b077e8f895ca03370eea32f62a09616e6f47d5f057820f1b83108a968`
- `automation/google-apps-script/EmailLogo.gs`: `d21808c728f60d1db52bc0b4dc7a791d873248c2880fc734475f79eb33d0a12f`

Previews (synthetic endpoint only; never promote these as production intake):

- Release: `https://the-skate-guys-site-n4jbrce3u-dylons-projects-1d199d9f.vercel.app` (`dpl_9Tk6QrFTa4DwXiyXcSB7KvRphTee`).
- Compliant automatic snapshot: `https://the-skate-guys-site-jwdy1kndl-dylons-projects-1d199d9f.vercel.app` (`dpl_EFH4uCJ3A5ecWrfN9Qi9uK1VyQQH`). Byte-identical to release, including TEST binding; not a shared-defect remedy.
- Local bound artifact: `output/new-intake-web/isolated-stage-v1`; template: `output/new-intake-web/preparation-final-e27ea9b`. Recheck reconstruction before reuse. Raw browser logs/source backups remain ignored locally; sanitized responses, field comparisons, counts and preview file hashes are committed.
[Historical evidence fingerprint omitted from transfer.]

## Gate A: Isolated Acceptance And Preview

Completed 16 October 2026 under the named isolated approvals. Do not rerun the fresh email fixture: approval is consumed.

- [x] Exact project, version-1 TEST `/exec`, synthetic Sheet property, reminders `false` and zero triggers verified. Saved `Code.gs` and `EmailLogo.gs` read back and backed up, LF hashes above. `setupTSGLeadSystem` completed once; no reminders installed. An initial standalone `onOpen` execution failed for missing Sheet UI context before any write; it was not acceptance evidence. No profiling helper copied.
- [x] Baseline synthetic counts 0/0/0/0. After fresh and retry: Leads 1, Bookings 1, Email Subscribers 0, Follow Up Status 1. Future Sheet remains header-only. Generated isolated config only; tracked endpoint unchanged.
- [x] Exactly ONE approved branded BOOKING ACKNOWLEDGEMENT to `redacted-contact@example.test`; not a class confirmation, receipt or newsletter welcome. Fabricated contact/participant details, marketing No. Reference `[REDACTED-TEST-LEAD-REFERENCE]`, original timestamp `2026-10-17T03:43:14.664Z`. No WhatsApp sent.
- [x] Actual generated website in local Chromium, native Google fetch/redirect/JSON, no response mock. WhatsApp ready in 2.4ms, with zero acknowledgements read at that point. The native Response.json result was observed without substitution.
- [x] Actual readable `200` CORS JSON from `script.googleusercontent.com`: `ok:true`, matching reference, `New Lead`, then `duplicate_ignored`. Saved was absent when each JSON response was read and appeared afterward. Real successful latencies and separate MOCK abort evidence are distinguished above.
- [x] Leads!A2:Z2, Bookings!A2:U2 and 'Follow Up Status'!A2:K2 share the reference/New Lead. All 45 explicit field comparisons passed, including adult+child JSON, guardian, rental EU38, date/time/area and UTMs. Sender MIME contains text+HTML+inline company logo; recipient confirms one branded acknowledgement.
- [x] Unchanged payload, same Lead ID and original timestamp returned `duplicate_ignored` in 5217.7ms. Every readback cell and all counts unchanged. Sender search remained one message; recipient explicitly confirmed no second email.
- [x] Release and automatic snapshot staged PREVIEW only; exact identities above, all source hashes matched. Hosted booking pages inspected without submission. Home/Elite/merch content is the same pinned review source verified locally. Primary alias still points to WhatsApp-only deployment. Further email requires new permission.
- [x] Structured evidence in `NEW_INTAKE_ACCEPTANCE.json`; UI mock evidence in packaging README. Production intake remains NOT CREATED/NOT VERIFIED. Isolated success does not activate it.

The offline packaging server blocks external calls and cannot prove Google CORS/redirect behavior. Preview receipt, inbox delivery and Sheet writes are separate checks; none alone establishes the full path.

## Gate B: Approve Future Production Preparation Separately

- [ ] Obtain explicit approval to create a NEW production Apps Script project and versioned URL, bound ONLY to the reserved future clean Sheet. Do not reuse the isolated project or URL, copy test rows, or import legacy rows. Website activation remains a separate decision.
- [ ] Read back the reserved Sheet's exact identity, four-tab headers, zero data rows and timezone. Review exact production source/version and LF hashes, access settings, owner and Sheet property. Start reminders `false`, zero triggers; authorize no test email implicitly.
- [ ] Prepare a separately approved production website artifact/binding with the NEW production project/URL and future Sheet. Existing isolated-only packaging gates deliberately reject this destination: do not bypass them or mislabel production as synthetic. Any production packaging change requires scoped approval and verification.
- [ ] Never deploy the review checkout root: it contains historical endpoint/config and private preparation files. Publish only a freshly verified allowlisted public tree. Resolve the weekly-newsletter delivery owner, cadence and unsubscribe process plus separately authorized consent-path acceptance, OR obtain approval to defer those forms/promises. Booking reminders do not provide a newsletter service.
- [ ] Record immutable release identity/checksums and a byte-identical compliant automatic-intake snapshot for future website-only changes. Verify the snapshot against the actual approved release. Its shared backend/binding means it cannot cure a shared integration defect.
- [ ] Pre-agree monitoring window/cadence, staff owner, rollback decision maker, production verification scope and any email recipients. A synthetic pass is not production acceptance and does not authorize extra production submissions.

## Legacy Writers: Observe Now, Pause Only After Approval

Actual read-only old-project UI observation supplied for this run (16 October 2026):

- Owner shown: `Me`; handler `runTSGFollowUpReminders`; deployment `Head`; Time-based / Day timer; daily 10am-11am GMT-04:00; daily failure notifications.
- Last displayed execution: 16 October 2026, 10:04:04; all nine displayed executions completed; Running filter showed zero at inspection.
- The trigger is STILL ACTIVE. This is a point-in-time owner-visible observation, NOT a cutover drain, global trigger inventory or proof of no future writes/emails. Old version 2 does not honor the new false reminder property.

Later pause procedure, conditional on explicit permission naming the old project/trigger:

1. Capture a fresh read-only inventory: owner, handler, Head, schedule/timezone, failure notifications, source/deployments, endpoint, properties and Sheet identity. Each relevant owner must inspect their own triggers; `Me` does not reveal every owner's installable triggers. Inventory other writers, including old web-app requests, tracking, integrations and staff activity.
2. Open the OLD project's Triggers page. On ONLY the matching recorded `runTSGFollowUpReminders` row, open More Options and Delete trigger, then confirm only that deletion. There is no pause toggle here. Do not delete unrelated triggers or change source/properties/deployments. Other-owner deletions require the appropriate explicit authority. A false property is ineffective on old version 2.
3. Refresh each owner's inventory and verify the approved matching trigger(s) absent. Avoid setup/install functions that can recreate scheduling. Keep the old endpoint unchanged; do not rebind it or any new project to the old Sheet.
4. Open Executions, select Running and refresh. Also inspect Paused executions and refresh: paused jobs may later resume. Account for ALL writers, including `doPost`/tracking and other owners, not just the reminder handler. Let in-flight work finish; do not stop any execution without separate explicit permission. Trigger deletion does not cancel work already running or undo email/writes.
5. Coordinate an approved quiet window for other writers/staff and recheck Running/Paused plus Sheet deltas through the agreed drain interval. Record times, filters, owners and residual traffic. Public old endpoints can receive stale-client requests: zero once is only bounded evidence. If continuing work prevents a credible drain, hold the cutover decision and seek instructions; do not claim quiescence or change the old endpoint/source to force it.

This independent-new-Sheet strategy does not require legacy migration or legacy source upgrades. Pausing old reminders limits legacy email activity; it does not repair legacy writers. Their residual risk remains confined to the old system and must be visible to the release decision maker.

## Gate C: Explicit Activation Decision

- [ ] Gates A/B are evidenced; new production project/URL, clean Sheet, exact website release and rollback identity are verified. No synthetic endpoint appears in the production artifact. All production bindings are independent of the old Sheet/project.
- [ ] Obtain separate permission for any legacy pause/drain and complete its evidence before claiming that state. If legacy writers remain active, report that explicitly; do not silently treat a point-in-time zero-running view as permission to proceed.
- [ ] Obtain explicit activation approval naming the production artifact, primary alias `https://the-skate-guys-site.vercel.app`, NEW production endpoint/Sheet, authorized operator and rollback authority. Push/merge/deployment/alias operations require their own explicit instruction; none is granted by this checklist.
- [ ] Only under that authority, publish the approved production artifact and switch the primary alias. Verify actual alias/deployment/binding, browser flow and approved data effects. Keep automatic reminders disabled unless separately reviewed and approved. Stop and roll back within granted authority if verification fails.

## Bounded Monitoring And Recovery Limits

During the agreed window, inspect OLD and NEW production Sheets read-only, plus the synthetic Sheet only when checking its test evidence. Record per-tab baseline/end counts, bounded time ranges and Lead-ID sets/multiplicities; keep customer details out of public logs. Compare expected same-ID rows within each system. Flag unexpected count deltas, new cross-Sheet ID overlap, missing booking/follow-up rows, duplicate IDs, status downgrades (especially Replied/Confirmed/Paid) and cross-record inquiry/WhatsApp updates. Use row multiplicity as well as ID sets so pre-existing legacy duplicates remain visible. Do not deduplicate by email/name or treat legitimate independent inquiries as the same lead.

No automatic import, cross-Sheet merge, repair, row deletion, status rewrite or backlog mail. Legacy duplicates remain intact. Staff may handle old backlog manually only under the appropriate authorization; that is service follow-up, not data migration. Escalate cross-record anomalies without running repair scripts.

Strict backend limitations from the reviewed `saveLead_` / `doPost` source:

- Writes to Leads, Bookings, Follow Up Status and consented subscribers are sequential, not a transaction. Failure can leave partial rows. An unchanged same-ID booking retry can fill missing booking/follow-up rows, but must be checked afterward; it is not general recovery.
- Subscriber upsert runs only for a new Leads ID with consent. Once Leads exists, a duplicate retry skips that upsert, so a subscriber failure may remain unrecovered. The consent-`No` three-row test does not validate this consented path.
- Confirmation mail is sent after storage and outside the save lock. Mail failure can return `ok: false` after rows exist; a duplicate retry skips confirmation mail. Conversely mail may have been sent before a response is lost. Neither a retry nor a Sheet row proves inbox delivery. No durable email outbox/automatic replay is established here.
- On uncertainty, preserve the original ID/payload and inspect rows, executions and inbox evidence first. Do not create a fresh ID or resend email automatically. Any targeted row repair, subscriber repair or resend needs explicit approval and an auditable case; a resend can duplicate an already delivered message.
- Manual imports are outside this rollout and hazardous: existing-ID guards are not an import reconciliation system; partial IDs can suppress subscriber/email work, and new IDs can duplicate inquiries or mail. No manual imports to either new Sheet.

## Rollback And Reminder Restoration

| Failure / decision | Approved target and constraint |
| --- | --- |
| Shared Google integration, acknowledgement, storage or binding defect | Request/execute only explicitly authorized primary-alias rollback to current exact WhatsApp-only deployment `dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n`, commit `5592c39bfd6a0f8db850b048e83b770bdd64e402`, at `https://the-skate-guys-site.vercel.app`. Do not point customers to an invented rollback URL. |
| Future website-only regression; integration independently healthy | Separately authorized promotion of the verified byte-identical compliant snapshot of that approved automatic release. Not a remedy for a shared endpoint/backend defect. |
| Isolation/preview failure before activation | Leave the current primary alias untouched. Hold candidate acceptance; preserve evidence and all Sheets. No production rollback is needed because no activation occurred. |

Immutable WhatsApp-only fallback URL: `https://the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app`. It is currently published on the primary domain. Before any future alias change, reverify availability and all 42 source hashes. Never use an arbitrary historic build (including `d8a6a5a`) or the test endpoint as fallback.

After explicit rollback approval, the exact primary-domain operation is:

```powershell
vercel alias set the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app the-skate-guys-site.vercel.app --scope team_dEDeP8feNT9wIaT7VOiOo4uT
```

Read back the alias deployment ID, then verify home, book, Elite and prepared `wa.me/18682766878` request. Do not send a test message or email implicitly. This command is documented, not authorized for another execution now.

Website rollback does not revert Sheet rows, already sent email, script properties, triggers or in-flight executions. Preserve new production intake records; do not restore an older Sheet over them, merge them into legacy data or redirect new bindings to the old Sheet. Keep the old endpoint unchanged and any approved paused reminder state paused. Read-only monitor residual writers after rollback.

Reminder restoration is NEVER automatic, including after rollback. Require separate approval identifying project/Sheet, owners, schedule, recipients/backlog policy and email effects. First review/test the actual intended Head runner for status protection, markers, locking and duplicate-send risk; old version 2 is not safe merely because it previously ran. Do not silently update old source or reinstall its unsafe trigger. Safe restoration may need its own authorized code work; absent that, leave it paused. No manual reminder run as a test without explicit email permission.

## Handoff Record

- Completed: approved website-only publication, new empty future Sheet, separate clean synthetic Sheet/project/version-1 deployment, saved source/settings readbacks, actual one-email/three-row/same-ID acceptance, isolated previews and local mock/packaging checks.
- Pending decisions: new production project/endpoint and production artifact binding, any approved production acceptance effects, old-trigger pause/drain authority, exact activation/rollback authority and monitoring owner/window. No automated push/merge/production activation performed.
- Remaining risks: partial subscriber/email recovery, untested consented newsletter path/campaign delivery, residual old writers and no production intake verification. Weekly-update page copy is not evidence that a campaign or reminder schedule is active; settle operational ownership before launch.
- Astra's one final preparation review is complete; see linked findings and checker hardening. Sol is recommended for separately authorized production provisioning/binding; Astra reviews a future activation decision only after production-specific evidence. Keep current WhatsApp-only website in place until then.
