# Single-session booking verification

Branch prepared locally for review. No website or Apps Script production deployment was performed. `assets/lead-config.js` retains the existing endpoint unchanged.

## Checks performed

- `node automation/check-lead-flow.mjs`: HTML references, duplicate IDs, inline/shared JavaScript syntax and lead-script inclusion passed.
- `node automation/check-booking-system.mjs`: in-memory Apps Script service tests passed. Covers participant storage, solo bookings, optional email, opt-in subscribers, rejected incomplete rental/guardian details, invalid dates/times, duplicate retries, partial-write repair, existing/reordered/extra columns, and status transitions.
- Playwright CLI with `automation/check-booking-browser.js`: actual Chromium browser against a local static server. Submissions go to an intercepted `.invalid` endpoint; WhatsApp navigation is intercepted too. The production endpoint is never used by this test.
- Booking screenshots inspected at 390px, 768px and 1440px. No horizontal overflow at those widths. Branding and the existing responsive two-column/stacked layout remain.
- Browser checks cover required contact fields, phone validation and recovery, rental-size/system requirements, all seven sizing systems, under-18 guardian requirements, adult/own-skate hidden fields, optional consent/email interaction, one-person bookings, message contents and attribution, opaque delivery, simulated network failure and timeout, retained values, enabled retries, same-ID retries including refresh, and new IDs after changed details.
- Homepage dynamic update copy checked in the browser: TT$80 offer appears and the old Starter/Bootcamp/Academy offer text is absent. Homepage mobile overflow check passed. Booking-page newsletter remains usable and reports unverified delivery accurately.
- No uncaught JavaScript page errors occurred during the passing browser run. Deliberately aborted mock requests can produce expected browser network-error console entries; these are not successful submissions.
- Confirmed/Paid statuses tested in Leads, Bookings and Follow Up Status individually. WhatsApp-open tracking and due reminder runs preserved them and sent no reminder. Replied was also protected against unanswered-request reminders. New Lead can advance to WhatsApp Opened, then Follow Up Needed once.
- `git diff --check` passed for the booking changes.
- After policy approval, browser checks passed again at 390px, 768px and 1440px, including all seven approved rules on the page and in the prepared WhatsApp message. Mocked acknowledgement mail contains the approved rules. Reminder tests verify absent/false opt-in removes only reminder triggers, installs none, sends no reminder mail and leaves booking statuses unchanged. The existing enabled-reminder status-protection checks also still pass under an explicit mock opt-in.

## Reproduce

From the repository root, run the two Node commands above. For browser checks, start a static server on 127.0.0.1:4188 (for example, `python -m http.server 4188 --bind 127.0.0.1`), then:

```text
npx --package @playwright/cli playwright-cli -s=tsg-booking open http://127.0.0.1:4188/book.html
npx --package @playwright/cli playwright-cli -s=tsg-booking run-code --filename automation/check-booking-browser.js
npx --package @playwright/cli playwright-cli -s=tsg-booking close
```

Review screenshots are generated under `output/playwright/`; browser CLI artifacts under `.playwright-cli/`. These generated files are not part of the review commit. The browser fixture date is January 5, 2027; update it to a future date when reproducing later.

## Still requires separate operational acceptance

### Isolated setup verified on October 16, 2026

The pre-migration Sheet backup remains untouched. A separate test Sheet copy and a separate code backup were created. The test Apps Script container was checked against the test Sheet before editing. Its saved Code.gs matched the reviewed source (normalizing line endings/trailing whitespace). Script properties explicitly target the copied test Sheet and set `TSG_AUTOMATIC_REMINDERS_ENABLED=false`.

After user authorization, `setupTSGLeadSystem` completed successfully in the test project. Connector readback compared every existing populated cell in all four tabs before/after setup: zero existing values changed. Populated record counts stayed at Leads 17, Bookings 14, Email Subscribers 7 and Follow Up Status 14. The five new booking headers were appended on the right. The test project's Triggers page showed **0 triggers**. These migration checks are real Google Sheets readbacks, not mocked checks; they do not establish that a new website booking POST has been stored.

After explicit approval of anonymous test-form access, the isolated Web App was deployed as version 1. Its read-only GET returned `ok: true` and service `TSG Website Leads`. A separate localhost test preview serves this test endpoint at runtime; the repository's production `assets/lead-config.js` remains unchanged. Automatic reminders remain disabled; the tester was informed that an acknowledgement email is enabled before being asked to submit.

### Real booking save and retry verified on October 16, 2026

The tester submitted their own details through the local isolated form. Lead ID `TSG-966d41c4-e666-4f17-838b-f4d25dfa8481` appeared exactly once in Leads row 19, Bookings row 16 and Follow Up Status row 16. Contact name, phone/email (compared without copying them into this report), island, preferred area, date/time, participant count, age/experience, rental requirement, skate size/system, offer, consent, source and timestamp matched the prepared message/form. Sheets date/time serial values were normalized for comparison in America/Port_of_Spain; the submission timestamp matched to within one millisecond. This adult-only test correctly had blank guardian fields. UTM fields were blank because the tester opened the URL without campaign parameters; nonempty UTM and child/guardian paths remain covered by mocked browser/server checks, not this real booking.

The tester submitted contact name without a TEST prefix, so the matching three booking records were explicitly labelled `TEST ONLY - Dylon` in their existing Notes fields, retaining the original Lead ID. Marketing consent was checked, so Yes was correctly stored and the existing subscriber row (row 3) was updated; subscriber count stayed at 7. This is not a live consent-No subscriber exclusion test.

One unchanged website retry reused the original Lead ID. Connector readback after retry found one matching row per booking tab, preserved TEST notes, and unchanged populated counts: Leads 18, Bookings 15, Follow Up Status 15, Email Subscribers 7. No WhatsApp message was sent by the agent. The tester confirmed exactly one acknowledgement email for this Lead ID, including after the retry; inbox receipt/count is user-confirmed, not an independent mailbox read.

The browser timed out even though the save succeeded. The test project's Google execution list showed the initial doPost completed in 17.983 seconds (longer than the local test's 15-second timeout), and the retry doPost completed in 7.855 seconds. This establishes that the retry reached the server; the unchanged row counts are not merely an unsubmitted retry. The UI wording was corrected locally from delivery "failed" to delivery "could not be verified"; the browser still never claims an opaque response proves storage. Latency remains a release consideration: the production config currently specifies a 9-second timeout, and this test does not establish consistently fast backend response times. A separate incomplete POST health probe from the terminal also timed out; it was not a successful booking test and supplied no contact details. The actual save/retry conclusions above come from Google Sheets readback and execution history.

The automated browser/server suite remains mocked; the migration and labelled booking/retry checks documented separately above are real Google Sheets readbacks. Real mobile WhatsApp sending and additional child/guardian, nonempty UTM and consent-No live acceptance checks have not been performed in this isolated booking. Follow the coordinated deployment steps in `GOOGLE_SHEETS_LEAD_CAPTURE_SETUP.md` before any later production release.

The approved cancellation/credit policy now covers late cancellation/no-show emergency review, TSG/coach/weather/venue cancellations, approved transfers, month-end expiry and extensions when TSG cannot offer a replacement. Staff record credit and extension agreements in existing booking Notes, preserving history. No deposit amount, fixed extension duration or automatic payment behavior has been invented. Automatic reminder mail is disabled by default unless `TSG_AUTOMATIC_REMINDERS_ENABLED` is exactly `true`; acknowledgement emails remain separate.
