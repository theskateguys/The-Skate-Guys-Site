# TSG Booking and Google Sheets Setup

## Current New-Intake Route

Follow [New Intake Cutover Runbook](automation/NEW_INTAKE_CUTOVER_RUNBOOK.md), not the
historical old-Sheet migration route below. The current website is WhatsApp-only commit
`5592c39`; Google automation is staged but NOT active. Reserve new Sheet
`1oOvHxL2P4rM3-a5rxd4zTvmLE4iIM4RBEj5uWJ1NslI` for future requests only. Its four tabs
are header-only, with no production project/endpoint yet. Never import legacy or test rows.

Completed isolated acceptance uses DIFFERENT Sheet `1mRV2mJuv5hU57j6uFMJWPm5IdihzjLdpkbltqbXlxV0`
and project `15mf3aFuF6ZWDkP5qkk220XNGU4X1G0yYuQqI6gGXPc7E5olcdYuD7g-2`, version 1,
reminders=false/zero triggers. One approved branded email and three booking rows, matching
native browser acknowledgement and unchanged retry passed; [evidence](automation/NEW_INTAKE_ACCEPTANCE.json).
The TEST endpoint must never become production. Keep 25000ms and immediate WhatsApp;
only a readable matching response permits saved wording. Production creation/binding,
verification effects and activation need separate approval. Do not change the tracked
endpoint or live Sheet under preparation authority. Newsletter subscription/delivery is a
separate acceptance path, not established by the consent-No booking test.

## Latest Legacy Acceptance Gate

Current local revision isolates ambiguous target IDs rather than globally
rejecting unrelated submissions. All ambiguous rows stay unchanged; protected
statuses across companions remain protected, and schema/header failures remain
global. The 62-group offline suite is separate from revised isolated Google
acceptance. Historical global-guard evidence below remains valid for its version.
The strict participant backend is NOT changed: duplicate-ID first-match tracking
must be resolved by approved reconciliation or separately tested strict guarding
before strict endpoint/website cutover, even if revised legacy acceptance passes.

The clean synthetic version-1 baseline is COMPLETE: immutable source/binding,
reminders=false and zero triggers verified, backups made, and 39 real browser
POSTs plus nine deliberate companion removals/restorations passed. See
[actual version-1 evidence](automation/CLEAN_LEGACY_VERSION1_ACCEPTANCE.md).
The revised source has a separate synthetic-only version-2 deployment; use its
[native response/row evidence](automation/LEGACY_DUPLICATE_ISOLATION_ACCEPTANCE.md)
and [Astra review](automation/LEGACY_DUPLICATE_ISOLATION_REVIEW.md), not deployment
success or mocks, for the acceptance scope. All real booking emails are blank,
consent No; two subscriber rows are deliberate ambiguity fixtures, not sign-ups.
Initial timed-out/health-payload attempts remain recorded as failures, not saved
acknowledgements. The 90-second diagnostic harness is NOT the website timeout:
keep 25000ms and accurate uncertain-delivery/unchanged-ID recovery wording.
The separately authorized [read-only live audit](automation/LIVE_SHEET_INTEGRITY_AUDIT.md)
is complete: duplicate IDs and five conflicting-status groups need an approved
handling plan. Native legacy latency above 25 seconds, unchanged strict ambiguity
handling, and unsafe production writers/trigger currently block release.
The consented cross-ID subscriber collision remains a manual-recovery limit;
full-flow offline coverage does not authorize or verify an email-bearing Google test.
No live repair, trigger change, endpoint switch or website release occurred.
The version-3 attempt described below is historical, not the new clean deployment.

The earlier guarded legacy candidate attempt (including approved optional
blank booking email) passed 42 offline groups and deployed isolated
version 3 in the historical shared test project. Its first real Google request was rejected by the global duplicate-ID
guard; the copied Sheet already contained duplicate historical IDs. The test
stopped without writes, status changes, subscriber additions or email. The
save/tracking/retry/repair/protection success matrix is NOT complete. See
[actual evidence](automation/LEGACY_ISOLATED_ACCEPTANCE.md).

Do not clean up copied historical records, weaken the guard or retarget shared
script properties automatically. The dedicated synthetic Sheet and separate
project have since been approved and created; resume only under their exact
binding after independently verifying source/settings. Production must pass
an ambiguous-ID inventory and fresh header integrity audit before a legacy-only
decision; strict migration still needs reconciliation or accepted strict quarantine before
installation; no live Sheet write is authorized here. Strict production
endpoint, website and active live reminder scheduling remain unchanged.

## Offer and booking process

- Single session: TT$80 per person, 75 minutes, skate rental included.
- One person can book. Classes are by appointment.
- Trinidad location is agreed during booking. For Tobago, TSG confirms Rec TT Black Rock or another suitable agreed location. Availability is not promised everywhere.
- A request is not a confirmed class. TSG checks coach, location and skate availability before payment.
- Deposit preferred; payment on arrival available by arrangement. No deposit amount has been approved in this implementation. No online payment is added.
- At least 24 hours' notice: the amount paid carries forward as credit.
- Less than 24 hours' notice or no-show: no automatic credit; genuine emergencies reviewed individually.
- TSG/coach cancellation or unsafe weather/venue: full amount paid carries forward as credit, without penalty.
- Credit expires one calendar month from the original scheduled session date. If the matching date does not exist, use the last day of that month.
- If TSG cannot offer a replacement before expiry, extend the credit to give the client a reasonable opportunity to attend. Record the agreed new expiry.
- Transfers require TSG approval, subject to participant suitability and skate availability.
- Credit rather than refunds.

These cancellation/credit rules are approved. No fixed emergency criteria, extension duration, cancellation fee or deposit amount has been invented. Emergency decisions and extensions are agreed individually. For each credit, staff must record the amount paid, original scheduled session date and calculated expiry in the booking row's existing `Notes` field. For an extension, also record the reason TSG could not offer a replacement, the agreed new expiry, agreement date and staff member. Preserve previous notes rather than replacing them. For a transfer, record TSG approval and the suitability/skate-availability check. This release does not automate credit balances or expiry calculations. Example: January 31, 2027 expires February 28, 2027, unless an extension is agreed under the approved rule.

The under-18 guardian fields are a coordination rule, not a legal consent waiver. The 20-person form limit is a coordination safeguard, not a promise of group capacity; larger groups should contact TSG.

## Website delivery and WhatsApp

1. Visitor completes contact name, WhatsApp, island, area, preferred date/time and participant details. Email is optional unless opting into marketing. The optional checkbox is separate from booking.
2. Only on submission does the website send personal details to the configured Apps Script endpoint, with Lead ID, timestamp, source page, UTM source/campaign/medium and referrer.
3. Immediately after validation and request-ID preparation, a thank-you panel exposes the prepared WhatsApp link, before waiting for any network response. Website delivery runs independently. The visitor must open WhatsApp and press **Send**; opening alone neither sends a message nor confirms a class. Keep the tab open for a delivery result; navigating away/closing it can interrupt delivery.
4. Delivery uses a simple CORS POST (`text/plain`, no custom headers) so a readable acknowledgement can be checked. Only HTTP success plus JSON `ok: true`, the exact Lead ID and status `New Lead` or `duplicate_ignored` produces "saved". An opaque response, CORS/redirect failure, invalid/mismatched response, backend rejection or timeout is **not proof of storage**. No automatic second POST is made. Direct Apps Script CORS readability must be checked during isolated browser acceptance; a successful editor run does not verify it. Acknowledgement emails are sent after server-side storage, independently of browser readability.
5. If the network request fails or times out, storage might still have succeeded. The page says delivery **could not be verified**, rather than claiming storage failed. If the endpoint is missing it reports delivery unavailable. WhatsApp remains available, inputs remain populated and editable, and retry is enabled. No background personal-data queue or automatic resubmission on reconnect is used.
6. An unchanged retry uses the same Lead ID and timestamp. A SHA-256 digest plus ID/timestamp (no contact or participant data) in sessionStorage supports retries after refresh in the same tab. Changed details create a new request ID because duplicate submissions never overwrite existing records. If storage is blocked, unchanged retries in the current page still reuse the ID. A new tab or cleared session can create a new request; staff can reconcile it by contact details.

The review's final delivery timeout is **25000ms**, both in assets/lead-config.js and the client fallback. The live endpoint string is unchanged. This covers the measured 9.2445-second real browser response, the 12.117-second Sheets phase and the earlier 17.983-second full execution with additional headroom; it is not a guaranteed storage SLA. WhatsApp remains available immediately, independent of the deadline. At timeout the browser says storage may still complete, retains details and supports a same-ID retry. See `automation/check-booking-timeout.js` for real wall-clock browser tests with mocked delivery and `BOOKING_FLOW_ROLLOUT.md` for release/rollback steps. No runtime production change occurs until a separately approved release.

The WhatsApp message includes participant ages, experience, rental needs, sizes with sizing systems, guardian contacts for under-18s, preferences, contact details, offer, source/UTMs, consent and policy wording. Rental sizes are requests for an availability/fit check, not guaranteed inventory.

## Sheet schema and preserving records

Use the existing **TSG Website Leads** spreadsheet and tabs: `Leads`, `Bookings`, `Email Subscribers`, `Follow Up Status`.

Existing columns and rows are retained. `ensureSheet_` adds missing headers on the right, never renames, reorders or deletes old columns. Reads and writes use header names, including status validation. Preserve unique, exact header names. Existing filters may need their range extended manually to include the new columns.

After migration, keep the existing layout and size only the five new columns for readability: Preferred Area about 180px, Preferred Date 140px, Participant Count 140px, Participants JSON 400px, Participant Details 360px. Wrap those new headers and the human-readable Participant Details column; avoid sheet-wide autofit or restyling existing columns. These scoped formatting changes were applied to the isolated test copy, not the live Sheet.

`Leads` and `Bookings` gain:

| Column | Contents |
| --- | --- |
| Preferred Area | Requested area; final venue is agreed with TSG |
| Preferred Date | Requested YYYY-MM-DD, interpreted in Trinidad & Tobago time |
| Participant Count | Number of participants |
| Participants JSON | Structured age, experience, rentals, skateSize, sizeSystem, guardianName, guardianPhone for each participant |
| Participant Details | Readable participant summary |

Original `Name`/`WhatsApp` hold the booking contact; `Location` holds island; `Preferred Time` holds requested time; `Adult/Child` and `Rentals Needed` are derived summaries; `Package` holds the single-session offer. Existing timestamp, source, UTM and marketing columns remain. Old rows retain their original offers and have blank new fields; historical records are not rewritten. The offline workbook generator is a legacy template; use Apps Script setup as the current schema authority, not a newly generated workbook to replace live data.

Only opt-in submissions with email enter `Email Subscribers`. Consent No still permits booking coordination emails where provided. Weekly Update Eligible is Yes only with marketing opt-in. Weekly email campaigns/export remain a separate operational task; this change does not install an email marketing provider or automate WhatsApp messages.

Duplicate prevention uses a script lock and checks Lead ID separately in Leads, Bookings and Follow Up Status. Repeating an unchanged request returns `duplicate_ignored`; missing booking/follow-up rows from an interrupted write are repaired without appending duplicate rows or resetting existing statuses. Confirmed/Paid in **any** of those three tabs blocks reminder emails and automated status downgrades. WhatsApp-open tracking sets its own flag and advances only a New Lead, never Replied/Confirmed/Paid. It records opening the handoff, not proof the customer sent a message. Staff should maintain booking statuses consistently across tabs.

While delivery is pending, the submit button/fields are temporarily disabled but the WhatsApp link is usable. After delivery settles, fields and manual retry are restored without clearing details. Opening tracking is deferred until the attempt settles, and repeated after an unchanged retry if needed; it remains best-effort, particularly after a timeout or closed tab. Never use that flag as confirmation of a sent message or booking.

Request handlers no longer reformat unchanged sheets. Explicit setup still applies header styling/validation; missing headers remain additive. One protected-status snapshot is reused inside the submission lock, and subscriber updates batch adjacent owned columns without touching custom columns/formulas. Durations (`lockWaitMs`, `sheetMs`, `emailMs`, `totalMs`) are logged without contact/participant details. These are code-phase wall times, not a browser/network/cold-start measurement. See `automation/BOOKING_FLOW_VERIFICATION.md` for actual measurements.

## Production Apps Script deployment gates (not authorized or performed here)

Read-only production inspection on 16 October 2026 confirmed that the legacy endpoint serves version 2 in project `1wCcJh9WBnfpOqtun6gzhR5v-81pOLHJsxtXvwCnDRSTrR1w1kJEAy5YU`. It has no script properties and an existing daily Head `runTSGFollowUpReminders` trigger (10am-11am GMT-04). Production reminders are **not disabled**; they were not altered under the read-only scope. That old code does not read a reminder-disable property. See `automation/LEGACY_ENDPOINT_INSPECTION.json` and `automation/LEGACY_ENDPOINT_COMPATIBILITY.md` for the actual deployed status-write inventory and the separately authorized legacy safety/trigger-disable gates. Do not confuse the disabled isolated configuration below with live settings.

The canonical production sequence and rollback gates are in [BOOKING_FLOW_ROLLOUT.md](BOOKING_FLOW_ROLLOUT.md#release-order-approval-required). The following is a production-only gate summary, not a standalone execution checklist. Each runtime action and destination requires separate explicit approval; this documentation correction authorizes no editor change, setup, trigger change, deployment, endpoint switch, live Sheet write, submission or email.

1. Revalidate production identities, owners, versions, properties and triggers, then obtain approval for a fresh backup of the live Sheet and production sources/settings. Inspect headers for duplicates/renamed columns. The inspected live `TSG_LEADS_SPREADSHEET_ID` property is **ABSENT**; legacy code uses the bound-Sheet fallback. There is no existing property to retain. Do not set an explicit verified live Sheet ID until after the approved backup and the approved legacy-compatibility decision; do not substitute a copied test Sheet or replacement database.
2. Before **any production editor replacement or setup**, separately authorize disabling the actual active legacy `runTSGFollowUpReminders` trigger. Audit other owners' triggers and verify in-flight reminder executions have finished/stopped under the approved quiescence procedure; deleting a trigger does not cancel an execution. Preserve unrelated triggers and the recorded reminder schedule. Setting `TSG_AUTOMATIC_REMINDERS_ENABLED=false` alone cannot disable the old code. Do not invoke old setup/install/reminder functions that could recreate the trigger.
3. The revised [legacy replacement](automation/legacy-compatibility/README.md) passes 62 offline groups with target-ID quarantine. Read the latest exact-version Google evidence separately; complete source/settings verification, backups, clean cases and ambiguity-isolation acceptance before production decisions. For a compatibility-only update, separately authorize reminder pause/writer quiescence and fresh header/ambiguous-ID inventory checks. Staff may leave historical ambiguous rows quarantined and handled manually only under the accepted sole-writer contract; do not infer permission to reconcile conflicting statuses. Any repair requires separately approved backups and a record-level mapping preserving every record/Note/status/provenance. Updating the legacy deployment remains a separately approved action, preserving its URL, payload contract and optional blank booking email. Verify source/version/status safety and drain old executions. Before strict migration, require approved reconciliation plus a fresh integrity audit OR separately implemented/accepted strict ambiguity guarding; current strict first-match tracking is not covered. Do not replace the legacy handler with the strict participant-only server. Additive schema includes one `Legacy Review Required` column in each status tab, preserving data. Follow [pause, verify and restore](automation/PRODUCTION_REMINDER_CUTOVER.md); restoration needs separate approval.
4. Only after legacy writers are verified safe and reminders are disabled/quiescent, authorize installing final strict `automation/google-apps-script/Code.gs` plus `EmailLogo.gs` in the **same verified production script project**, preserving the compatibility-safe legacy deployment/version. Exclude preview/profiling/test helpers and audit Head/manual functions. At this approved stage, explicitly set the verified live `TSG_LEADS_SPREADSHEET_ID` and `TSG_AUTOMATIC_REMINDERS_ENABLED=false` for code that honors it. Separately approved additive setup must preserve existing rows, statuses, Notes and custom columns/formulas, append missing headers on the right, and compare against the fresh backup. Verify the America/Port_of_Spain timezone.
5. Only then authorize a **new versioned strict booking Web App deployment in that same project**, with approved owner/access settings, retaining the compatibility-safe legacy URL. Follow the canonical runbook for separately approved release/fallback binding, staging, endpoint switch and production acceptance. The strict server requires participant details and cannot replace the legacy package-only contract while old forms/open tabs use it. The production endpoint string in `assets/lead-config.js` remains unchanged in this review; its review timeout is 25000ms, so the file itself is not unchanged. Reminder activation remains a separate decision.

## Isolated test setup and email behavior

Keep the pre-migration backup untouched. Create a separate test Sheet copy and a separate Apps Script project. Explicitly set `TSG_LEADS_SPREADSHEET_ID` to the **test Sheet ID**, even if a copied bound script already contains a value. Never run test setup with the live Sheet ID. Set `TSG_AUTOMATIC_REMINDERS_ENABLED=false` before setup or deployment. Inspect Triggers to confirm there is no `runTSGFollowUpReminders` trigger. Neither manual execution nor an old trigger can send reminder mail while that property remains false. Production reminders are unaffected because this is a separate project. Enabling reminders later requires an explicit decision: set the property to `true` and run `installTSGAutomationTriggers`.

Immediate acknowledgement emails are separate from automatic reminders. A new booking with an email address still receives one acknowledgement after server-side storage, whether or not marketing consent is checked. An unchanged duplicate retry does not send another acknowledgement. Inform the tester before submitting. Marketing consent is optional; leave it unchecked for the first labelled test so no subscriber is added. No weekly marketing campaign is scheduled by this script.

Use the contact name `TEST ONLY - <tester name>` with the tester's own WhatsApp/email. The test is not a class reservation and no payment is taken. Record its Lead ID, then inspect exactly one matching row in each of Leads, Bookings and Follow Up Status. Compare every submitted contact, island, area, date/time, participant age/experience/rental/size/system/guardian, offer, consent, timestamp and attribution field to the payload. A duplicate retry must use the unchanged original payload and Lead ID: row counts and acknowledgement count must remain unchanged. Do not create an artificial row directly in Sheets and call that a successful website save. Verify the actual Apps Script POST. No real save is verified until those rows have been read back.

## Verification and acceptance

Local automated checks use synthetic data, intercepted browser delivery and in-memory Apps Script services. They are **mocked tests, not verified Google Sheets saves**. See `automation/check-booking-system.mjs` for server behavior and `automation/BOOKING_FLOW_VERIFICATION.md` for the performed checks.

Before a later production release, use a test deployment and consenting test details to verify:

- One row each in Leads, Bookings and Follow Up Status, all sharing the Lead ID and correct participant JSON/summary.
- Consent No does not add a subscriber; Yes with email does. Booking works without email when consent is No.
- Repeating the exact same payload creates no additional rows. Remove a test child row and retry to check repair. Test existing rows with legacy columns and extra/reordered headers.
- Set Confirmed then Paid in each tab in turn. A WhatsApp-open action must leave status intact; due reminders must neither send mail nor downgrade a booking. Replied should not receive unanswered-request reminders.
- Browser failure/timeout and opaque success both keep an accurate, unverified state, populated inputs, retry and a usable WhatsApp message. Check adult/child, rental Yes/No and all sizing systems at 390px, 768px and desktop widths.
- Confirm actual storage by inspecting the test Sheet, never by an opaque response. Confirmation emails do not mean the class is confirmed. Isolated real saves and mocked checks are distinguished in `automation/BOOKING_FLOW_VERIFICATION.md`; no production save is claimed.

`IsolatedProfile.gs` is a guarded editor-only test helper. Do not copy it into production or include it in a public deployment. It only accepts the named isolated Sheet and explicitly disabled reminders, reuses one stored profiling ID, and can send one acknowledgement on its first successful run. It reads the tester-approved source booking within the test project; it never logs its contact details. Do not clear its profiling ID to create additional email tests without approval.

## Reusable HTML email letterhead (isolated acceptance, not production)

The existing booking acknowledgement now has an HTML version and a complete plain-text alternative. The newsletter welcome now promises useful class, event and merch updates, with no Elite updates; only its plain-text copy changed. Newsletter delivery behavior and reminder logic are unchanged; no confirmation, payment-request, receipt, credit or other new flow is activated. The booking acknowledgement is not an invoice/receipt, does not confirm availability and does not imply payment. Its subject, approved offer and seven policy rules are retained.

`renderTSGEmailLayout_` owns only the table-based, inline-styled letterhead/footer and accepts a heading, preheader and trusted generated content HTML. Future email types can reuse it, but must have their own approved wording/status rules and plain text. Never pass raw customer HTML to it. `buildBookingAcknowledgement_` escapes every customer-supplied HTML value; the prepared WhatsApp message is URL-encoded, then attribute-escaped. Links use verified business number `18682766878` and the actual Lead ID. Dates, times, island and area are labelled requested, not confirmed. Participant/guardian and rental-size details remain selectable text.

The original company logo `assets/theskateguys-1.png` (without COMMUNITY) is unmodified. `EmailLogo.gs` mechanically bundles its exact 120,615 PNG bytes, decoded into a MailApp inline image blob referenced by `cid:tsgLogo`. The encoded string is in the Apps Script source, not a data URI in the delivered HTML. This uses MailApp's existing inlineImages support, needs no new Drive/URL-fetch scope, remote image download, public file sharing or runtime image fetch. The logo has explicit dimensions and alt text; the company name, details, CTA and policy remain readable when images are blocked. The HTML wrapper is about 600px maximum width with a fixed-width Outlook conditional fallback. Future Outlook/Gmail dark-mode, image-proxy and CID rendering still require real email-client testing.

Regenerate the mechanical logo bundle and HTML/plain-text samples with:

```text
node automation/preview-booking-email.mjs
node automation/check-booking-system.mjs
node automation/check-lead-flow.mjs
```

The generator and tests run locally with mocked MailApp only: **no actual email is sent**. They check original logo byte identity, escaping, all approved policy lines, correct reference/number, plain text, missing email and newsletter flow. `check-booking-system.mjs` also asserts the exact class/event/merch welcome copy, no Elite promise and unchanged booking acknowledgement assembly. Do not edit generated EmailLogo.gs or generated sample HTML/text manually; edit Code.gs or the labelled synthetic fixture, then regenerate when booking previews or the logo change. The newsletter-only copy correction needs no preview regeneration. The review index is hand-authored and is not overwritten.

Open `automation/email-previews/index.html` for desktop/mobile review, or the individual `booking-request.html`, `stress-test.html`, `blocked-images.html` and corresponding `.txt` files. Every generated sample is labelled SAMPLE DATA / NO EMAIL SENT. They reference the original local PNG instead of CID solely so browsers can display it; the production HTML retains CID. The blocked-image file intentionally references a missing local image, so its expected missing-image network error is not a booking or script failure.

`automation/check-email-browser.js` is a Playwright CLI fixture: open the standard preview through a localhost static server, then run it with `run-code --filename automation/check-email-browser.js`. Automated checks passed at 1440px, 390px and 320px: no horizontal overflow, long names/unbroken references, three participants including a guardian/rentals, blocked images, layout-table semantics, readable text and correct WhatsApp destination/reference. Normal-text colour pairs have at least 6.51:1 contrast. Screenshots under `output/playwright/email-*.png` were visually reviewed; they are local artifacts, not email-client evidence.

The initial local-only letterhead task sent no email and changed no Apps Script editor/project/deployment. Separately approved design-email and full isolated version-2 booking/retry acceptance are recorded below. Sender MIME readback and user-confirmed recipient delivery are distinct from local browser/mock evidence. Independent Outlook, dark-mode, blocked-image and long-content/clipping checks remain unverified in real email clients. Keep automatic reminders disabled; no further submission or email test is authorized by these notes. A browser screenshot or mocked MailApp count must never be described as a delivered email test.

Reference: [Apps Script MailApp inlineImages and plain-text body](https://developers.google.com/apps-script/reference/mail/mail-app).

### Customer-copy refinement and approved inbox test

The email now uses the existing company mark rather than the Community mark. Its customer-facing credit text says "We'll confirm your revised credit expiry with you." Internal staff instructions to record that agreement remain in setup guidance/booking Notes procedures. The time label is "Requested time (T&T local time)" and a date-only value such as `2027-01-05` displays as `5 January 2027`, without a timezone shift or any storage/schema change. Invalid dates are not silently coerced. Both HTML and plain text use the readable date; the prepared email WhatsApp message carries the same reference/details.

On October 16, 2026, the user separately authorized one labelled design email to their specified inbox. The temporary isolated-editor sender uses synthetic participant data, a TEST ONLY subject/banner and a send-once script-property guard. It calls the reviewed HTML/plain-text builder and original company-logo CID blob directly; it never calls the booking save path, creates Sheet rows, deploys a Web App or enables reminders. The recipient-specific sender stays outside the repository's deployment sources. MailApp completion establishes a send attempt accepted by that service, not inbox delivery or successful phone rendering. Actual receipt, embedded logo/button rendering and phone approval must be confirmed by the recipient before release.

The isolated editor source was read back and matched the reviewed code, company-logo bundle and guarded test helper before execution. `sendOneTSGDesignTest` completed successfully around 4:34 PM America/Port_of_Spain on October 16, 2026, logging one labelled design test accepted by MailApp. Its subject was `[TEST ONLY] TSG booking acknowledgement - 16 October 2026`. No automatic retry was made. The recipient subsequently confirmed the actual design email was perfect on their phone and no screenshot was needed. This is user-confirmed phone acceptance, not independent Outlook verification.

### Completed isolated version-2 acceptance

`automation/OPTIMIZED_BACKEND_ACCEPTANCE.md` and `.json` record the separately authorized optimized backend deployment as **version 2** in the existing isolated project, preserving version 1 and its URL. The target was the copied test Sheet, not the live Sheet. Real Chromium acceptance passed for one fresh blank-email/consent-No booking and an unchanged existing retry: readable Google acknowledgements with matching IDs, immediate WhatsApp availability and exactly one matching row in each of Leads, Bookings and Follow Up Status. Submitted/derived fields were read back, existing populated rows were preserved, no subscriber was added and no new email was observed.

`automation/ISOLATED_EMAIL_ACCEPTANCE.md` and `.json` then record the separately authorized email-bearing booking through that same deployed isolated version 2. The fresh browser response was `New Lead` in 8,389.5ms; the identical same-ID/timestamp retry returned `duplicate_ignored` in 5,459.5ms. Both were readable native Google responses, and saved status appeared only after matching acknowledgement. All three booking rows were read back against submitted/derived fields. Existing rows were preserved after the fresh append; all read cells and row counts were unchanged after retry. Consent remained No and subscriber data was unchanged.

Sender MIME readback verified HTML/plain text, the inline company-logo CID attachment, reference, WhatsApp link and approved acknowledgement/policy wording. The same single sent message remained after retry. The recipient confirmed exactly one branded acknowledgement arrived and still exactly one after refreshing following the retry. This is user-confirmed recipient delivery, not independent connector access to that inbox. The earlier `automation/REAL_BROWSER_ACK_VERIFICATION.json` is historical browser acknowledgement evidence, not the final optimized email acceptance record.

Automatic reminders remained explicitly disabled with zero reminder triggers; the unrelated onOpen trigger was retained. These completed tests are **isolated Google acceptance, not production verification**, and timing samples are not an SLA. No production endpoint switch, live Sheet access or website deployment is established by them. The production endpoint string remains unchanged while the review config timeout is 25 seconds. The newsletter-only correction is local and has not been deployed or tested by sending mail. No further tests, emails or release actions are authorized now. Production release requires separate explicit approval and Astra review; Sol is recommended for any separately requested scoped packaging work.
