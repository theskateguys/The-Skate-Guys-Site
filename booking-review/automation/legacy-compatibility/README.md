# Legacy Compatibility Candidate

Guarded replacement, NOT deployed to production. The historical isolated
version-3 attempt used the earlier global duplicate guard and stopped on copied
historical duplicates; see `../LEGACY_ISOLATED_ACCEPTANCE.md`. The current local
revision isolates duplicate rejection to the ambiguous target ID across all four
tabs while preserving global schema/header guards. Its isolated Google evidence
must be read separately; local tests alone do not establish deployment or acceptance.
No production deployment/test is authorized by these notes. `Code.gs` replaces the legacy project's `Code.gs`, never an additional
file beside strict `Code.gs`. It has no EmailLogo.gs or HTML-letterhead dependency.

Baseline: review branch `codex/single-session-booking-review`, base `02639f8`.
Contract evidence: `../LEGACY_ENDPOINT_COMPATIBILITY.md`, the actual inspection
JSON, and pinned source `51ddd8f:automation/google-apps-script/Code.gs` (LF SHA256
`8a66986cf87ce39024a929a34b1e4c710606ecbc58c7a354c233a15d44b82dd2`).
The offline suite checks that fingerprint before comparing known envelopes.

## Contract And Scope

- Keeps `lead_submit`, `whatsapp_opened`, honeypot success, duplicate response,
  unknown-ID tracking response and legacy validation errors except the explicitly
  approved optional booking email change: blank booking email is accepted without
  mail/subscription; malformed nonblank email is rejected. Newsletter email and
  affirmative consent remain required. Participant-less old forms remain accepted, not routed
  through the strict participant validator. Invalid timestamps additionally fail
  explicitly before writes.
- Original Package, Preferred Time, Adult/Child, rentals, consent, Notes, attribution
  and contact fields retain legacy normalization/sanitization. They are historical
  requests, not agreed prices, participant details or confirmed appointments.
  Adds only `Legacy Review Required` to the three booking/status tabs, on the right.
  New booking/repair rows flag staff reconciliation. Existing Notes/rows are not
  rewritten to backfill this flag. No raw-payload PII copy or participant invention.
- Fresh successful saves retain one plain transactional acknowledgement under the
  submission lock. It states the current TT$80 per person / 75-minute session with
  skate rental included, missing-detail/availability checks, not-confirmed status
  and no payment taken. No retired Elite offer or historical-price promise.
  Consent-No bookings do not subscribe; consented email leads retain their separate
  plain update-list acknowledgement. No new acknowledgement enable property/flow.
- Any existing ID in Leads, Bookings OR Follow Up Status makes the operation a
  duplicate: repair missing rows only, never resend acknowledgement or recover a
  subscriber automatically. Existing rows/timestamps/Notes stay untouched. Repairs
  prefer surviving sheet fields over changed retry fields; information absent from
  every surviving tab cannot be reconstructed and needs staff review.

## Safety Rules

Every mutation helper acquires the same project script lock, including direct
calls. Nested helpers reuse the execution's lock; queued Sheet writes flush before
release. Submission, repair, subscription and acknowledgement stay in that locked
execution. Deployments coordinate only if they share the project AND all their
writers actually honor its script lock.

All three status tabs are checked. New missing rows inherit Paid before Confirmed,
then Replied/later existing states. Existing Paid/Confirmed/Replied or unknown
staff states block automatic transitions globally and are never overwritten.
Tracking still sets the WhatsApp flag, but advances only New Lead status. The
legacy tracking response is an event acknowledgement, not proof of stored status.

Headers are mapped, never reordered/relabelled. Missing nonidentity columns are
appended; populated sheets missing identity/status headers, blank/duplicate or
case/whitespace-ambiguous headers fail globally for staff review. Multiple rows
for the requested ID in ANY tab reject that identity before target writes; all
its rows remain untouched. Unrelated unique IDs are not blocked by historical
duplicates. Email-address subscriber upserts also check ambiguity of the existing
subscriber's identity. Existing custom/formula cells are preserved. Subscriber updates touch only
owned nonidentity profile cells and skip formulas; original identity/time/status
and consent are not rewritten.

`TSG_AUTOMATIC_REMINDERS_ENABLED` is disabled when absent and accepts ONLY the
literal string `true`. Installer removes only visible matching reminder triggers
and creates none while disabled. Runner and directly invoked worker both guard
execution. Enabled reminder tests are mocks only: cross-tab statuses/email are
checked before/after detail reads and immediately before send; eligibility is
rechecked after send, with fresh target status reads immediately before writes.
Sending also requires an existing, empty, formula-free `Last Contacted` cell;
without a writable delivery marker the candidate fails closed before email.

## Verification And Limits

Run from the worktree: `node automation/check-legacy-compatibility.mjs`.
The targeted suite covers exact pinned legacy envelopes, all-three-tab
Paid/Confirmed/Replied protection, missing parent/children and all presence subsets,
mixed strongest states, partial-append repair, duplicate/mail failure behavior,
disabled installer/runner/worker, mock-enabled reminders, read/send-time staff
edits, reordered/additive/custom headers, formulas, ambiguity/duplicate rejection,
direct helper locks, flush ordering and two-VM simulated lock contention/retries.
It does not test or change the strict/new participant contract.

The expanded 62-group suite is in-memory, not isolated Google acceptance or production
verification. The separate stopped Google run proves fail-closed rejection and
no writes, NOT the successful-save/protected-status matrix. The lock serializes
cooperating scripts; it is not an ACID Sheet
transaction or rollback. Earlier appends can survive a later service failure and
are repaired on retry. Sheet UI edits/other script projects bypass this lock; a
manual edit between the final read and write/send cannot be made atomic, and a
message already sent cannot be recalled. Staff must reconcile partial mail or
subscriber failures; duplicates deliberately do not resend, and no exactly-once
mail guarantee or delivery ledger is introduced. Target ID/header scans
favor safety; production volume/quota/timeout behavior is not measured here.

### Manual-Recovery Limit

This is an Astra-review-led test/docs follow-up to the parent review, not a second
Astra review or a source-code fix. The full `doPost` offline regression uses only
canonical mock identities `TSG-OFFLINE-CONSENT-HISTORICAL` and
`TSG-OFFLINE-CONSENT-PARTIAL`, with `consent-partial@example.test`. It covers an
affirmatively consented new booking whose email matches a historical subscriber
with a different Lead ID ambiguous in a status tab (each of the three tabs is
checked within one group). All three new booking rows are appended before the
subscriber's cross-ID snapshot throws and `doPost` returns `ok: false`. Historical
rows, subscriber data, Notes, provenance and statuses remain unchanged, and no
mock email is sent by the failed submission. An unchanged same-Lead-ID retry
returns `duplicate_ignored` with no row changes, subscriber recovery or email.

Storage may therefore complete while subscription/acknowledgement fails. Keep the
same Lead ID on retry; never use a new ID to bypass this failure. The customer
request is not confirmed. Hold for staff review: separately inspect consent,
ownership and the ambiguous identity mapping under the approved backup and
reconciliation process. This documents an operational limit, not a new automated
flow or business policy. It authorizes no automatic marketing, resend, merge or
status downgrade; preserve Notes and provenance. No automatic subscriber/email
recovery is provided by the duplicate path.

These regression tests are offline only. The email-bearing Google case is NOT
authorized and has NOT been run as part of this follow-up. Source `Code.gs`, the
ongoing isolated matrix and production remain unchanged by this test/docs work;
the parent owns other documentation and acceptance evidence updates.

The parent's production recheck reports the legacy Head reminder still active;
this source has not changed it. Operational pause/owner/in-flight audit and any
safe restoration require the parent's `../PRODUCTION_REMINDER_CUTOVER.md` process
and separate explicit authorization. Updating a deployment does not stop old
in-flight executions. No production release decision is implied by passing mocks.
Audit header integrity and inventory ambiguous IDs BEFORE production decisions.
The revised legacy guard can leave ambiguous identities quarantined without
blocking unrelated requests, subject to actual isolated acceptance and final
release review. Conflicting statuses are not permission to rewrite records;
Replied/Confirmed/Paid or unknown staff states remain protected across companions.
Staff reconciliation and the strict backend's own ambiguity behavior remain
separate gates. Never silently deduplicate or repair historical records.
