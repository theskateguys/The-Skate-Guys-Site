# New Clean Intake Website Packaging

## Current Completed Status

The later parent integration completed actual saved-source/settings readback, zero-trigger
verification, isolated binding, native browser Google acceptance and two protected Vercel
previews. See [current runbook](../NEW_INTAKE_CUTOVER_RUNBOOK.md) and
[structured evidence](../NEW_INTAKE_ACCEPTANCE.json). The pending flags in the template
and older scoped-session notes below describe the handoff baseline, not current acceptance.
They remain fail-closed defaults for a new operator attestation. The completed bound artifact
is `output/new-intake-web/isolated-stage-v1`; only its generated config targets the TEST URL.
Production project/endpoint has NOT been created. Do not promote these synthetic-bound
previews or rerun the consumed one-email test. The published WhatsApp-only site is unchanged.

Preparation only. Run from `C:\Users\infot\OneDrive\Documents\Dylon\.review\booking-flow`
on `codex/single-session-booking-review`. This directory owns packaging, checks and an offline
preview only. No backend, Google calls, emails, commits, pushes, merges or deploy operations.

## Sources and Publish Boundaries

- Automated intake uses the four approved review pages at full commit
  `e27ea9b5fa2a7c282c7151c75c1b3d84c6ad082f`, reviewed lead CSS/JS, and allowlisted public assets.
  Only `book.html`'s internal expiry-recording sentence becomes the customer-facing sentence
  already on the published website. Approved `Preferred date` / `Preferred time` labels stay unchanged.
- `release/` is the new automated website. Config is generated with a non-URL placeholder until
  explicit isolated binding. The tracked `assets/lead-config.js` and `assets/lead-capture.js`
  are never edited. There is no environment-variable endpoint fallback.
- `compliant-fallback/` is a byte-identical independent snapshot of `release/`, including its
  binding. It is not a fix for a shared integration defect. Use the WhatsApp-only fallback for that.
- `whatsapp-fallback/` is reconstructed byte-for-byte from published website commit
  `5592c39bfd6a0f8db850b048e83b770bdd64e402`. Its explicit production fallback identity is
  **`dpl_ChBmfxVVkecQ7XgSM7sQYssRbs8n`**, supplied by the parent/user, not remotely reverified here.
  It excludes lead CSS/JS/config and includes the published WhatsApp runtime. Never revert to `d8a6a5a`.
- Only one of those three site directories is a potential future publish root. None includes
  backend, documentation, manifests, fixtures or evidence. Never publish the artifact parent.
- `binding-manifest.json` and its checksum are outside the website roots. They record per-file
  source/output hashes, transformations, source commits, fallback deployment identity, binding,
  payload hash and (for a staged derivative) the immutable template-manifest hash.
  Hashes establish reproducibility/integrity, not signatures or remote acceptance.
- Every artifact is `productionReady: false`; no command grants activation or release approval.

The automated site's Vercel CSP preserves the existing fonts and Plausible policy. Its
`connect-src` permits only self, Plausible, `https://script.google.com` and
`https://script.googleusercontent.com`. No Google wildcards, `accounts.google.com`, or generic
HTTPS connect permission. The WhatsApp-only fallback retains its existing no-Google CSP.

## Build and Check

Outputs must use a fresh Git-ignored `output/new-intake-web/<name>` directory. Existing output,
symlinks, unexpected files/empty directories and source drift are rejected. Do not reuse the
earlier `preparation-e27ea9b` artifact: it predates the supplied isolated identity.

```powershell
node automation/new-intake-web/web.mjs build --out output/new-intake-web/preparation-final-e27ea9b
node automation/new-intake-web/web.mjs check --artifact output/new-intake-web/preparation-final-e27ea9b
node --test automation/new-intake-web/test.mjs
```

Checks reconstruct expected bytes from immutable Git blobs plus the one authorized HTML
sentence, rather than trusting only the manifest. Unit tests use synthetic binding URLs and
loopback HTTP only. They test inventories, determinism, CSP, strict isolated gates, only-config
binding changes, source equality, tamper detection, fresh-only outputs, private-path rejection,
method/Host/Origin rejection and post-start integrity changes. Test artifacts are labelled
`unit-*` and remain under ignored output. None proves an actual Google save or deployment.

## Isolated Staging After Endpoint Handoff

The parent has created the clean TEST Sheet and new isolated project. Binding remains pending:

- Test Sheet: `1mRV2mJuv5hU57j6uFMJWPm5IdihzjLdpkbltqbXlxV0`.
- Isolated project: `15mf3aFuF6ZWDkP5qkk220XNGU4X1G0yYuQqI6gGXPc7E5olcdYuD7g-2`.
- Reserved EMPTY future Sheet: `1oOvHxL2P4rM3-a5rxd4zTvmLE4iIM4RBEj5uWJ1NslI`.
  This Sheet is explicitly rejected for staging; activation requires separate approval.

The parent subsequently supplied deployment version 1, UI-confirmed at
`2026-10-16 23:39 AST`, deployment ID
`AKfycbwtS-JSw6zdr32pmqeuYIqTfX7umMo7PHeEb2vNeMsk0QYt-bMBXYqyCn7vUzOwdr1Eig`, URL
`https://script.google.com/macros/s/AKfycbwtS-JSw6zdr32pmqeuYIqTfX7umMo7PHeEb2vNeMsk0QYt-bMBXYqyCn7vUzOwdr1Eig/exec`.
Those supplied values are prefilled in the pending template only. The parent reports the
test Sheet binding and reminders=false property saved; zero-trigger verification remains
pending. Verification flags remain false. This packaging session has not contacted the URL.
The built website artifact remains UNBOUND_PLACEHOLDER. The parent owns subsequent binding
and its separately allowed real-browser acceptance server; do not use this offline server.

Use `binding.template.json` as the schema for a separate ignored operator JSON file.
Do not mark pending attestations true until the parent has verified the deployed project,
version, Sheet property, disabled automatic reminders and absence of reminder triggers.
Provide the exact new canonical `/exec` URL, matching deployment ID, positive integer version,
verification person/time (UTC ISO) and authorization reference. The binder accepts ONLY the
project and TEST Sheet above, rejects all previously recorded production/legacy/test endpoints
in the pinned review source, and rejects the reserved future Sheet. These attestations do not
prove remote settings; retain the parent's independent readback evidence separately.

```powershell
node automation/new-intake-web/web.mjs stage --artifact output/new-intake-web/preparation-final-e27ea9b --binding output/new-intake-web-isolated-binding.json --out output/new-intake-web/isolated-stage-v1
node automation/new-intake-web/web.mjs check --artifact output/new-intake-web/isolated-stage-v1
```

Staging makes a new derivative, changes only generated config in both automated trees, and
leaves the immutable template, tracked endpoint and published systems untouched. It does not
create a Sheet/project/deployment, contact the endpoint, submit a record, or send email.
The parent's one labelled email-test approval belongs to its separately controlled acceptance
runner; packaging never invokes it or expands that approval. Backend email settings are not
claimed to be disabled by this tool. Automatic reminders must remain disabled during isolation.

## Offline Browser Preview

```powershell
node automation/new-intake-web/web.mjs serve --artifact output/new-intake-web/preparation-final-e27ea9b --site release --port 4198
```

Open `http://127.0.0.1:4198/book.html`. This server exposes only the verified public tree and a
safe `/local-package-identity.json`; no backend, manifest, checkout, private fixture or config
host file is served. Its stricter local CSP blocks ALL external requests, including Google,
fonts and analytics. POST is rejected. Even staged artifacts are offline in this server.
Therefore it cannot be used as a real Google acceptance runner. Port collisions fail; do not
attach to an unknown server. Stop with Ctrl+C after preview. `--site compliant-fallback` or
`--site whatsapp-fallback` previews the respective snapshot on a separate free port.

Use a fresh cached Playwright CLI session for each fixture. `npx --offline --no-install`
must fail rather than install a missing package. The direct cached CLI executable is an
alternative when npm registry resolution is blocked.

```powershell
npx --offline --no-install --package @playwright/cli playwright-cli --session new-intake-check open about:blank
npx --offline --no-install --package @playwright/cli playwright-cli --session new-intake-check run-code --filename automation/new-intake-web/browser-check.js
npx --offline --no-install --package @playwright/cli playwright-cli --session new-intake-check close
```

`browser-check.js` uses the actual generated 25000ms timeout, overrides only its endpoint to
a synthetic `.invalid` URL, and replaces fetch responses in-page. All non-loopback browser
requests are additionally aborted. It covers immediate WhatsApp, matching readable saved and
duplicate acknowledgements, invalid/missing/mismatched/opaque/HTTP/network uncertainty, an
actual 25-second abort, retained details, unchanged-ID/timestamp and refresh retries, edited
request IDs, participant validation/preservation, and desktop/tablet/mobile screenshots in
`output/playwright/new-intake-*.png`. These are UI mocks, NOT native Google CORS/redirect,
Sheet, inbox or production verification. WhatsApp messages are prepared, never sent.

## Handoff Gate

Next: parent completes independent deployed-identity and zero-trigger verification,
then runs local `stage` / `check` with completed attestations. Recommended model: `gpt-6.1-sol` for scoped binding and
tests; `gpt-6-astra` for final cross-system/release review. Model routing was unavailable in
this packaging session; no delegated model execution is claimed. Actual isolated Google
acceptance, the one approved email, and subsequent production activation remain parent-owned.
No push, merge, endpoint activation, deploy or fallback promotion is authorized here.

## Completed Local Evidence

- Final artifact: `output/new-intake-web/preparation-final-e27ea9b`.
- Manifest SHA-256: `b6ad4f1590e5c466aa962ca89f6c9de54bd9795592ced45cd3a771b1ffb0a091`.
- `node --test automation/new-intake-web/test.mjs`: 7 passed, 0 failed. Loopback tests
  required execution outside the sandbox because sandbox TCP connections returned EACCES.
- Final `web.mjs check`: passed exact reconstruction and all 126 public file entries.
- Cached Playwright CLI fixture: passed all listed UI/mock checks, actual 25000ms timeout
  and screenshots at 390/768/1440. Screenshots were visually inspected. Expected local CSP
  console messages report blocked Google Fonts/Plausible, not application exceptions.
- `git diff --check`: passed. Owned edits: only the one `book.html` sentence and this new
  packaging directory; protected backend/runtime files unchanged. Parent-owned untracked
  `automation/new-intake-ops/` appeared during final checks and was left untouched. Root
  checkout was only inspected, never written by this packaging work.
- No Google acceptance, Sheet/inbox checks, real emails, deployments or production tests
  were performed here. The local browser and preview server were stopped after checks.
