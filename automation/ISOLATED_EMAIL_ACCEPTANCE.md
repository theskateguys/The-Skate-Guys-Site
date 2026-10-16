# Isolated Version-2 Email Acceptance

Tested 16 October 2026 on `codex/single-session-booking-review`, based on `bf952606e02aafa35c4e9b7f90d88f2dda4297b9`. This is real isolated acceptance evidence, not production verification. Machine-readable observations are in `ISOLATED_EMAIL_ACCEPTANCE.json`.

## Destination and Controls

- Existing isolated Apps Script project: `1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9`.
- Existing version-2 deployment: `AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g`.
- Copied test Sheet: `1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM`.
- Read-only project inspection confirmed the copied Sheet target, `TSG_AUTOMATIC_REMINDERS_ENABLED=false`, version 2, preserved version-1 listing and only the unrelated `onOpen` trigger.
- One fresh booking explicitly authorized to the user's specified inbox. Marketing consent remained No. Existing own-contact participant and scheduling information was reused. No WhatsApp message was sent.
- Only the temporary localhost preview used the isolated endpoint. No checked-in endpoint or backend code changed.

## Real Browser Results

Reference: `TSG-OPTIMIZED-EMAIL-ACCEPTANCE-20261016`.

| Attempt | Google response | Response time | WhatsApp availability | 25s timeout headroom |
| --- | --- | --- | --- | --- |
| Fresh | HTTP 200, readable CORS, `New Lead`, matching ID | 8,389.5 ms | 5.6 ms | 16,610.5 ms |
| Unchanged retry | HTTP 200, readable CORS, `duplicate_ignored`, same ID | 5,459.5 ms | 3.9 ms | 19,540.5 ms |

The browser's native fetch and native `Response.json()` were observed without replacing the response. On both attempts, the prepared WhatsApp link was visible before response parsing; the saved message appeared only after the actual Google acknowledgement with the matching ID. Request ID, timestamp and all payload fields remained identical for the retry. Exactly one permitted POST occurred per attempt. There were no console errors, failed requests, page errors or network guard violations during either submission.

These are two timing samples, not a guarantee for cold starts or all network conditions. Keep the approved 25-second timeout and uncertain-delivery wording.

## Sheet Readback

Counts exclude headers.

| Tab | Before | After fresh | After retry | Matching row |
| --- | --- | --- | --- | --- |
| Leads | 20 | 21 | 21 | 22 |
| Bookings | 17 | 18 | 18 | 19 |
| Follow Up Status | 17 | 18 | 18 | 19 |
| Email Subscribers | 7 | 7 | 7 | None |

Checked every column of the three matching rows against submitted/derived values: reference, timestamp, contact details, island, offer, requested area/date/time, count, participant JSON and readable details, rental size/system, consent, attribution, tags and initial status. Phone cells were numerically coerced by Sheets; exact string-normalized values matched. Date/time comparisons accounted for Sheet serial values and the T&T timezone. Follow-up eligibility was No, Last Contacted blank and booking status New Lead.

All existing populated rows were unchanged after the fresh append. All read cells, including all subscriber cells, were unchanged after retry. This verifies no duplicate row was created and no protected status was altered in this test. Confirmed/Paid transitions are additionally covered by mocked local regression tests; no extra real status edits were performed.

## Email Evidence

- Before fresh submission: no sent message for this reference.
- After fresh and after retry: exactly the same single sender message, ID `1a146dd05d214194`.
- Sender MIME readback confirmed HTML and plain-text alternatives, inline PNG logo with `Content-ID: <tsgLogo>`, personalised reference, Booking Request Received heading, Awaiting availability confirmation status, not-a-confirmed-class and no-payment wording, direct TSG WhatsApp link, brand accents and revised credit-expiry wording.
- The recipient confirmed exactly one branded acknowledgement arrived. After refreshing following the retry, the recipient again confirmed still exactly one. This is user-confirmed recipient delivery, not independent connector access to that inbox.
- Automatic reminders remained disabled. No marketing subscription was created.

## WhatsApp Page Cleanup and Local Checks

- Direct contact links across `index.html`, `book.html`, `merch.html` and `elite.html` target `https://wa.me/18682766878`, optionally with encoded enquiry text.
- Class request actions still enter `book.html` and preserve the lead form. Booking help is labelled separately.
- Exactly two group links remain: one homepage invitation and one on `elite.html`, both labelled View Group Invite.
- Both use `https://chat.whatsapp.com/KO19GyeuQfi3K1FEJ5GKLi`. A read-only visit showed The Skate Guys / Group chat invite. No joining or admin-setting change occurred. Admin approval remains for the user to enable and confirm before changing that label.
- Real Chromium local preview checks passed at 390, 768 and 1440px for all four pages: no horizontal overflow, broken eager images or page errors; mobile menus opened correctly. All 22 local targets loaded, 14 booking actions point to the form, no stale anchors/Tally/retired offers were found, and lead-script order was intact. Preview writes were blocked and endpoints disabled.
- `node automation/check-whatsapp-links.mjs`, `node automation/check-lead-flow.mjs`, `node automation/check-booking-system.mjs` and `git diff --check` passed. Booking-system regression tests use mocks and are not additional Google saves.

## Scope and Cleanup

The first local observer attempt failed before submission; readback confirmed unchanged cells and zero matching emails before running the repaired observer. A separate responsive checker false positive was corrected to inspect a card's actual CTA, not wording in its description. Neither issue required a website/backend fix.

Private fixture removed. Email-capable preview server and acceptance browsers stopped. Result-only and responsive screenshots remain in ignored `output/acceptance` and `output/playwright` for review. No production Sheet access, production endpoint change, deployment, push, merge or additional email occurred.

Release remains a separate decision. This run does not authorize an endpoint switch, production Apps Script update or website deployment. Recommend Sol for any requested commit and Astra for the final release review.
