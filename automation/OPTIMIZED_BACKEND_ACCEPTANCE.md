# Isolated optimized backend acceptance - 16 October 2026

The user explicitly authorized a new deployment only in the existing isolated Apps Script project, preserving version 1, plus one unchanged existing retry and one clearly labelled fresh blank-email/consent-off booking. These checks use native Chromium/Google responses, not mocked delivery. No fresh booking with an email was tested. No email was requested or observed.

## Backup and deployment

- Test project: `1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9`.
- Copied test Sheet: `1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM`.
- Timestamped pre-optimized backup Sheet: https://docs.google.com/spreadsheets/d/1g9KH1RLxBhdD7BSHeyeir0K0x7DvhVy4P_oXmNIIHUA/edit . Bounded four-tab cell data matched the copied test Sheet before any source replacement or test submission.
- Its copied bound script project `1xy8di1PjiF4xoenpNHywhWuNF8om3N1V3bGITuzau-zWRkD4O_ExnUKn` contains the exact normalized original editor source, including the previous embedded logo and one-off helpers. SHA-256: `1c2a42013977dff8fa710f1f431d3182ee8b334050e79a9eccb932f850b0b7df`. This backup is archival only: do not execute copied code or assume copied script properties safely retarget it. The current settings/properties/trigger/deployment snapshot is in ignored local `output/acceptance/isolated-pre-optimized-settings.json`. The full Sheet copy also retains its bound source/manifest.
- Installed only reviewed `Code.gs` and `EmailLogo.gs` from `8ce511d62ba31d2b5eba09d8db722c8527d5229a`, read back both files and compared with the reviewed local source. Removed the prior appended profiling/one-off mail helpers from the candidate source; no helper was run. No setup/migration function was needed or run because version 1 already has the same schema. Runtime/manifest/properties were not changed.
- NEW separate deployment: **Version 2**, ID `AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g`.
- Candidate URL: https://script.google.com/macros/s/AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g/exec . Execute as the existing TSG account, access Anyone, matching the authorized baseline submission setup.
- Manage deployments readback confirmed the old deployment still points to **Version 1** and retains its original `AKfycbw755w_...` URL. Both deployments coexist in the isolated project.
- Reminders remained explicitly `false`; zero reminder triggers and the unrelated onOpen trigger were preserved. No script property was changed.

## Real browser and Sheet results

The local test helper was explicitly configured with the candidate URL through two matching allowlist environment variables and a private approved fixture. It serves the actual review 25000ms config with only its endpoint replaced at runtime. Production `assets/lead-config.js` was not edited. The browser refuses alternate/extra POSTs, changed payloads, ID/timestamp mismatches, WhatsApp navigation/tracking, XHR and beacons. The result observer returns Google's native JSON unchanged. Receipt ID/timestamp/digest seeding is test-only and uses the exact approved request.

The initial local harness attempt failed before any POST: crypto.subtle was unavailable on its new about:blank tab. The helper also initially returned 403 for the existing root logo.png. These test-only issues were corrected (initialize the secure loopback page before hashing; allow the known root logo) before the successful tests. The two actual Google POSTs below are separately recorded as Version 2 doPost executions.

| Check | Existing unchanged duplicate | Fresh blank-email request |
| --- | --- | --- |
| Lead ID | TSG-966d41c4-e666-4f17-838b-f4d25dfa8481 | TSG-OPTIMIZED-NOEMAIL-1792187088270 |
| Response | HTTP 200, readable CORS, ok=true, matching ID, duplicate_ignored | HTTP 200, readable CORS, ok=true, matching ID, New Lead |
| Browser request to JSON read | 6824.7ms | 6460.3ms |
| Headroom before 25000ms | 18175.3ms | 18539.7ms |
| WhatsApp visible after POST dispatch | 20.6ms, before acknowledgement | 8.0ms, before acknowledgement |
| Saved ordering | JSON read first; saved absent when read | JSON read first; saved absent when read |
| Apps Script execution UI | 17:46:23 T&T local time, 4.324s, Completed | 17:46:57 T&T local time, 5.861s, Completed |
| Mailbox observation | Same original exact-ID message only | No message matching fresh ID |

After the duplicate, bounded four-tab cell data matched the pre-test snapshot exactly and the exact-ID mailbox message set remained unchanged. Only then was the private fixture unlocked for the single fresh submission. The fresh name was `TEST ONLY - Dylon optimized blank-email acceptance`; email was blank and marketing consent No. Other contact/scheduling/participant details reused the tester's previously authorized own record. This is a test, not a class reservation. No WhatsApp link was clicked or message sent.

| Tab | Before | After duplicate | After fresh | Fresh row |
| --- | ---: | ---: | ---: | ---: |
| Leads | 19 | 19 | 20 | 21 |
| Bookings | 16 | 16 | 17 | 18 |
| Follow Up Status | 16 | 16 | 17 | 18 |
| Email Subscribers | 7 | 7 | 7 | None |

Counts exclude headers. Each booking tab contains exactly one fresh matching ID. Every previously populated bounded row is unchanged. Verified fields include contact name/WhatsApp, blank email, island, preferred area/date/time, participant count and complete JSON/participant text (age, experience, rental need, size/system and guardian values), offer, source/UTM/referrer, consent No, timestamp, tags, New Lead status and WhatsApp Opened No where present. All stored field checks passed; Sheet date/time serials were normalized for America/Port_of_Spain and timestamps compared within 2ms. Follow Up Status has blank email/Last Contacted, correct due dates and Weekly Update Eligible No. The existing subscriber data is untouched.

Read-only Gmail exact-ID searches before, after duplicate and after fresh returned the same one original message ID; the fresh ID matched none. The deployed duplicate path skips sendLeadConfirmation_, and the deployed fresh path returns from it before MailApp for blank email. Phase-level Cloud logs were not exposed in the execution table, so no emailMs/sheetMs breakdown is claimed. Mailbox observation is bounded, not a claim about unrelated future mail.

Non-PII machine evidence: `OPTIMIZED_BACKEND_ACCEPTANCE.json`. Local ignored proof images: `output/acceptance/isolated-version2-deployed.png`, `output/playwright/optimized-duplicate-status.png`, `output/playwright/optimized-fresh-status.png`. The private contact fixture was deleted after testing and the temporary browser/servers closed. No private contacts are included in this evidence.

## Scope and remaining decisions

- Passed real optimized deployment acceptance for complete existing duplicate suppression and one new blank-email/consent-No save, matching browser acknowledgements, immediate WhatsApp, all three rows and subscriber exclusion. These are isolated Google results, not production verification.
- No fresh email-bearing booking, deployed HTML-email rendering or live consented subscriber batching was exercised. The earlier user-approved one-off HTML email acceptance and local mocks are distinct evidence. Stop here; any email-bearing submission needs explicit approval.
- The blank-email sample and old email-bearing profile are not like-for-like. Their latency difference is not a reliable optimization benchmark or SLA; retain the 25-second recovery budget and truthful uncertain-delivery behavior.
- Production release still requires explicit approval, current-main review, live code/Sheet backup and preservation-checked migration, side-by-side production endpoint selection, staged website/rollback checks and approved production acceptance. No live Sheet access/write, production endpoint/website change, push or merge occurred.
- Source HEAD remains `8ce511d`. Test tooling and this evidence are uncommitted pending review; no commit was requested for this acceptance run. Sol is appropriate for further scoped testing; Astra should review any release decision.
