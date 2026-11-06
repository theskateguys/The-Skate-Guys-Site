# Website-Only WhatsApp Release

Status: staged for owner review, NOT approved for publication.

## Destination And Source

- Branch: `codex/website-whatsapp-release`, based on actual live/main commit `51ddd8f4f17318c3537544a1ab58ae51ede090dd`.
- Protected staged URL: https://the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app
- Booking preview: https://the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app/book.html
- Deployment: `dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n`, READY, existing project `prj_PAAufMtMAtdyKsfjznoZxeUlV4xI`, team `team_dEDeP8feNT9wIaT7VOiOo4uT`.
- Normal Vercel authentication is required. No protection setting was disabled and no share/bypass link was created.
- Full booking/Google/email implementation remains on clean review branch `codex/single-session-booking-review` at `e27ea9b5fa2a7c282c7151c75c1b3d84c6ad082f`.

## Customer Changes

- TT$80 per person, 75 minutes, skate rental included; one person may request a session by appointment.
- Accurate Trinidad/Tobago availability and payment wording, plus all seven approved credit-policy rules. No new deposit amount or membership offer.
- Booking form prepares a message locally, displays it for review, then exposes an explicit WhatsApp link to `18682766878`. The visitor must press Send in WhatsApp. Nothing is submitted to Google or labelled saved/received.
- Participant ages, experience, rentals, skate sizing and guardian contact are included. Editing invalidates stale links without clearing other details. No personal-data persistence, email field, marketing signup or online payment.
- Former email-capture bands now offer direct WhatsApp contact. No newsletter subscription is promised in this release.
- Elite memberships/benefits/paid Tally links retired. The legacy `elite.html` address explains the change and points to the current class request. Group links remain separate, labelled View Group Invite.
- Hero images, intro design, coaches and testimonials preserved. Existing merch product prices/Shopify ordering are not changed by this class-offer release.
- Lead config/capture source files and all Apps Script files remain unchanged and are excluded from the deployed public package. CSP disallows form navigation and Google fetch connections.

## Exact Diff And Artifact

Run from this release worktree:

```powershell
node automation/build-whatsapp-release.mjs
git diff origin/main HEAD -- index.html book.html merch.html elite.html assets/updates-data.js assets/whatsapp-booking.js assets/whatsapp-booking.css assets/whatsapp-contact.css vercel.json .vercelignore
```

Generated review artifacts (ignored, not deployed):

- `output/website-whatsapp-production.patch`: exact public website/control-file diff against verified live/main baseline.
- `output/website-whatsapp-manifest.json`: 42-file public package with byte sizes and SHA-256 hashes.
- `output/website-whatsapp-browser.json`: 73 real local Chromium assertions.
- `output/website-whatsapp-fallback-browser.json`: script-free fallback and large-group checks.
- `output/playwright/`: desktop/tablet/mobile screenshots with fabricated sample data only.

All 42 deployed source file hashes were read through the authenticated Vercel connector and matched the tested local package (SHA-1 comparison, zero extras/mismatches). No automation, setup docs, test evidence, lead config/capture, environment files or credentials are present in that package. `.vercelignore` is an additional source-directory guard; always stage the generated public directory, not the source root.

## Verification

Local real browser, not mocked backend responses:

- 73 assertions passed on all four pages at 390, 768 and 1440 pixels: navigation, no horizontal overflow, all lazy-loaded images, required fields, rental sizes, child guardians, prepared message contents, edit/re-prepare and participant-count recovery.
- Message preparation measured 29 ms (includes browser click automation overhead). Zero Google Apps Script requests, zero booking/signup network submissions and zero page JavaScript errors were observed.
- JavaScript-disabled booking presents a direct prepared WhatsApp fallback and cannot submit a form.
- 20-participant fabricated request preserves all participants and TT$1,600 total; encoded URL length 3,371. This is link-construction verification, NOT a WhatsApp-device delivery claim.
- Independent Astra spot checks: invalid phone recovery, past-date rejection and participant limit rejection passed.

Authenticated staged browser:

- Homepage entry cleared; hero, coaches, testimonials and approved offer present.
- Booking prepared the fabricated Sample Skater request, exposed the matching WhatsApp destination and displayed Nothing has been sent. No WhatsApp button was followed and no message/email was sent.
- Merch and retired-Elite/community paths loaded with current class wording and direct contact.
- Staged `assets/lead-config.js` returned 404. Deployment tree independently confirms backend/config/capture files excluded.

Physical phone/WhatsApp app handoff has not been verified. Owner acceptance should review the staged booking on a phone and inspect the prepared message without sending a fabricated request. No claim of live Google save or production booking verification is made.

## Staging Incidents And Cleanup

An initial CLI call ran from the source root rather than the generated public directory. It created an unintended `website-whatsapp` project and began uploading files. The process was stopped at 15.2 MB of 60.9 MB. Zero deployments were listed for that project; the empty project and repository connection were then deleted, and a follow-up project search returned zero matches. Some source bytes did reach Vercel during upload; deletion does not establish an independent blob-retention guarantee. Its stale local project binding was removed.

The subsequent correct 42-file staging deployment used an explicit public-directory cwd, correct project ID, `--prod --skip-domain`. CLI 64.5.0 nevertheless assigned the secondary generated alias `the-skate-guys-site-dylons-projects-1d199d9f.vercel.app`. It was restored immediately to prior deployment `dpl_Chmy2UEaizXf5R8QQXLHbZgbC5GX`, with readback verification. The primary live domain `the-skate-guys-site.vercel.app` never changed; it still points to that same prior deployment. Do not rely on this CLI flag or generic promotion to select the intended domain.

## Publication: Explicit Approval Required

1. Owner approves this exact staged build and the primary domain `the-skate-guys-site.vercel.app`. Before any release, recheck its current deployment and all artifact hashes; stop if either differs from the recorded baseline/candidate. No Git push or merge is implied.
2. Assign only the approved primary domain to the immutable tested candidate. Do not rebuild, use generic promotion, change project settings, switch endpoints or touch Google systems:

```powershell
vercel alias set the-skate-guys-site-akpbzp3x4-dylons-projects-1d199d9f.vercel.app the-skate-guys-site.vercel.app --scope team_dEDeP8feNT9wIaT7VOiOo4uT
```

3. Read back the primary alias; verify homepage, book, merch, community, mobile navigation and prepared WhatsApp behavior on the actual primary domain. Keep Google/Sheet/reminders/endpoints unchanged. Report the released deployment and source commit. GitHub synchronization is a separate explicit decision; never merge the full booking-review branch as part of this website-only release.

## Safe Recovery

The local `output/website-whatsapp-fallback` artifact contains the same approved pages/assets, with only `book.html` replaced by `release/whatsapp-fallback-book.html`: a script-free prepared WhatsApp link, complete offer/policy, no form or backend. Both 390/1440 checks passed. It is not yet hosted; deploying and assigning it requires explicit approval. The normal booking page also has a tested no-JavaScript fallback already inside the staged candidate.

If a release fault requires recovery, do not restore old packages/Elite/Google submission. Obtain approval to stage the fallback public directory on the verified existing project as a protected preview (not generic production deployment); verify hashes and customer paths, then assign only the primary domain to the verified fallback URL. No Google migration/rollback is involved. Never promote `d8a6a5a`, the old `51ddd8f` site, or a full backend-review artifact as this release's fallback.

## Remaining Boundaries

- Owner acceptance/publication approval remains outstanding; the staged link requires Vercel sign-in.
- Fallback is locally tested, not an already-hosted recovery target.
- Visitors with an old cached page may still use the old lead flow; this website-only release does not retire existing backend deployments, cached tabs or active reminder triggers.
- Shopify stock/checkout and external WhatsApp/group administration were not changed or re-certified. Existing merch mockups remain mockups.
- There is intentionally no website lead database or automatic acknowledgement for new requests in this release. TSG receives requests only after the visitor sends the WhatsApp message.

Final Astra review: no concrete website-code blocker found; ready for owner acceptance. No authority to publish, push, merge, change Google systems or send messages was granted by that review.
