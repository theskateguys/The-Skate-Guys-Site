# Guarded Legacy Isolated Acceptance

Status: BLOCKED / STOPPED at the first real request. Base `b0709ddf7c6f07961b8a04ea192459b37785c6c1` on
`codex/single-session-booking-review`. User authorized this isolated deployment,
copied-Sheet fixtures and blank-email tests. Optional legacy booking email was
separately approved after identifying the original validator conflict.

## Backups And Destination

- Isolated project: `1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9`.
- Test Sheet: `1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM`.
- Before-change backup Sheet: `1e2IzT0k6p5mS7JxmSwGcsgqO9VDIq2V5w7RM9vSfcfE`.
- Its copied bound source project: `1Qw1kW6WbNUlxx2FPhw6fzNynbeNz4ulY49WXItOOB5Kxz51Y1YDYRNXJ`.
- Backup `Code.gs` matched the original editor exactly (32431 clipboard characters,
  including CRLF); `EmailLogo.gs` matched exactly (161142 characters).
- Backup Sheet cells matched the original bounded baseline, including stored
  values, effective/display values and validation. Baseline data counts:
  Leads 21 / Bookings 18 / Follow Up Status 18 / Email Subscribers 7.
- Private baseline retained locally under ignored
  `output/acceptance/legacy-acceptance-before-private.json`; SHA-256
  `8d80d006fd61b9d7060cca397b078849f47132b55102afa7155dbcf6718d3f88`.

Before editor replacement, the isolated properties were read directly:
`TSG_AUTOMATIC_REMINDERS_ENABLED=false` and `TSG_LEADS_SPREADSHEET_ID` matched the
test Sheet above. Existing design-email send guard and profiling Lead ID remained
unchanged. Timezone America/Puerto_Rico GMT-04, V8 and cloud exception logging
enabled; default GCP project. One unrelated `onOpen` trigger, zero reminder
triggers. These settings were not inferred from the backup or local manifest.

The isolated editor's `Code.gs` was replaced, read back through the editor and
matched the reviewed LF source exactly (24065 characters), SHA-256
`8616a9d5fc098d1fe7408db21c25065b8748932b63bd6736b8f8acf1c84f7e35`.
Existing `EmailLogo.gs` is retained unchanged and unused by legacy code. No
setup/install/reminder/email function is run. Existing strict version-1/version-2
deployment URLs must remain unchanged.

## Fixtures And Stop Rules

Run timestamp: `2026-10-17T00:10:00.000Z`; prefix
`LEGACY-ACCEPTANCE-20261017T001000000Z`. Ten synthetic IDs; blank email, consent
No and non-contactable WhatsApp text. No existing customer identity is reused.
See `legacy-compatibility/acceptance-fixtures.mjs` and `acceptance-plan.md`.

Each action needs actual readable Google JSON followed by Sheet readback. Stop
on any protected-status change, duplicate, lost staff Notes, unrelated-cell
change, destination mismatch, unexpected email or uncertain result. No silent
retry or cleanup of a failing result. Offline checks are not Google acceptance.

Offline optional-email regression suite: 42 groups PASS. No production result
is claimed by these notes.

## Actual Deployment And First Request

New isolated Web App deployment, version **3**, 16 October 2026 at 8:06 PM GMT-04:
`AKfycbxNvwUUKELEdP4kQIMxdUapXfLu7XdG0EOLsX_o_fjD8EmVq4U7PHhg41j73Fmg-ZOwKg`.
Execute as info.theskateguys@gmail.com, access Anyone, same isolated project and
copied Sheet. The new URL is separate from existing strict v1/v2 deployments;
neither existing deployment was updated. Immutable Project History version 3
was selected, its full Code.gs copied read-only and compared exactly with the
reviewed source above before submission.

Exactly one native Chromium CORS POST was made to that new isolated URL, with
fresh ID `LEGACY-ACCEPTANCE-20261017T001000000Z-FRESH`, blank email and consent No.
Readable HTTP 200 JSON returned after **4314.9ms**:

```json
{"ok":false,"error":"Duplicate Lead ID in sheet; staff review required."}
```

This is NOT a successful save, matching-ID acknowledgement, duplicate_ignored
acceptance or uncertain delivery. The guard refused the operation before writes.
The runner reported `pass:false`; no second request or automatic retry occurred.

## Stop And Readback

Read-only investigation found one pre-existing duplicate-ID group, at rows
**2, 4, 5, 6, 7, 8**, in EACH of Leads, Bookings and Follow Up Status. The same
groups are present in the retained BEFORE snapshot, proving the attempted save
did not create them. Existing customer/reference values are kept out of public
evidence; the row coordinates are sufficient for authorized staff review.

The initial baseline/backup comparison was completed, but duplicate-ID analysis
of that baseline was missed before the first POST. The backend preflight caught
it. Future orchestration must check whole used ID columns for uniqueness BEFORE
any submission, not merely compare backup cells or the new run-prefix collision.

- Before/after counts: **21 Leads / 18 Bookings / 18 Follow Up Status / 7 subscribers**.
- The complete bounded before/after CellData snapshots matched exactly, including
  existing values, effective/display values and validation. No status or Note changed.
- A separate bounded scan of all 1000 existing ID rows in each tab found no test
  prefix, no extra records beyond the baseline counts, and the same duplicate groups.
- No fixture rows were seeded, removed, repaired or appended. No header migration
  occurred. No protected record was edited.
- Sender-account reference search found zero messages for the test prefix. The
  source's failure path exits before acknowledgement, and every payload had blank email.
- The retained before AND after private snapshot files have the same SHA-256
  `8d80d006fd61b9d7060cca397b078849f47132b55102afa7155dbcf6718d3f88`.
- Browser and loopback server were stopped. Post-test settings still read false;
  trigger inventory still shows only the unrelated onOpen. No reminder,
  setup, install or email function was run. Production was not accessed or modified.

## Matrix Result

| Check | Actual Google result |
| --- | --- |
| Immutable deployment/source identity | VERIFIED, isolated version 3 |
| Fresh old-form save | BLOCKED by pre-existing duplicate-integrity guard |
| Fail-closed rejection / no writes | VERIFIED by response and exact snapshot readback |
| WhatsApp-open events | NOT RUN after stop |
| Unchanged retries / duplicate_ignored | NOT RUN after stop |
| Partial-record recovery | NOT RUN after stop |
| Confirmed/Paid/Replied matrix | NOT RUN after stop |
| Real reminder sends | NOT RUN / forbidden; reminders disabled |

## Next Decision

No cleanup is authorized after the stop condition. Do not delete/deduplicate or
rewrite copied historical records, weaken the guard, switch the test target or
rerun automatically. Seek approval for either a new dedicated acceptance Sheet
AND separate isolated script project with the required schema and only synthetic
fixtures, or a staff-reviewed repair
of the copied Sheet. The former avoids touching copied historical records. Any
new binding/deployment and test run must be explicitly approved and recorded.
Do not retarget the existing test project's Sheet property: versioned strict
v1/v2 deployments share that property and must retain their original target.

Production remains NO-GO: successful isolated legacy acceptance is incomplete;
the live unsafe writer and active reminder trigger remain unchanged. Subsequent
production actions, only after acceptance and explicit approvals: fresh backups;
pause/audit/drain reminders; same-URL guarded legacy update and unsafe execution
drain; strict Head/additive migration/new strict deployment; bind BOTH release
and fallback, stage/test both, then separately approve promotion/production
acceptance. Push, merge and reminder restoration remain separate decisions.

## Astra Evidence Review

One explicitly selected `gpt-6-astra` read-only local review found no new critical
implementation defect. It independently recomputed the candidate and private
snapshot hashes and parsed counts/statuses/duplicate groups from those bounded
snapshots. Remote UI readback, whole-ID scan and email search remain parent
evidence, not independently re-observed Google results. It did not repeat tests
or access external systems. Its two wording findings were corrected: every
handoff now requires a separate Sheet AND separate project without retargeting
shared properties, and the offline test footer no longer claims the candidate
has never been deployed. GO to commit the stopped-run evidence; NO-GO for release.
