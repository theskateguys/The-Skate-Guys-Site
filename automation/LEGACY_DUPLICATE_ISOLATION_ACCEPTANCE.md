# Guarded Legacy Target-ID Isolation Acceptance

Functional response/row matrix: PASS. Production release: NO-GO.
This is real isolated Google evidence, not production verification.

## Exact Destination and Source

- Project: 1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU
- Synthetic-only Sheet: 1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8
- Separate deployment version 2, displayed 16 October 2026 9:32 PM GMT-04.
- Deployment ID: AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g
- Endpoint: https://script.google.com/macros/s/AKfycbw7On5pvG1ohVzbESEu_JkOyhGt1EIHyWaYJt_moU16A6VEq7NM6QI4pq8idYfF1NCW7g/exec
- Immutable version-2 Code.gs was copied from Project History and matched LF
  SHA-256 c8a2f98e9b0eb4a8c01c326e3184e1dc3c9ab35cc9ac801ada1e075ca108425f (24,761 LF characters).
- Original synthetic version 1 and its URL remain intact. Both versions share
  ONLY this synthetic Sheet property; no historical strict test project was
  retargeted. Production URL/Sheet/trigger/website were not changed.
- Source/manifest/settings backup: CLEAN_LEGACY_VERSION1_BACKUP.json. Native
  Sheet checkpoint copies before seeds and focused repairs are recorded in JSON.
- End checks: reminders=false; 0 owner-visible installable triggers. Simple
  onOpen only creates the TSG menu when viewing the Sheet; no setup, installer,
  reminder, email or payment flow was manually invoked.

## Why the Guard Changed

The old inspectSheet_ scanned every ID globally and threw for any duplicate during
shared preflight, so even unrelated requests failed. An actual version-1 retry
for an unrelated unique ID with deliberate duplicates returned:

```json
{"ok":false,"error":"Duplicate Lead ID in sheet; staff review required."}
```

It took 1.96 s with no row changes.
The revision keeps global schema/header safety but resolves the requested ID in
all four tabs before writes. Ambiguous targets return a sheet-specific error;
all their rows remain untouched. Other unique IDs can proceed. Reminder loops
skip only the typed ambiguity error. Existing status conflicts are NOT reconciled
or overwritten; new missing children inherit a safe surviving status and Notes.

## Actual Native Google Checks

- 29 main native requests: fresh unique save/track/retry despite historical
  duplicates; 8 ambiguity rejections (save retry and tracking in each of Leads,
  Bookings, Follow Up Status and Email Subscribers); all nine protected-status
  tracking/retry pairs (Confirmed/Paid/Replied in each status tab).
- One existing-record native retry after transport diagnosis: matching
  duplicate_ignored, all rows unchanged.
- 9 focused native requests: cases 0,4,8 cover Confirmed/Leads, Paid/Bookings and
  Replied/Follow Up. Deliberately reset their two tracking flags to No, verify
  actual No-to-Yes with every status/Note unchanged, remove only a designated
  non-protected synthetic child, restore exactly one child on same-ID retry,
  then retry again without new rows. Three scoped removals/restorations; all
  ambiguous fixture rows remain unchanged throughout.
- Total: 39 native response/network/row contract passes, plus 2 retained failed
  diagnostic attempts = 41 booking POSTs for revised version 2. Native successes
  use non-intercepted browser fetch plus actual request logs: exactly one POST
  to the pinned URL and Google content GET redirects, never a mocked response.
- Every successful submission/retry returned the matching Lead ID. All expected
  ambiguity errors matched their target tab and preserved every row. No opaque,
  health-only, mismatched or timed-out response was counted as saved/acknowledged.
- Every request had immediate connector row readbacks and comparisons of all
  unrelated row values, Notes and statuses. Exact target rows and row references,
  counts, Google JSON and redacted network traces are in the companion JSON.

## Counts and Deliberate Historical Conflicts

| Phase | Leads | Bookings | Follow Up | Subscribers |
| --- | ---: | ---: | ---: | ---: |
| Completed clean version-1 baseline | 10 | 10 | 10 | 0 |
| After deliberate ambiguity fixture seeds | 14 | 14 | 14 | 2 |
| First save with uncertain browser response | 15 | 15 | 15 | 2 |
| Second fresh save with matching native acknowledgement | 16 | 16 | 16 | 2 |
| Final, after all focused repairs/retries | 16 | 16 | 16 | 2 |

Four intentional duplicate groups remain (one selected ID repeated twice per tab)
as required for coexistence testing. No unintended duplicate or lost row appeared.
The two subscriber rows were MANUALLY SEEDED blank-email ambiguity fixtures,
not subscribers created by any consent-No booking. Row numbers shift only during
authorized synthetic child removals; the evidence records before/after references.
A final ID-column scan across every existing grid row matched the bounded full
row snapshots exactly. No records were cleaned up to manufacture acceptance.

## Transport and Latency: Not an Operational Timing Pass

The first interception-based attempt timed out at 60,004.2 ms; matching three rows
were observed and the Google execution showed Completed in 58.092 s. A planned
unchanged retry then returned health JSON via repeated content-to-exec GET redirects,
not a booking acknowledgement; rows stayed unchanged. Both attempts remain failures
in the evidence. We paused, confirmed completed execution and stable rows, and
used the same existing ID for recovery rather than creating a duplicate.

A read-only native health probe succeeded in 2.15 s. A clean non-intercepted native
retry returned matching duplicate_ignored in 31.92 s. A fresh native save then
returned matching New Lead in 56.48 s. No backend source changed
between these attempts. The observed difference does not prove interception caused
every delay or redirect.

[Playwright network documentation](https://playwright.dev/docs/network) treats
redirect chains as one routed unit, and its [page.route documentation](https://playwright.dev/docs/next/api/class-page#page-route)
notes that routing sees the first URL and disables cache. Therefore an intercepted
redirectCount=1 is not a valid acceptance gate. That diagnostic assertion was
corrected; release evidence uses actual request logs instead. [Google documents](https://developers.google.com/apps-script/guides/content#redirects)
ContentService's one-time content URLs and the need to follow redirects.

Across the 39 native contract passes: min 3.15 s,
max 56.48 s, mean 20.54 s;
**13/39 exceeded the unchanged 25-second website budget**.
The 25-second budget here is the review branch client configuration, not a fresh
measurement of the live website. The native harness uses a 90-second DIAGNOSTIC capture limit (the first successful
native retry used the earlier 60-second diagnostic limit). Neither changes the
website's 25000ms timeout or makes slow results a production pass. Immediate
WhatsApp/uncertain-delivery recovery in website runtime files is untouched.
Exact Sheets/email/startup phase attribution was not measured; blank-email source
paths return before MailApp, and execution duration is not a Sheets-only timer.
Real concurrent Google lock behavior remains unverified.

## Email, Settings and Privacy

All actual booking emails were blank, consent No, and all row readbacks retained
blank email. Verified source returns before MailApp for those records. No reminder
or trigger-installer function was invoked. Sender profile info.theskateguys@gmail.com
was checked; a scoped Sent search for the exact run prefix returned zero matches.
This corroborates the no-mail test path, not an exactly-once delivery ledger.
No email-bearing Google test was run. The separate 62-group offline suite includes
full-flow consented subscriber-collision partial storage/retry coverage; this is
mocked evidence and that behavior remains a documented manual-recovery limit.

All four native tabs were visually inspected at 100% zoom. Existing dimensions
were retained: long synthetic IDs/Notes truncate in-cell, with full values available
in the formula bar and recorded JSON. No Sheet formatting or column-width changes.
These are test database views, not customer booking-page previews.

## Review and Release Decision

See LEGACY_DUPLICATE_ISOLATION_REVIEW.md. Astra supports conditional coexistence
under a sole guarded writer, valid headers, drained old executions, controlled
staff edits, reminders off and manual handling of ambiguous identities. It does
not authorize live reconciliation or status merging. Astra reviewed the same
source before the final matrix cases finished; the parent records the remaining
factual results, not a second review or retrospective approval.

Production remains NO-GO: resolve/profile the over-budget latency, approve
backup/pause/drain and guarded-writer cutover, and resolve strict backend first-match
ambiguity before strict/website rollout. The consented subscriber partial-save
limit must be explicitly handled, not represented as complete automatic recovery.
No push, merge, live repair, production endpoint change or website deployment occurred.
