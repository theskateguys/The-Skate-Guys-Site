# TSG Booking and Google Sheets Setup

## Offer and booking process

- Single session: TT$80 per person, 75 minutes, skate rental included.
- One person can book. Classes are by appointment.
- Trinidad location is agreed during booking. For Tobago, TSG confirms Rec TT Black Rock or another suitable agreed location. Availability is not promised everywhere.
- A request is not a confirmed class. TSG checks coach, location and skate availability before payment.
- Deposit preferred; payment on arrival available by arrangement. No deposit amount has been approved in this implementation. No online payment is added.
- Give at least 24 hours' notice to reschedule. Credit rather than refunds; credit is valid for one calendar month from the original scheduled session date.

**Business review needed:** late cancellations (less than 24 hours), no-shows, TSG/coach cancellations, weather or unsafe locations, credit transferability, and how to handle month-end dates when calculating a calendar month. Do not invent fees, refund exceptions, deposit amounts or forfeiture rules. TSG should clarify these with customers before confirmation. The under-18 guardian fields are a coordination rule, not a legal consent waiver. The 20-person form limit is a coordination safeguard, not a promise of group capacity; larger groups should contact TSG.

## Website delivery and WhatsApp

1. Visitor completes contact name, WhatsApp, island, area, preferred date/time and participant details. Email is optional unless opting into marketing. The optional checkbox is separate from booking.
2. Only on submission does the website send personal details to the configured Apps Script endpoint, with Lead ID, timestamp, source page, UTM source/campaign/medium and referrer.
3. The browser uses `no-cors`. Its opaque response **cannot verify successful storage**. The page says delivery was attempted but storage is unverified; it never calls this a saved/received booking. An Apps Script email, unlike the browser's opaque response, is sent after server-side storage.
4. A thank-you panel provides an explicit WhatsApp button. The visitor must open WhatsApp and press **Send** on the prepared message. Opening WhatsApp alone does not send a message or confirm a class. Explicit opening avoids delayed popup blocking.
5. If delivery fails, times out, or the endpoint is missing, WhatsApp remains available. Inputs remain populated and editable; the retry button is enabled. No background personal-data queue or automatic resubmission on reconnect is used.
6. An unchanged retry uses the same Lead ID and timestamp. A SHA-256 digest plus ID/timestamp (no contact or participant data) in sessionStorage supports retries after refresh in the same tab. Changed details create a new request ID because duplicate submissions never overwrite existing records. If storage is blocked, unchanged retries in the current page still reuse the ID. A new tab or cleared session can create a new request; staff can reconcile it by contact details.

The WhatsApp message includes participant ages, experience, rental needs, sizes with sizing systems, guardian contacts for under-18s, preferences, contact details, offer, source/UTMs, consent and policy wording. Rental sizes are requests for an availability/fit check, not guaranteed inventory.

## Sheet schema and preserving records

Use the existing **TSG Website Leads** spreadsheet and tabs: `Leads`, `Bookings`, `Email Subscribers`, `Follow Up Status`.

Existing columns and rows are retained. `ensureSheet_` adds missing headers on the right, never renames, reorders or deletes old columns. Reads and writes use header names, including status validation. Preserve unique, exact header names. Existing filters may need their range extended manually to include the new columns.

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
4. Run `setupTSGLeadSystem` and authorize it. Verify old rows/columns remain intact and the new columns appear on the right. Setup installs/replaces the daily follow-up trigger; review the project timezone (America/Port_of_Spain) and permissions.
5. For isolated acceptance tests, first deploy a separate test script against a copied/test Sheet. Point only a local/preview configuration at that test `/exec` URL. Keep production credentials and endpoint unchanged in this branch.
6. When the website and script changes are approved together, use Deploy > Manage deployments > Edit on the existing Web App, select a **new version**, execute as the owner, access Anyone, and deploy. Updating that deployment preserves its `/exec` URL. The existing `assets/lead-config.js` endpoint is intentionally unchanged.
7. Coordinate the script and website release: the new server requires participant details and does not accept legacy package-only booking payloads. Do not deploy it independently while the old booking form is still in use. Old open tabs can still use WhatsApp fallback; ask visitors to reload for the new form.

## Verification and acceptance

Local automated checks use synthetic data, intercepted browser delivery and in-memory Apps Script services. They are **mocked tests, not verified Google Sheets saves**. See `automation/check-booking-system.mjs` for server behavior and `automation/BOOKING_FLOW_VERIFICATION.md` for the performed checks.

Before a later production release, use a test deployment and consenting test details to verify:

- One row each in Leads, Bookings and Follow Up Status, all sharing the Lead ID and correct participant JSON/summary.
- Consent No does not add a subscriber; Yes with email does. Booking works without email when consent is No.
- Repeating the exact same payload creates no additional rows. Remove a test child row and retry to check repair. Test existing rows with legacy columns and extra/reordered headers.
- Set Confirmed then Paid in each tab in turn. A WhatsApp-open action must leave status intact; due reminders must neither send mail nor downgrade a booking. Replied should not receive unanswered-request reminders.
- Browser failure/timeout and opaque success both keep an accurate, unverified state, populated inputs, retry and a usable WhatsApp message. Check adult/child, rental Yes/No and all sizing systems at 390px, 768px and desktop widths.
- Confirm actual storage by inspecting the test Sheet, never by the browser's opaque response. Confirmation emails do not mean the class is confirmed. No live save has been verified as part of preparing this branch.
