# Booking Release and Compliant Rollback Runbook

## Current Launch Strategy: New Clean Intake

The later approved strategy in [New Intake Cutover Runbook](automation/NEW_INTAKE_CUTOVER_RUNBOOK.md)
supersedes the legacy migration/compatibility cutover below for the next website release.
Website-only commit `5592c39` is now published; the automated branch is NOT activated.
Use a new independent Sheet/project for FUTURE requests; preserve the old Sheet, endpoint
and records, with no migration or deduplication at launch. Old legacy-audit findings remain
historical facts and residual-old-system risks, not permission to repair them or a requirement
to point the strict backend at that data. See [new isolated acceptance](automation/NEW_INTAKE_ACCEPTANCE.json)
for the completed native Google test and separate mock-timeout evidence. Any production
project, binding, old-trigger pause/drain and activation still require explicit approval.
The exact published WhatsApp-only deployment, not `d8a6a5a`, is the shared-defect rollback.
The older sections below retain their original historical scope; do not execute their
old-Sheet migration steps for the new-intake launch.

Status: LOCAL PREPARATION ONLY. No push, merge, production code/endpoint change, deployment, live Sheet write or additional email is authorized by this document. Each release action and destination requires explicit approval.

## Evidence and Limits

- [Optimized backend acceptance](automation/OPTIMIZED_BACKEND_ACCEPTANCE.md): actual isolated version-2 duplicate and fresh blank-email/consent-No acceptance on a copied Sheet. Matching readable Google JSON preceded saved; WhatsApp was ready before acknowledgement. Unchanged retries did not add rows or email.
- [Isolated email acceptance](automation/ISOLATED_EMAIL_ACCEPTANCE.md): actual isolated version-2 fresh email-bearing booking and unchanged same-ID retry. All three booking rows verified; subscribers unchanged; one sender message with text/HTML/inline logo and recipient-confirmed single delivery. Fresh/retry responses took 8389.5/5459.5ms; WhatsApp appeared after 5.6/3.9ms. This is NOT production verification or a latency SLA.
- Earlier [25-second acknowledgement evidence](automation/REAL_BROWSER_25S_ACK_VERIFICATION.json) remains historical isolated evidence. Keep **25000ms**, immediate WhatsApp, preserved details and same-ID retries. Opaque, unreadable, mismatched, failed or timed-out responses never prove storage. Saved requires readable matching Google acknowledgement.
- Isolated reminders were false with zero reminder triggers. This says nothing about live reminders. The subsequent local newsletter welcome-only patch removes retired Elite wording and passes mocks. Earlier real isolated acceptance does not verify that later patch deployed to Google or delivered another email.
- [Legacy inspection and compatibility contract](automation/LEGACY_ENDPOINT_COMPATIBILITY.md), [machine evidence](automation/LEGACY_ENDPOINT_INSPECTION.json) and the original risk reproduction remain separate evidence. The complete replacement is now in `automation/legacy-compatibility/Code.gs`; run `node automation/check-legacy-compatibility.mjs` for its focused offline matrix. This implements guarded legacy behavior locally, not in production. Do not install legacy and strict handlers together.

## Critical Live Blockers

Current local legacy revision replaces global duplicate rejection with target-ID
quarantine: ambiguity in any tab blocks only that ID before writes; unrelated
unique IDs may proceed. Global schema/header guards and cross-tab protected
statuses remain. This changes the older candidate behavior described below,
not the historical audit findings. Actual revised isolated acceptance and Astra
review are required before considering a compatibility-only cutover.
The separate strict backend still uses first-match tracking for duplicate IDs;
it has NOT inherited this revision. Do not infer a full strict/website release
can coexist safely with unresolved ambiguity from legacy acceptance alone.

Latest evidence: [completed 39-request synthetic version-1 baseline](automation/CLEAN_LEGACY_VERSION1_ACCEPTANCE.md),
[revised target-isolation evidence](automation/LEGACY_DUPLICATE_ISOLATION_ACCEPTANCE.md),
[Astra review](automation/LEGACY_DUPLICATE_ISOLATION_REVIEW.md), and
[completed read-only live audit](automation/LIVE_SHEET_INTEGRITY_AUDIT.md).
Both synthetic versions were read immutably and backed up; the earlier editor
error was recovered. Version 1 and its URL are preserved. Version 2 has a separate
explicitly approved synthetic-only URL, same synthetic Sheet and disabled reminders.
The source/response/row evidence and initial failed diagnostic attempts are separate
from offline tests. Do not infer acceptance merely from deployment.
The live audit found one shared duplicate-ID group (rows 2,4,5,6,7,8 in all three
status tabs) and five conflicting-status groups; no missing booking companions.
The older version-1 global guard would block unrelated submissions on this data.
Full production release remains NO-GO: native legacy responses exceeded the
unchanged 25-second client budget, strict identity handling is unchanged, and
the live unsafe writers/trigger still require approved pause/drain/cutover.
Consented subscriber collision recovery is a documented manual limit, not an
automatically repaired flow. Fresh integrity checks and operational approvals remain.
Historical data repair is a separate staff-approved option, never automatic.
The live trigger was not changed.
The older authorization limits below describe the historical version-3 attempt;
the later read-only audit was separately authorized, but live repair is NOT.

Historical copied-data attempt: [version-3 evidence](automation/LEGACY_ISOLATED_ACCEPTANCE.md)
and [JSON](automation/LEGACY_ISOLATED_ACCEPTANCE.json). Approved blank-email legacy
booking validation passed 42 offline groups at that time. Its first native
Google request was rejected by the global duplicate-ID guard because the copied
test Sheet already contained duplicate groups. No row/status changed; all further
tests stopped. That historical version-3 success matrix was not completed. The
later dedicated synthetic project/Sheet were separately approved; their actual
results above supersede this stop as the latest acceptance evidence. No historical
test data or shared properties were retargeted, and no guard was bypassed.
Production headers and the inventory of ambiguous IDs must be audited before any installation;
do not infer live data integrity from a later clean synthetic test or silently
delete/rewrite live history. No live Sheet WRITE is authorized by these notes.

Parent inspection resolved the earlier production uncertainty: actual deployed legacy version 2 and Head match the 298-line main source, LF SHA-256 `8a66986cf87ce39024a929a34b1e4c710606ecbc58c7a354c233a15d44b82dd2`. Production project: `1wCcJh9WBnfpOqtun6gzhR5v-81pOLHJsxtXvwCnDRSTrR1w1kJEAy5YU`; live Sheet: `1RCEUW2TP2Z1NaXdqeCjmmx041KyuTpBYY28Uz1EAqjU`. No script properties were visible; legacy code uses the bound-Sheet fallback.

**LIVE reminders are ACTIVE.** One owner-visible Head time-driven `runTSGFollowUpReminders` trigger runs as a Day timer 10am-11am GMT-04; last displayed run was 16 October 2026 10:04:04 AM. Legacy v2 does not read a reminder-disable property. Setting `TSG_AUTOMATIC_REMINDERS_ENABLED=false` alone is ineffective. No trigger was changed during inspection. Other owners' triggers and in-flight executions require an approved audit/quiescence procedure too.

**Block editor replacement and migration until explicitly authorized disabling of that specific production reminder trigger is completed and verified.** Follow [pause, verify and restore](automation/PRODUCTION_REMINDER_CUTOVER.md). Preserve unrelated triggers. Deletion does not cancel an already-running execution. Do not invoke old setup/install/reminder functions that can recreate it. Restore scheduling only through a separate approval after reviewing due backlog and safe Head code, never automatically during release or rollback.

**Side-by-side URLs alone are insufficient.** The retained live handler can overwrite Confirmed/Paid through tracking, reminders, helper writes and partial-row creation. The replacement guards those paths and preserves old payload/response envelopes, with approved optional blank booking email. Clean synthetic v1 completed 39 real requests; revised target-isolation v2 has separately recorded native response/row evidence. Neither changes production. Keep isolated reminders disabled; the live trigger still requires its separately approved pause. Staff Sheet edits and original in-flight unsafe executions do not share the new guard; drain the old executions before strict migration. Tests cannot make an unchanged live writer safe.

## Offline Fallback Contract

See [packaging instructions and manifest contract](automation/rollback/README.md). Package the exact approved current website and reviewed `Code.gs` plus `EmailLogo.gs`, not an older implementation. Exclude `IsolatedProfile.gs`, helpers, docs, caches, Git metadata and customer data. Only `website/` may later be published; never upload the artifact root or `backend/` to the website host.

The immutable generated template has `endpoint: ''`, **25000ms** and WhatsApp `18682766878`. No tracked runtime/config file is edited. A separate `ISOLATED_ONLY` derivative can now bind the exact allowlisted existing strict version-2 test URL with `automation/bind-booking-rollback-isolated.mjs`; its checker verifies source/template/bound hashes and permits only that copied-Sheet identity. This is a tested local preview, not a production deployment. See `automation/rollback/README.md` and `automation/FALLBACK_ISOLATED_VERIFICATION.md` for the existing-record retry and limitations. Production binding is a separate approved operation: use the verified NEW_BOOKING_EXEC_URL in BOTH release and fallback, reject test/legacy destinations, and record approval, identities and before/after hashes in a separate binding manifest. Never silently use the tracked legacy string or promote the isolated derivative.

`d8a6a5a` must NEVER be selected/promoted as fallback. Do not return to delayed WhatsApp. Working-tree tests record `sourceSHA: null`, contextual `baseSHA` and exact source hashes; they are not final pinned release artifacts. After the email patch and complete diff receive Astra review, the parent may commit if authorized and rebuild from that explicit full commit SHA. Keeping generated manifests outside Git avoids a self-referential source hash.

This approved common-mode baseline is a rollback target for FUTURE changes. Release and fallback may initially share identical runtime/backend bytes. It is NOT a guaranteed cure for current integration faults or bugs shared by both. Shared defects require a separately reviewed fix or approved WhatsApp-only maintenance artifact; neither is implicitly authorized/prepared here.

## Release Order: Approval Required

1. Astra reviews the complete branch/current-main diff and exact hashes. Run lead, booking-system, WhatsApp, legacy-risk, rollback and browser checks. Distinguish mocked/local, isolated Google and production evidence. Verify TT$80 per person/75 minutes/rental included, seven policy rules, retired Elite without Tally, optional consent/email, immediate WhatsApp, 25000ms, truthful acknowledgement states and protected statuses. Record the final parent source SHA only after its authorized commit.
2. Record actual production Sheet/project/deployment/version, website team/project/domain/deployment, main SHA, manifests, properties and relevant triggers/owners. Revalidate inspected identities at action time. Freshly back up live Sheet and production sources/settings before changes; retain earlier backups. Record bounded cell counts/hashes privately, never publish customer data.
3. Complete the authorized isolated acceptance of the exact revised candidate after immutable source/binding/settings verification and backups, including ambiguous-ID rejection plus unrelated unique saves. For a compatibility-only production decision, explicitly authorize reminder pause and writer quiescence; preserve the schedule, audit all owners and verify in-flight reminders/writes have finished/stopped BEFORE editor changes. Reaudit headers and inventory ambiguous IDs. Unreconciled rows may remain quarantined only if the accepted legacy guard is the sole active compatible writer and staff agree to manual handling; never change their statuses/Notes to manufacture acceptance. Any repair requires separate backup and approval of a record-level reconciliation mapping preserving every record and provenance. Authorize updating only the legacy deployment to the accepted compatible version, preserving its URL/payload contract. Drain original-version executions and verify deployed source/version/status safety. Before strict migration, require separately approved reconciliation and fresh integrity checks OR separately implemented and accepted strict identity quarantine; the unchanged strict first-match handler is not covered by this legacy revision. Never restore unsafe v2 as a shortcut.
4. With legacy writers safe and reminders disabled, install final strict `Code.gs` plus `EmailLogo.gs` in the SAME verified production project. Preserve the compatibility deployment/version; audit Head/manual functions when replacing editor source. Exclude profiling/test helpers. Set verified live-Sheet property and reminders=false for code that honors it. Perform approved additive setup: missing headers append right; preserve populated cells/statuses/Notes/custom formulas; compare with fresh backup. Never replace live data with a template/test Sheet.
5. Create a NEW versioned strict booking Web App deployment with approved owner/public access, preserving the compatibility-safe legacy URL. Record NEW_BOOKING_EXEC_URL, strict version/source hashes and compliant fallback backend version. A health GET is not save acceptance. Only separately approved labelled save/retry tests may write; disclose acknowledgement email before any fresh email-bearing submission. Keep unchanged retry IDs and retain labelled records.
6. Only with endpoint-change authorization, bind BOTH release and fallback to that NEW strict `/exec` URL. The tracked production endpoint remains unchanged during local preparation. Never use isolated version-1 (`AKfycbw755w_...`) or version-2 (`AKfycbw-UnIZTK7...`) URLs or silently return to legacy. Record binding hashes separately from the immutable offline manifest. Preserve all other approved runtime bytes and 25000ms.
7. In the verified Vercel project/team, stage BOTH production builds without domain assignment (`vercel deploy --prod --skip-domain`), from only their approved website trees. This is a future authorized operation, not executed here. Record deployment URLs/IDs, source/binding hashes/backend version. Control Git auto-publish so merge/push cannot bypass gates. Smoke-check BOTH staged builds with mocked delivery; any real submission requires separate approval. Check all four pages, navigation, 390/768/1440px, validation, immediate WhatsApp, saved/uncertain states, same-ID retry and safe status behavior.
8. After explicit approval, promote ONLY the tested staged release (`vercel promote <RELEASE_DEPLOYMENT_URL_OR_ID>`); verify Ready/domain/source/binding. Merge/push are separate approved actions with auto-publish controlled. Perform separately approved production acceptance and read back exact rows/email count/preserved statuses. Do not send WhatsApp on the tester's behalf. Only this step supplies actual production verification.
9. Monitor/reconcile new and queued legacy/open-tab requests by Lead ID; preserve historical records/offers without promising discontinued prices. Retire the compatibility-safe endpoint only under an approved plan. Reminder activation is a separate decision, never an incidental setup/release step.

## Rollback After Authorized Release

Compatibility-only rollback requires its own accepted target-ID-quarantine
snapshot and explicit incident approval. Do not select the older global-guard
synthetic v1 while unresolved duplicates remain: it would block unrelated intake.
Never restore the original unsafe legacy writer. The current c8a2f98e candidate's
latency means it is not an approved production fallback merely because isolation
checks pass. If there is no independently accepted safe snapshot for the incident,
prepare an explicitly approved maintenance/WhatsApp-only route or reviewed fix;
preserve every live row and keep reminders off. A Sheet restore/deduplication is
not a deployment rollback, and requires separate record-level authorization.

1. Stop promotion/automatic replacement builds, record incident/time and take a fresh post-release Sheet backup. Preserve every new lead/status/Note/column. Never restore a pre-release Sheet over newer records.
2. Establish that the tested compliant fallback does not share the incident defect. With explicit incident-action approval, promote its recorded staged deployment, retaining TT$80/policy, immediate WhatsApp, 25000ms and the same NEW strict endpoint. Never promote `d8a6a5a`, legacy-package pages, an unbound template or untested rebuild.
3. If separately approved backend rollback is warranted, move only the NEW strict deployment to its recorded tested compliant snapshot version (`Code.gs` + `EmailLogo.gs`), preserving URL/properties. Keep the compatibility-safe legacy deployment intact. Never select original unsafe v2. Deployment rollback does not revert Head/properties/triggers; restore matching editor source only when approved, with reminders disabled.
4. Verify immediate WhatsApp, readable matching saved acknowledgement, uncertain recovery, same-ID retry and protected Confirmed/Paid/Replied behavior. Reconcile partial writes without replacing IDs or duplicating mail. Do not reactivate triggers. Real submissions/emails require separate permission.
5. For a shared defect, stop and prepare a separately approved fix or WhatsApp-only maintenance artifact. Identical snapshots cannot solve it. Reconcile Git through reviewed commits, never destructive resets/force pushes. Verify actual domain assignment before resuming auto-release.

Operational sources: [Apps Script versioned deployments](https://developers.google.com/apps-script/concepts/deployments), [Vercel staged production deployment](https://vercel.com/docs/cli/deploy#skip-domain), [Vercel promotion](https://vercel.com/docs/cli/promote). Mechanics do not grant authorization.
