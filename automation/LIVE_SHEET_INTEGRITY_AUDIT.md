# Live Sheet Integrity Audit

Read-only audit on 16 October 2026 (America/Port_of_Spain). Live Sheet:
`1RCEUW2TP2Z1NaXdqeCjmmx041KyuTpBYY28Uz1EAqjU`. No writes, repairs,
deduplication, trigger changes or endpoint changes were made.

## Scope

Metadata and exact header rows were read first. Bounded reads covered rows 2-1000
of the Lead ID, Lead Type (where present) and Status columns only. No customer
names, email addresses, WhatsApp numbers, participant details or Notes were read.
The audit identifies booking companions from explicit booking Lead Type or the
presence of booking/follow-up rows; email-only Leads are not false missing bookings.
Reads across tabs are not atomic; this is an observed window, not a freeze or
guarantee that the live writer/trigger did not run outside that window.

A second bounded observation matched the initial selected CellData exactly.
Exact UTC boundaries and ranges are recorded in
`LIVE_SHEET_INTEGRITY_AUDIT_CAPTURE.json`; matching observations are not proof of
no intervening writes or a guarantee of current/future status.

Raw IDs are retained only in a Git-ignored local audit input. The generated
`LIVE_SHEET_INTEGRITY_AUDIT.json` contains opaque groups, counts, statuses and row
references, not raw Lead IDs or customer details. `complete: true` means the
supplied audit structure was analyzable, NOT that integrity passed.
The local validator also checks supplied header canonical uniqueness/spelling;
it does not certify omitted backend columns or replace full installation
preflight. After strengthening those checks, the minimized private input still
reproduced the saved report exactly. No customer values were printed by that test.

## Findings

| Tab | Populated ID rows | Unique IDs | Duplicate groups | Extra duplicate rows |
| --- | ---: | ---: | ---: | ---: |
| Leads | 17 | 12 | 1 | 5 |
| Bookings | 14 | 9 | 1 | 5 |
| Follow Up Status | 14 | 9 | 1 | 5 |
| Email Subscribers | 7 | 7 | 0 | 0 |

One shared ID occurs at rows **2, 4, 5, 6, 7, 8** in each of Leads,
Bookings and Follow Up Status: six occurrences per tab, 15 extra rows across
the three tabs. Do not infer those are disposable duplicates of the same real
customer or that the first row is authoritative. The audit deliberately did not
read contact fields or historical Notes to make that decision.

Five ID groups have conflicting statuses:

- The duplicated group above: Leads/Bookings row 2 is Follow Up Needed, rows
  4-8 are New Lead; all corresponding Follow Up Status rows are Follow Up Needed.
- Row 9 in all three tabs: Leads Replied; Bookings and Follow Up Status Follow Up Needed.
- Row 10 in all three tabs: Leads Replied; Bookings and Follow Up Status Follow Up Needed.
- Row 11 in all three tabs: Leads Replied; Bookings and Follow Up Status Follow Up Needed.
- Row 12 in all three tabs: Leads Replied; Bookings and Follow Up Status Follow Up Needed.

Missing required booking companions: **0**. Orphan booking/follow-up ID groups:
**0**. Populated audited rows with blank ID: **0**. Newsletter-only Leads are
excluded from required booking companions. Rows containing only an uninspected
contact field cannot be identified by this deliberately minimized read.

## Cutover Consequences

The guarded legacy candidate intentionally fails closed when ANY status-tab ID
is duplicated. Installing it against the currently observed live data would
therefore block unrelated saves/tracking; clean synthetic acceptance alone cannot
make that cutover safe.

The four Replied/status conflicts also need staff review; the current unsafe
reminder reads Follow Up Status without the new cross-tab protections. The active
trigger was NOT changed or invoked under this read-only authorization.

Any repair needs separate authorization, fresh backups, record-level staff
reconciliation and an approved quiescent window. Determine whether the repeated
ID represents accidental retries or different real requests. Preserve every
record/Note/status and its provenance; never automatically delete rows, pick a
first match, manufacture new IDs, or downgrade Replied/Confirmed/Paid. An approved
mapping/archive approach may be needed, but this audit does not choose or execute
one. Rerun integrity checks after any approved repair before legacy installation.
