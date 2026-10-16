# Pinned Fallback: Isolated Browser Acceptance

Completed 16 October 2026. This is isolated Google acceptance, NOT production
verification or acceptance of the new legacy-compatible replacement.

## Artifact And Destination

- Source: `02639f8c7e0361b72d1a19d03bf5fc6579ca2839`.
- Immutable template: `output/rollback/02639f8c7e0361b72d1a19d03bf5fc6579ca2839/`.
- Tested derivative: `output/rollback/isolated-02639f8-v2-parent-retry/`.
- Template manifest SHA-256: `95f5880b2f9a7a882c73cdf92a2a646135da0471969449f77f411643727bb0e2`.
- Bound manifest SHA-256: `81d34c1ac8def15bdaa696153527860634a0ceec5dabd40bc599a346ca4ffb22`.
- Only the generated config endpoint is rebound; 43 source/bound files are
  reconstructed and checked. The original template and tracked config are untouched.
- Test project: `1qXXCOqzdedWiuwjdR1bcJHp7T517fbXUlFl_s9NVfNKlytGmNpWrVKU9`.
- Copied Sheet: `1CuA0uWDnUu-EK0XseYxNNpEK4lX5SZ7S5UuTdy-HCyM`.
- Existing strict version-2 deployment: `AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g`.

Before submission, read-only inspection verified the actual deployed version/URL,
copied-Sheet property, `TSG_AUTOMATIC_REMINDERS_ENABLED=false`, and zero reminder
triggers (the unrelated `onOpen` trigger remains). No deployment/editor/settings
change was made. A local manifest alone would not prove those remote settings.

## One Authorized Unchanged Retry

Used the existing complete blank-email, marketing-consent-No record:
`TSG-OPTIMIZED-NOEMAIL-1792187088270`, original timestamp
`2026-10-16T21:44:48.270Z`. No fresh booking was submitted. The runner used the
original payload, receipt and timestamp; a fail-closed network guard allowed one
exact POST to the isolated URL and its Google response redirects only.

Actual Chromium/native fetch result:
- WhatsApp was available after **2.1ms**, before Google responded; no WhatsApp
  message was opened/sent on the user's behalf.
- Readable Google CORS HTTP 200 JSON returned the matching Lead ID and
  `duplicate_ignored` after **7088.3ms**.
- Saved was absent when JSON was read and appeared only afterward.
- **17911.7ms** remained before the configured **25000ms** timeout.
- One POST; no mocked response, console/page errors or network-guard violations.

| Tab | Before | After | Matching reference rows before/after |
| --- | ---: | ---: | --- |
| Leads | 21 | 21 | Row 21, once |
| Bookings | 18 | 18 | Row 18, once |
| Follow Up Status | 18 | 18 | Row 18, once |
| Email Subscribers | 7 | 7 | None |

Sender-account reference search returned zero messages before and after. Email
was blank, so no acknowledgement or marketing email was expected. This is not a
global mailbox audit. Counts and reference row positions/multiplicity were read
back; a full retained before/after cell snapshot comparison is not claimed.
The private contact fixture was deleted and the test browser/server stopped.

Machine evidence: [FALLBACK_ISOLATED_VERIFICATION.json](FALLBACK_ISOLATED_VERIFICATION.json).
The local screenshot is `output/acceptance/rollback-isolated-blank-retry-status.png`.

## Remaining Gates

The artifact is `ISOLATED_ONLY`, `productionReady: false`, never publishable as
production. Production binding/staging needs separate approval, a verified NEW
strict production URL and recorded hashes for BOTH release and fallback. Never
promote `d8a6a5a`, the unbound template, or this test-bound derivative.

This retry exercises unchanged strict booking behavior, not the later newsletter
wording patch or fresh-email delivery (already separate completed acceptance).
The newly prepared legacy replacement has offline evidence only; its own isolated
deployment/status-protection acceptance remains an authorization gate. Production
legacy writers and the active production reminder trigger are unchanged.
