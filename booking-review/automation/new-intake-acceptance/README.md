# Clean Intake Acceptance: Completed, Do Not Resubmit

The one-email approval was consumed on 16 October 2026. Fresh booking and one unchanged
retry are complete. Do not rerun `browser-real.js`, restart an email-bearing session or
submit the hosted previews without new explicit permission. A new browser session can
generate a new Lead ID and another email; per-session guards are not permanent authority.

Destination: new synthetic Sheet `1mRV2mJuv5hU57j6uFMJWPm5IdihzjLdpkbltqbXlxV0`,
new project `15mf3aFuF6ZWDkP5qkk220XNGU4X1G0yYuQqI6gGXPc7E5olcdYuD7g-2`, version 1,
reminders=false and zero installable triggers. No live/old Sheet or endpoint is used.
The email recipient was explicitly approved. All other identity/participant data is fabricated.

`server.mjs` serves only the verified generated public artifact plus a loopback-only
fixture. It is the separately approved native-Google acceptance server, not the offline
packaging server. `browser-real.js` observes the original Google fetch/Response.json
without substituting a response; it guards destination and allows one fresh submission.
`browser-retry.js` requires the same page/payload/Lead ID and permits one unchanged retry.
Neither clicks WhatsApp. These runners perform external writes and are NOT routine tests.

Committed evidence: [structured results](../NEW_INTAKE_ACCEPTANCE.json).
Raw local logs and screenshots: `output/new-intake-acceptance/`; actual saved editor source
backups: `output/new-intake-backup/`. No private Gmail MIME/attachment/authentication metadata
is committed. Readbacks redact only the approved recipient address; synthetic values remain.

Native Google results: fresh 5122.2ms, retry 5217.7ms, matching ID before saved.
WhatsApp ready 2.4ms. Leads/Bookings/Follow Up Status each row 2; subscribers zero.
All readback cells unchanged on retry. Sender search and recipient each confirm one branded
email. Successful replies under 25000ms do not prove an actual delayed Google timeout;
the abort/uncertainty path was checked separately with browser mocks.

Safe, offline verification (no network, rows or email):

```powershell
node automation/new-intake-acceptance/check-evidence.mjs
```

This compares the 84 native Vercel preview file hashes with the Google-tested local
artifact and checks consistency of recorded evidence. It does not re-read Google or
prove production acceptance. Both previews are protected, synthetic-bound and unaliased.
