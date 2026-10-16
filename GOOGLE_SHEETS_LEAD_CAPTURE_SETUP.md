# TSG Booking and Google Sheets Setup

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

## Separate Apps Script deployment (not performed by this code change)

1. Back up the existing Google Sheet and current Apps Script version. Inspect existing headers for duplicates/renamed columns before migration.
2. Open the existing Sheet, then Extensions > Apps Script. Update the code from `automation/google-apps-script/Code.gs` and add/update `EmailLogo.gs` from the same folder for the reviewed HTML acknowledgement. Do not copy preview/test helpers into production. This is a future approved deployment step, not permission to send or deploy now.
3. Retain the `TSG_LEADS_SPREADSHEET_ID` script property pointing to the existing Sheet. Do not create a replacement live database.
4. Before running setup, set script property `TSG_AUTOMATIC_REMINDERS_ENABLED` to `false`. Run `setupTSGLeadSystem` and authorize it. Verify old rows/columns remain intact and the new columns appear on the right. Setup removes existing follow-up triggers and creates none while this property is false or absent; the reminder runner itself also exits without sending emails. Review the project timezone (America/Port_of_Spain). This applies to the isolated test project only; do not modify live triggers as part of this test.
5. For isolated acceptance tests, first deploy a separate test script against a copied/test Sheet. Point only a local/preview configuration at that test `/exec` URL. Keep production credentials and endpoint unchanged in this branch.
6. For future compatible updates, use Deploy > Manage deployments > Edit on the relevant booking Web App, select a **new version**, retain the approved owner/access settings, and deploy. Updating that deployment preserves its `/exec` URL. For this incompatible legacy-to-participant migration, follow the side-by-side rollout below instead. The existing `assets/lead-config.js` endpoint is intentionally unchanged in this review.
7. Coordinate the script and website release: the new server requires participant details and does not accept legacy package-only booking payloads. Do not point the existing public deployment at incompatible code while old forms use it. The recommended side-by-side deployment and safe rollback procedure is in `BOOKING_FLOW_ROLLOUT.md`. It requires an explicitly approved endpoint switch in a later release commit; this review leaves `assets/lead-config.js` unchanged.

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

## Reusable HTML email letterhead (local review only)

The existing booking acknowledgement now has an HTML version and a complete plain-text alternative. Newsletter and reminder implementations are unchanged; no confirmation, payment-request, receipt, credit or other new flow is activated. The booking acknowledgement is not an invoice/receipt, does not confirm availability and does not imply payment. Its subject, approved offer and seven policy rules are retained.

`renderTSGEmailLayout_` owns only the table-based, inline-styled letterhead/footer and accepts a heading, preheader and trusted generated content HTML. Future email types can reuse it, but must have their own approved wording/status rules and plain text. Never pass raw customer HTML to it. `buildBookingAcknowledgement_` escapes every customer-supplied HTML value; the prepared WhatsApp message is URL-encoded, then attribute-escaped. Links use verified business number `18682766878` and the actual Lead ID. Dates, times, island and area are labelled requested, not confirmed. Participant/guardian and rental-size details remain selectable text.

The original company logo `assets/theskateguys-1.png` (without COMMUNITY) is unmodified. `EmailLogo.gs` mechanically bundles its exact 120,615 PNG bytes, decoded into a MailApp inline image blob referenced by `cid:tsgLogo`. The encoded string is in the Apps Script source, not a data URI in the delivered HTML. This uses MailApp's existing inlineImages support, needs no new Drive/URL-fetch scope, remote image download, public file sharing or runtime image fetch. The logo has explicit dimensions and alt text; the company name, details, CTA and policy remain readable when images are blocked. The HTML wrapper is about 600px maximum width with a fixed-width Outlook conditional fallback. Future Outlook/Gmail dark-mode, image-proxy and CID rendering still require real email-client testing.

Regenerate the mechanical logo bundle and HTML/plain-text samples with:

```text
node automation/preview-booking-email.mjs
node automation/check-booking-system.mjs
node automation/check-lead-flow.mjs
```

The generator and tests run locally with mocked MailApp only: **no actual email is sent**. It checks original logo byte identity, escaping, all approved policy lines, correct reference/number, plain text, missing email and unchanged newsletter flow. Do not edit generated EmailLogo.gs or generated sample HTML/text manually; edit Code.gs or the labelled synthetic fixture, then regenerate. The review index is hand-authored and is not overwritten.

Open `automation/email-previews/index.html` for desktop/mobile review, or the individual `booking-request.html`, `stress-test.html`, `blocked-images.html` and corresponding `.txt` files. Every generated sample is labelled SAMPLE DATA / NO EMAIL SENT. They reference the original local PNG instead of CID solely so browsers can display it; the production HTML retains CID. The blocked-image file intentionally references a missing local image, so its expected missing-image network error is not a booking or script failure.

`automation/check-email-browser.js` is a Playwright CLI fixture: open the standard preview through a localhost static server, then run it with `run-code --filename automation/check-email-browser.js`. Automated checks passed at 1440px, 390px and 320px: no horizontal overflow, long names/unbroken references, three participants including a guardian/rentals, blocked images, layout-table semantics, readable text and correct WhatsApp destination/reference. Normal-text colour pairs have at least 6.51:1 contrast. Screenshots under `output/playwright/email-*.png` were visually reviewed; they are local artifacts, not email-client evidence.

The initial local-only letterhead task sent no email and changed no Apps Script editor/project/deployment. The separately approved follow-up test is recorded below. Actual Gmail, Outlook and mobile-client review must verify MIME plain text + HTML + CID attachment, blocked-image behavior, dark mode, long content/clipping and WhatsApp opening. A separately approved isolated booking/retry is still needed to verify the formatted acknowledgement through the complete submission path. Keep automatic reminders disabled throughout. A browser screenshot or mocked MailApp count must never be described as a delivered email test.

Reference: [Apps Script MailApp inlineImages and plain-text body](https://developers.google.com/apps-script/reference/mail/mail-app).

### Customer-copy refinement and approved inbox test

The email now uses the existing company mark rather than the Community mark. Its customer-facing credit text says "We'll confirm your revised credit expiry with you." Internal staff instructions to record that agreement remain in setup guidance/booking Notes procedures. The time label is "Requested time (T&T local time)" and a date-only value such as `2027-01-05` displays as `5 January 2027`, without a timezone shift or any storage/schema change. Invalid dates are not silently coerced. Both HTML and plain text use the readable date; the prepared email WhatsApp message carries the same reference/details.

On October 16, 2026, the user separately authorized one labelled design email to their specified inbox. The temporary isolated-editor sender uses synthetic participant data, a TEST ONLY subject/banner and a send-once script-property guard. It calls the reviewed HTML/plain-text builder and original company-logo CID blob directly; it never calls the booking save path, creates Sheet rows, deploys a Web App or enables reminders. The recipient-specific sender stays outside the repository's deployment sources. MailApp completion establishes a send attempt accepted by that service, not inbox delivery or successful phone rendering. Actual receipt, embedded logo/button rendering and phone approval must be confirmed by the recipient before release.

The isolated editor source was read back and matched the reviewed code, company-logo bundle and guarded test helper before execution. `sendOneTSGDesignTest` completed successfully around 4:34 PM America/Port_of_Spain on October 16, 2026, logging one labelled design test accepted by MailApp. Its subject was `[TEST ONLY] TSG booking acknowledgement - 16 October 2026`. No automatic retry was made. The recipient has been asked to review the actual email on their phone; receipt/rendering/approval are pending. The public test Web App and production site remain undeployed/unchanged.

Subsequent user response confirmed that the actual email was perfect on their phone and that no screenshot was needed. Gmail/phone acceptance of that one design email is therefore user-confirmed. No additional email was sent for the browser acknowledgement task. The browser-readable matching-ID check also passed against the existing isolated Web App, with unchanged Sheet data; see `automation/REAL_BROWSER_ACK_VERIFICATION.json` for evidence and timeout/deployment limitations. These results do not claim independent Outlook testing or deployment of the final optimized backend.
