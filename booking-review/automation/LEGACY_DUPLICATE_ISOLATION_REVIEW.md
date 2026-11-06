# Astra Review: Legacy Target-ID Isolation

Read-only review by explicitly selected gpt-6-astra. No external calls, edits,
deployment or commit by that reviewer. Source reviewed: LF SHA-256
c8a2f98e9b0eb4a8c01c326e3184e1dc3c9ab35cc9ac801ada1e075ca108425f.

## Decision

Conditional YES for coexistence under this legacy writer: ambiguous identities
across all four tabs are rejected before target writes; unrelated unique IDs may
proceed. Existing protected statuses remain unchanged. Only typed ambiguity
errors are skipped by reminders. This is not authority to reconcile existing
status conflicts or repair historical rows.

Required conditions: valid headers, accepted exact source, sole guarded automated
writer, old executions drained, controlled staff edits, reminders disabled, and
manual handling of quarantined identities/subscriber failures. Script locks do
not make Sheet UI edits atomic.

Production decision: NO-GO. No production action is authorized by this review.

## Outstanding Release Gates

1. Production's existing unsafe Head/trigger/writers are unchanged. Explicit
   backup, pause, owner/in-flight audit and drain approval are required before a
   compatibility cutover. Other projects and staff edits bypass this script lock.
2. Latency: native fresh response approximately 56.48 s and an unchanged retry
   approximately 31.92 s exceed the unchanged 25-second website budget. A 90-second
   diagnostic limit is not a remedy. Repeated scans under the lock also raise
   contention risk; real concurrent Google acceptance is not established.
3. The separate strict backend still uses first-match tracking for duplicate IDs.
   Full strict/website cutover needs approved reconciliation or separately
   implemented and accepted strict ambiguity quarantine. The legacy revision does
   not protect writes performed by that unchanged backend.
4. A consented request can append booking rows before a cross-ID subscriber
   collision fails. Same-ID retry deliberately skips subscriber/ack recovery.
   Preserve historical rows; document manual review or implement separately
   reviewed handling before claiming complete consented-submission recovery.
   Google email-bearing acceptance is not authorized in this task.

## Review Timing and Follow-Up

The reviewer saw completed version-1 evidence (39 actual Google POSTs), the revised
source and offline tests, and established version-2 native evidence: eight
ambiguity rejections, unique save/tracking/retry, and all three Confirmed
tracking/retry pairs. Paid/Replied and the focused recovery checks were still in
progress at review time and were NOT treated as passed.

The parent records later actual results separately in
LEGACY_DUPLICATE_ISOLATION_ACCEPTANCE.md/json. No second Astra review is implied
by those factual additions. Source bytes must remain identical; any further code
change needs new review and exact-version acceptance. Local test/documentation
follow-up covers the full subscriber partial-save sequence without sending mail;
it does not change the deployed source or resolve that behavior automatically.

Next actions: finish and record isolated evidence; profile/resolve or explicitly
review the latency and subscriber-recovery limits locally/isolated only; obtain
separate production operational and deployment approvals only after release gates
are cleared. Do not restore an unsafe backend or old offer as fallback.
