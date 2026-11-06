# The Skate Guys website

Static HTML, CSS and JavaScript for the WhatsApp-only website at https://the-skate-guys-site.vercel.app.

The source was synchronized from the verified website handoff snapshot at `5592c39bfd6a0f8db850b048e83b770bdd64e402`. Class requests are prepared locally and opened in WhatsApp for the visitor to send. This source does not save booking data or activate Google intake. The separate booking-review snapshot remains preparation only.

Run `node automation/build-whatsapp-release.mjs` to validate links, booking boundaries and the 42-file public package. It writes generated files under `output/`, which is ignored by Git. Only a reviewed generated public directory should be considered for a later, separately authorized deployment. Git-triggered deployments are disabled in `vercel.json`.

Current offer: TT$80 per person for 75 minutes, skate rental included. One person can request a session by appointment; TSG confirms coach, location and skate availability before payment.
