# Astra Release Preparation Review

Review date: 16 October 2026, T&T time (UTC processing continued into 17 October).
Reviewer: explicitly selected `gpt-6-astra`, one read-only final review against review
base `e27ea9b5fa2a7c282c7151c75c1b3d84c6ad082f` and actual uncommitted preparation.
No external actions, submissions or repeat email tests were performed by the reviewer.

## Decision

GO for preparation handoff; NO-GO for production automated activation.

The current published website remains exact approved WhatsApp-only build `5592c39`,
deployment `dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n`. The synthetic-bound previews must NOT
be promoted. Future production project, endpoint, production binding and origin-specific
acceptance do not yet exist. Existing live Sheet, endpoint, source and reminder remain unchanged.

## Findings And Resolution

1. Activation blocker: weekly newsletter promises are visible but this acceptance used
   consent No. Decide delivery owner/cadence/unsubscribe handling and authorize separate
   consent-path acceptance, OR approve deferring the forms/promises. Booking reminders
   are not a weekly email service. This decision remains OPEN; no copy or email flow was
   silently changed. It is explicit in Gate B of the current runbook.
2. Offline checker limitation: the original checker did not bind all identities or require
   exactly 45 distinct field checks and expected counts. The lead hardened it after review:
   project/Sheet/deployment/version/endpoint cross-bind to the verified artifact; source LF
   hashes, full unique file inventory, exact zero/one row counts, readback IDs/statuses and
   45 distinct fields are required. Seven intentionally corrupted evidence cases are rejected.
   Updated checker PASS: 84 native preview-file hashes, 45 fields, seven negative cases.
   This is offline consistency checking, NOT a second Astra review, remote re-read or signature.

No additional material blocker was found in packaging, clean-Sheet builder, customer policy
sentence or routing-document updates. Sequential row/email operations are not transactional.
An existing Lead retry can recover booking companions but skips subscriber upsert and email;
operator recovery requires inspection and specific repair/resend authority. The consented
newsletter path was not accepted by this consent-No test.

## Evidence Summary

- Actual native Google browser responses: fresh 5122.2ms, retry 5217.7ms; WhatsApp ready 2.4ms.
  Exact matching Lead ID was read before saved wording. Three row-2 records; no subscriber.
  All Sheet cells unchanged on retry; sender and recipient confirmed one branded email.
- Local browser mocks separately cover actual configured 25000ms abort, uncertain delivery,
  retained details and same-ID recovery. Native successful latency is not a timeout SLA.
- Two protected Vercel previews are READY, target null, aliases empty; all 42 files each match
  the locally Google-tested generated artifact. Hosted pages checked without another submission.
- Seven packaging unit tests, artifact reconstruction, WhatsApp links and clean-Sheet builder
  passed locally. No production Google intake test is claimed.
- Current runbook distinguishes old/new/synthetic Sheets, pause/drain, bounded dual monitoring
  and exact WhatsApp-only rollback. Old daily trigger is still active.

## Public Artifact Delta

Compared with the deployed website-only package:

- Content changes: `index.html`, `book.html`, `merch.html`, `elite.html`, `vercel.json`.
  Restore the reviewed participant form, consent/subscription interfaces and Google-connected
  acknowledgement/retry behavior; page contact CTAs/approved offer stay intact. CSP adds only
  the two Google script connect origins alongside existing self/Plausible.
- Add `assets/lead-config.js`, `assets/lead-capture.js`, `assets/lead-capture.css`.
  Endpoint is generated only in the artifact; tracked historical config is unchanged.
- Remove `assets/whatsapp-booking.js`, `assets/whatsapp-booking.css`,
  `assets/whatsapp-contact.css` from the automated public tree.
- Eight byte-only differences are CRLF/LF: events-data.js, updates-data.js, sitemap.xml and
  the five mockup SVGs. No event/merch data or image-content change.
- This describes the ISOLATED candidate, not an approved production-bound artifact.
[Historical evidence fingerprint omitted from transfer.]

## Next Three Actions

1. Commit the reviewed preparation (existing authority), resolve newsletter scope and name
   monitoring/recovery owners. Sol is recommended for scoped implementation. No release follows.
2. Obtain destination-specific production-preparation approval: independent project bound only
   to reserved empty Sheet `1oOvHxL2P4rM3-a5rxd4zTvmLE4iIM4RBEj5uWJ1NslI`, reminders false,
   zero triggers; production-bound public artifact and matching snapshot. Any real rows/email
   for production-origin acceptance need explicitly approved effects. Sol handles this work.
3. Obtain activation authority AFTER evidence: pre-change baselines; approved owner-by-owner
   old-trigger deletion; absence verification; Running AND Paused inspection; let work finish;
   agreed quiet-window rechecks; explicit artifact/alias/rollback decision; then publish/verify
   and monitor both Sheets. Hold if drain is not credible. Astra is recommended for that
   future release decision, not another review or activation under current authority.

For a shared integration defect, separately authorized rollback goes ONLY to
`dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n`; verify the alias and continue residual-writer monitoring.
Preserve all rows and paused trigger state. Reminder restoration needs separate approval.
