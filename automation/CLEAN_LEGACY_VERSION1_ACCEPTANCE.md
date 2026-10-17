# Synthetic Legacy Version-1 Acceptance

Result: PASS for the original guarded legacy source, not production verification.
Supersedes the blocked preparation status at commit eff7a9be. The earlier stopped
attempt remains historical in CLEAN_LEGACY_ACCEPTANCE.md/json.

- Project: 1PwInosoMgf7Cp0mHH97SlAQ1j1BnJqs2ycis75awxIkBiAS6CPWWh7dU
- Sheet: 1jt4AZNBfIv0SOwWzalfMRiTdqdjzpWn6--g91db11e8
- Immutable version: 1, LF SHA-256 8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35
- Endpoint: https://script.google.com/macros/s/AKfycbyWtXY4AYK4wjgLeDDn60APzI_fF1VYpBdZ0PS30eYqEoBrvzVmqKQxYjR38jwMZF0MLg/exec
- Source, manifest, properties and zero-trigger verification: CLEAN_LEGACY_VERSION1_BACKUP.json.
- Fresh native browser response: matching Lead ID and New Lead, 26702.3 ms.
- 39 actual Google POSTs passed: fresh save/track/retry, nine protected-status
  tracking/retry pairs, and nine missing-child repair/retry pairs.
- Nine intentional synthetic companion removals; exactly one child restored each
  time. Surviving rows/statuses/Notes unchanged; repaired rows inherit the protected
  status and canonical staff Notes. Subsequent unchanged retries add nothing.
- All response Lead IDs and statuses were readable and matched expectations.
  Tracking acknowledgements are event receipts, not stored booking confirmation.
- Before fixtures: 0/0/0 booking rows, 0 subscribers. After seeding: 9/9/9, 0.
  After save and after every completed recovery: 10/10/10, 0.
- Actual latency: min 8.99 s, max 27.34 s,
  mean 15.30 s; 2 responses exceeded 25 s.
  The diagnostic harness uses 60 s, NOT the website's unchanged 25 s. These
  legacy-backend timings are not strict-backend performance or a production SLA.
- All contact data fabricated, email blank, consent No. Verified source returns
  before MailApp when email is blank. No reminder or trigger-installer functions
  invoked; reminders=false and zero triggers independently observed.
- Tracking POSTs did not open/send a WhatsApp message. Frontend UI tests were not
  repeated because this task changes no website runtime files.

Exact response JSON, per-step target row references/values, counts, and final
snapshot are in CLEAN_LEGACY_VERSION1_ACCEPTANCE.json. The parent compared ALL
unrelated row values after each action; the public evidence includes target rows
plus seed/final snapshots to avoid needless repetition. These are real native
browser fetch responses and connector row reads, not mocked network responses.

After this baseline, intentional ambiguity fixtures were added for the separately
approved version-2 phase. Those later row totals are recorded separately and do
not alter this completed baseline. No live or historical customer Sheet was edited.
