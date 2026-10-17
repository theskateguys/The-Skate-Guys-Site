# Local Legacy Acceptance Plan

Prepared against clean review HEAD `b0709ddf7c6f07961b8a04ea192459b37785c6c1`,
branch `codex/single-session-booking-review`. This is a fixture/plan artifact,
not a test runner or evidence of Google acceptance. No external actions belong
to this task. Subsequent explicit approval extends local scope to the legacy
validator, focused offline regressions and README. No deployment, endpoints or
customer data are changed.

## Approved Validation Change

The baseline candidate calls `normalizeLead_` then `validateLead_` before saving.
At b0709dd it required valid email for every booking. All fixtures intentionally
have `email: ''` and consent `No`; that baseline rejects save/retry/repair with:

```json
{"ok":false,"error":"A valid email is required."}
```

The user subsequently explicitly approved optional blank booking email. The local
candidate accepts normalized blank booking email, rejects malformed nonblank
email, and still requires newsletter email and consent. Existing no-recipient
guards skip mail and subscription for blank email. Focused regressions exercise
the actual candidate in the offline harness, not a fake validation pass.
Fixture response names ending `AfterApproval` refer to this approved change.
Verify the isolated deployed source/version before success testing. If it returns
the baseline error, record BLOCKED (zero submission rows/mail; a partial record
remains partial), never PASS or a reason to supply placeholder email. Tracking
has a separate action path and cannot establish save/retry/repair acceptance.

## Fixture Contract

Import `createAcceptanceFixtures` from `./acceptance-fixtures.mjs` and pass one
canonical UTC timestamp, e.g. `2026-10-16T23:00:00.000Z`. Import and generation are
pure, with no network, filesystem writes, Google SDK, browser or automatic run.
Record the chosen timestamp and returned prefix in the parent's evidence before
seeding. Ten deterministic IDs use `LEGACY-ACCEPTANCE-<timestamp>-<case>`.
The parent must check for prefix collisions before writes; use a new timestamp
for a genuinely new run, never for an unchanged retry. No hidden random IDs.

One fresh ID and nine matrix IDs cover Confirmed/Paid/Replied held separately
in Leads, Bookings and Follow Up Status. Each matrix ID has all three synthetic
seed rows: only the selected tab has the protected status; others are New Lead.
Every seed row has a distinct retained staff Notes sentinel. Payload Notes are
different, so retry overwrite is detectable. Seed header-keyed records by header
name using the parent Sheets tooling, not lead_submit. Fill other existing
columns with blank values; do not replace headers or existing data.

All contacts are labelled TEST ONLY, email is blank, WhatsApp is deliberately
non-contactable text, and consent is No. Do not replace these with deliverable
contact details. Payloads represent participant-less old forms: no participants,
participant count, age, lesson date or strict-contract inventions. Package/time
are historical preferences, not price, availability or confirmation promises.

## Parent Preconditions

The user authorizes guarded legacy deployment into the isolated project,
copied-Sheet backups and actual Google tests; only the parent executes those
actions. No production deployment, endpoint switch, customer email, push, merge
or commit is authorized by this plan.

Before any write, the parent records the isolated project/deployment/version,
copied Sheet ID, script spreadsheet property and backup IDs. Explicitly verify
these are not live destinations and that every test uses that exact binding.
Keep automatic reminders disabled (`TSG_AUTOMATIC_REMINDERS_ENABLED` literal
`false`); verify matching reminder triggers absent and any in-flight activity
resolved before proceeding. Do not run reminder/install/setup actions as part of
this matrix. Blank email must still reach the no-recipient guard after any
approved validation change; consent No alone does not suppress transactional
acknowledgements for email-bearing bookings. Abort before submitting if this
no-email condition cannot be established. Never use existing customer records.

Read header/ID integrity first. Record total data-row baselines B per tab,
excluding headers, and prefix-specific counts (initially zero). A copied Sheet
may contain customer data: do not extract it into fixtures, seed from it, or
write/delete its rows. Work only with the exact ten generated IDs. Back up the
copy before seeding and each destructive partial-repair phase; keep readbacks
limited to test IDs and necessary aggregate counts.

## Sequential Procedure And Responses

The parent performs one action, captures its response, then reads back all three
status tabs and subscriber counts before the next action. No batching requests
or concurrent submissions. Persist payloads once and reuse them byte-for-byte.

1. **Validation gate:** verify the isolated deployed source includes the approved
   optional-email change and matches the parent's recorded local source hash.
   The fresh save below is the real Google blank-email check. If the baseline
   email-required rejection appears, record BLOCKED and stop success testing.
   Never retry rejection with an email address to manufacture a pass.
2. **Seed matrix:** parent writes the 27 header-mapped synthetic seed rows from
   `protectionCases[].seedRows`. Read back all sentinels, blank emails, statuses,
   flags No and exact-one-ID-per-tab cardinality. No subscriber rows are seeded.
3. **Fresh old-form save (after approval):** submit `fresh.payload`. Expect
   `{ok:true,leadId,status:"New Lead"}` and exactly one row in each status tab,
   no subscriber, no email. Verify historical fields, consent No, blank email,
   Notes and `Legacy Review Required` reconciliation flag. Do not invent
   participant data or require migration/backfill of existing participant columns.
4. **Fresh tracking:** submit `fresh.trackingPayload`. Expect
   `{ok:true,leadId,status:"WhatsApp Opened"}`. Leads/Bookings flags become Yes;
   their New Lead statuses become WhatsApp Opened. Follow Up Status stays New
   Lead. No rows appended. Snapshot now, then submit the unchanged fresh payload:
   expect `duplicate_ignored`, no row/cell changes, no subscriber and no email.
5. **Nine protection cases:** for each case, read its baseline, then submit its
   tracking payload. Response status is WhatsApp Opened, an event acknowledgement
   and NOT the persisted booking status. Both tracking flags become Yes, but
   all three stored statuses remain exactly their seeded values: a protected
   status in any tab blocks automatic transitions globally. All Notes survive.
   Snapshot after tracking, then submit the unchanged case payload. Expect
   `duplicate_ignored`, unchanged snapshot, zero row delta and zero email.
6. **Partial missing-child repair:** optionally reuse each same matrix ID after
   step 5 to avoid nine extra fixtures. For full acceptance coverage, exercise
   all nine repair cases (or mark omissions NOT RUN). Back up/read back, remove
   only that case's `repair.missingChildTab` test row via parent Sheets tooling,
   and confirm exactly one missing row and the protected survivor intact. Never
   remove the protected row. Resubmit the identical original case payload;
   expect `duplicate_ignored`, exactly one restored child row, inherited
   `repair.expectedStatus`, `repair.expectedNotes` and reconciliation flag.
   Existing rows, status/Notes sentinels and timestamps must not change. The new
   child uses canonical surviving Leads Notes, not the deleted child's sentinel
   or payload Notes. Existing tracking flags stay Yes; a reconstructed Bookings
   flag inherits Leads Yes. Follow Up Status has no WhatsApp flag. Read back the
   restored row, snapshot, repeat unchanged retry and verify zero further delta.

## Counts And Stop Rules

All numbers are data rows, not physical Sheet capacity; subscriber delta is
always zero. Add the following deltas to each tab's recorded baseline B:

| Phase | Leads | Bookings | Follow Up Status | Email Subscribers |
| --- | ---: | ---: | ---: | ---: |
| Initial prefix | 0 | 0 | 0 | 0 |
| Baseline candidate blank-email rejection (if encountered) | 0 | 0 | 0 | 0 |
| Nine complete matrix seeds | 9 | 9 | 9 | 0 |
| Approved fresh save plus seeds | 10 | 10 | 10 | 0 |
| Tracking and unchanged retries | 10 | 10 | 10 | 0 |
| Completed nine repairs | 10 | 10 | 10 | 0 |

During each sequential repair only the removed child's count dips from 10 to 9
and returns to 10 after the append. Across nine repairs: six Bookings removals
and six matching appends, three Follow Up Status removals and three matching
appends, zero Leads changes. Net repair delta zero, not nine additional leads.
Fresh save is +1/+1/+1; tracking/retry is +0/+0/+0; each repair is +1 only in the
missing tab relative to its immediate partial baseline. Final prefix counts are
10/10/10/0 (30 test rows, ten distinct Lead IDs), assuming every phase ran.

Stop immediately on protection loss, lost Notes, duplicate ID, unexpected row
or subscriber delta, email attempt/send, destination mismatch or unexplained
error/partial result. Preserve evidence; do not continue the matrix, silently
deduplicate, repeatedly resubmit, or restore over unrelated rows. A response
alone is insufficient: use sequential Google readbacks for each verdict.

## Evidence And Handoff

Capture candidate hash/version, destination/backup identifiers, reminder safety,
run timestamp, exact test payloads/responses, before/after test-row values and
counts, Notes retention, status protection and no-email evidence. Report each
phase PASS/FAIL/BLOCKED/NOT RUN. A local generator assertion or VM validation
probe is offline evidence only, not mocked save coverage, a browser check,
isolated Google acceptance or production verification. No production acceptance
or release decision follows from this plan.

Actual attempt stopped at the first native Google response because pre-existing
duplicate IDs triggered the integrity guard. No fixtures were seeded or saved.
See `../LEGACY_ISOLATED_ACCEPTANCE.md` and JSON for the version, response,
before/after evidence, missed baseline uniqueness preflight and next approval.
Do not execute the remaining matrix or repair historical rows automatically.

Next action: obtain a decision on a dedicated clean synthetic acceptance Sheet
AND separate isolated script project, or reviewed repair of the copied data,
before any further deployment/test. Never retarget the existing test project's
shared Sheet property: it also controls retained strict v1/v2 deployments.
Recommended
model: gpt-6.1-sol (medium) for scoped orchestration, gpt-6-astra for conflicting
evidence and final release review. The fixture/validator work used explicitly
selected `gpt-6.1-sol`; parent owns external actions and the final evidence.
The local optional-email change is approved, but successful Google acceptance
has NOT completed. Offline checks cannot establish
deployment binding, Google service behavior or production readiness.
