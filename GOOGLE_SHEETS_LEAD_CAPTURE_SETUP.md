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
3. The browser uses `no-cors`. Its opaque response **cannot verify successful storage**. The page says delivery was attempted but storage is unverified; it never calls this a saved/received booking. An Apps Script email, unlike the browser's opaque response, is sent after server-side storage.
4. A thank-you panel provides an explicit WhatsApp button. The visitor must open WhatsApp and press **Send** on the prepared message. Opening WhatsApp alone does not send a message or confirm a class. Explicit opening avoids delayed popup blocking.
5. If the network request fails or times out, storage might still have succeeded. The page says delivery **could not be verified**, rather than claiming storage failed. If the endpoint is missing it reports delivery unavailable. WhatsApp remains available, inputs remain populated and editable, and retry is enabled. No background personal-data queue or automatic resubmission on reconnect is used.
6. An unchanged retry uses the same Lead ID and timestamp. A SHA-256 digest plus ID/timestamp (no contact or participant data) in sessionStorage supports retries after refresh in the same tab. Changed details create a new request ID because duplicate submissions never overwrite existing records. If storage is blocked, unchanged retries in the current page still reuse the ID. A new tab or cleared session can create a new request; staff can reconcile it by contact details.

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

## Separate Apps Script deployment (not performed by this code change)

1. Back up the existing Google Sheet and current Apps Script version. Inspect existing headers for duplicates/renamed columns before migration.
2. Open the existing Sheet, then Extensions > Apps Script. Update the code from `automation/google-apps-script/Code.gs`.
3. Retain the `TSG_LEADS_SPREADSHEET_ID` script property pointing to the existing Sheet. Do not create a replacement live database.
4. Before running setup, set script property `TSG_AUTOMATIC_REMINDERS_ENABLED` to `false`. Run `setupTSGLeadSystem` and authorize it. Verify old rows/columns remain intact and the new columns appear on the right. Setup removes existing follow-up triggers and creates none while this property is false or absent; the reminder runner itself also exits without sending emails. Review the project timezone (America/Port_of_Spain). This applies to the isolated test project only; do not modify live triggers as part of this test.
5. For isolated acceptance tests, first deploy a separate test script against a copied/test Sheet. Point only a local/preview configuration at that test `/exec` URL. Keep production credentials and endpoint unchanged in this branch.
6. When the website and script changes are approved together, use Deploy > Manage deployments > Edit on the existing Web App, select a **new version**, execute as the owner, access Anyone, and deploy. Updating that deployment preserves its `/exec` URL. The existing `assets/lead-config.js` endpoint is intentionally unchanged.
7. Coordinate the script and website release: the new server requires participant details and does not accept legacy package-only booking payloads. Do not deploy it independently while the old booking form is still in use. Old open tabs can still use WhatsApp fallback; ask visitors to reload for the new form.

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
- Confirm actual storage by inspecting the test Sheet, never by the browser's opaque response. Confirmation emails do not mean the class is confirmed. No live save has been verified as part of preparing this branch.
