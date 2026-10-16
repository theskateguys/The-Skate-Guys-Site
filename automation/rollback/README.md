# Offline Booking Fallback

Local packaging only. No network submission, email, deployment, endpoint switch or Git write is performed. Run commands from the booking review worktree. Production runtime files remain untouched.

## Local Test Artifact

`output/rollback/precommit-review-52467abc/` contains the approved pages and current welcome-patched backend, copied byte for byte except endpoint disabling. It is **OFFLINE_UNBOUND**, TEST ONLY (`sourceSHA: null`, `productionReady: false`), NOT a staged production fallback. Builder refuses existing directories; use a fresh name for a rebuild.

```powershell
node automation/build-booking-rollback.mjs --working-tree-test --out output/rollback/precommit-review-52467abc
node automation/check-booking-rollback.mjs --working-tree-test --artifact output/rollback/precommit-review-52467abc --regressions
node --test automation/rollback/test.mjs
```

The checker runs existing lead-flow, WhatsApp-link and booking-system scripts against copies of the ARTIFACT website/backend in a private temporary verification tree. This includes mocked protected statuses/repair and the welcome-only email assertion. No test/helper enters the publish tree. These mocks are not Google or production acceptance.

## Browser Handoff

Start the loopback preview separately; stop with Ctrl+C. It serves only allowlisted website files, refuses non-GET/HEAD, keeps config endpoint disabled, blocks live Google delivery via CSP, and exposes no backend/manifest/repo files. Fixtures require port 4188: if occupied, identify the server first; do not accidentally test an email-capable isolated preview.

```powershell
node automation/rollback/serve.mjs --working-tree-test --artifact output/rollback/precommit-review-52467abc --port 4188
```

Use installed/cached Playwright CLI; `--no-install` fails instead of fetching a missing package. Each fixture needs a fresh named session to avoid accumulated routes/events. Fixtures intercept synthetic `.invalid` delivery and WhatsApp popups; Google is blocked. They intentionally override config for mocking. The historical delay fixture uses 9000ms, not the final deadline; the timeout fixture reads the artifact's actual 25000ms and takes over one minute.

```powershell
New-Item -ItemType Directory -Force output/playwright
npx --no-install --package @playwright/cli playwright-cli --session rollback-basic open http://127.0.0.1:4188/book.html
npx --no-install --package @playwright/cli playwright-cli --session rollback-basic run-code --filename automation/check-booking-browser.js
npx --no-install --package @playwright/cli playwright-cli --session rollback-basic close
npx --no-install --package @playwright/cli playwright-cli --session rollback-timeout open http://127.0.0.1:4188/book.html
npx --no-install --package @playwright/cli playwright-cli --session rollback-timeout run-code --filename automation/check-booking-timeout.js
npx --no-install --package @playwright/cli playwright-cli --session rollback-timeout close
```

Optional historical-delay fixture (also mocked):

```powershell
npx --no-install --package @playwright/cli playwright-cli --session rollback-delay open http://127.0.0.1:4188/book.html
npx --no-install --package @playwright/cli playwright-cli --session rollback-delay run-code --filename automation/check-booking-delay.js
npx --no-install --package @playwright/cli playwright-cli --session rollback-delay close
```

Expected: validation/policy/responsive screenshots, immediate WhatsApp before held response, saved only after readable matching acknowledgement, invalid/mismatched/opaque responses uncertain, retained values, same-ID/timestamp retries and recovery beyond 25 seconds. Browser checks are separate from static integrity/backend mocks. The parent runs/reports browser results; these commands alone do not establish a browser pass.

## Final Parent Commit Gate

Wait for the email patch and complete diff to receive Astra review. The parent commits only if authorized, then builds from the actual full SHA, not HEAD, a short reference, a pre-patch commit or a guessed future hash:

```powershell
$SourceSHA = '<FULL_40_CHARACTER_FINAL_PARENT_COMMIT_SHA>'
node automation/build-booking-rollback.mjs --source $SourceSHA --email-patch-reviewed --out "output/rollback/$SourceSHA"
node automation/check-booking-rollback.mjs --source $SourceSHA --artifact "output/rollback/$SourceSHA" --regressions
```

`--email-patch-reviewed` is an operator review acknowledgement, not automated proof or release permission. Versioned builds require the approved website commit as an ancestor and reject `d8a6a5a`. Website bytes must exactly match `contract.json`'s approved SHA. Deliberate future website changes require a separately reviewed contract update. Backend bytes come from the explicit SHA, including the final email patch. No versioned artifact is pinned by this local task. Keep generated manifests outside Git to avoid a self-referential source hash.

## Manifest and Publish Boundary

- Schema 1; purpose `OFFLINE_UNBOUND_BOOKING_FALLBACK`; `productionReady: false` ALWAYS. No timestamp/random path in manifests: identical inputs reproduce identical bytes/hashes.
- `sourceSHA`: immutable full commit in versioned mode, null in test mode. `baseSHA` is contextual HEAD only, not a claim dirty bytes are committed. `workingTreeTest` and `emailPatchReviewed` distinguish test/pinned modes.
- `approvedWebsiteSHA` pins known-good website bytes; `contractSHA256` hashes canonical indented JSON plus LF. Working-tree comparison tolerates checkout CRLF but outputs preserve source bytes. Versioned builds use exact Git blobs.
- `files[]`: source path/SHA-256, artifact path/SHA-256, byte length and transformation (`exact-copy`, or config's `disable-endpoint-only`). `payloadSHA256` hashes the ordered artifact-path/hash list. `manifest.sha256` hashes exact manifest bytes. Hashes establish integrity/provenance, not signatures or production acceptance.
- `website/`: explicit approved public runtime page/asset allowlist plus sitemap/verification page. No automation/backend/docs/caches/Git/test records/helpers. `backend/`: ONLY exact `Code.gs` and `EmailLogo.gs`; no `IsolatedProfile.gs`, settings, test helpers or Sheet/data exports. Never publish artifact root/backend to the website host.
- Provenance is outside `website/`. Checker reconstructs expected bytes from source rather than trusting manifest hashes; it rejects altered/extra/missing files, extra empty directories and symlinks. Outputs must stay under Git-ignored `output/rollback/`; builder never deletes/overwrites an artifact.

## Binding and Common-Mode Limits

The tracked config retains the existing production string. Generated config replaces ONLY that endpoint with `''`; WhatsApp and 25000ms remain. There is no `--endpoint` option. A future separately authorized release binding must accept an explicit verified NEW strict booking `/exec` URL, reject legacy/isolated URLs, bind release AND fallback identically and record source/output hashes, authorization and deployment identity in a separate binding manifest. Preserve the immutable offline template. This checker intentionally rejects bound copies; their verification belongs to that future authorized binding contract.

Do not deploy the unbound template or silently default to legacy. This common-mode baseline can roll back FUTURE changes; identical release/fallback runtime does not magically cure a current/shared integration fault. A shared defect requires a separately reviewed fix or approved WhatsApp-only maintenance artifact. Legacy compatibility, active-live-trigger disabling, staging and production acceptance remain blockers in [the runbook](../../BOOKING_FLOW_ROLLOUT.md) and [parent-owned legacy plan](../LEGACY_ENDPOINT_COMPATIBILITY.md).
