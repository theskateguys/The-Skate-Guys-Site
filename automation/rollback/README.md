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

`--email-patch-reviewed` is an operator review acknowledgement, not automated proof or release permission. Versioned builds require the approved website commit as an ancestor and reject `d8a6a5a`. Website bytes must exactly match `contract.json`'s approved SHA. Deliberate future website changes require a separately reviewed contract update. Backend bytes come from the explicit SHA, including the final email patch. The completed follow-up pins source `02639f8c7e0361b72d1a19d03bf5fc6579ca2839`; see the isolated derivative below. Keep generated manifests outside Git to avoid a self-referential source hash.

## Manifest and Publish Boundary

- Schema 1; purpose `OFFLINE_UNBOUND_BOOKING_FALLBACK`; `productionReady: false` ALWAYS. No timestamp/random path in manifests: identical inputs reproduce identical bytes/hashes.
- `sourceSHA`: immutable full commit in versioned mode, null in test mode. `baseSHA` is contextual HEAD only, not a claim dirty bytes are committed. `workingTreeTest` and `emailPatchReviewed` distinguish test/pinned modes.
- `approvedWebsiteSHA` pins known-good website bytes; `contractSHA256` hashes canonical indented JSON plus LF. Working-tree comparison tolerates checkout CRLF but outputs preserve source bytes. Versioned builds use exact Git blobs.
- `files[]`: source path/SHA-256, artifact path/SHA-256, byte length and transformation (`exact-copy`, or config's `disable-endpoint-only`). `payloadSHA256` hashes the ordered artifact-path/hash list. `manifest.sha256` hashes exact manifest bytes. Hashes establish integrity/provenance, not signatures or production acceptance.
- `website/`: explicit approved public runtime page/asset allowlist plus sitemap/verification page. No automation/backend/docs/caches/Git/test records/helpers. `backend/`: ONLY exact `Code.gs` and `EmailLogo.gs`; no `IsolatedProfile.gs`, settings, test helpers or Sheet/data exports. Never publish artifact root/backend to the website host.
- Provenance is outside `website/`. Checker reconstructs expected bytes from source rather than trusting manifest hashes; it rejects altered/extra/missing files, extra empty directories and symlinks. Outputs must stay under Git-ignored `output/rollback/`; builder never deletes/overwrites an artifact.

## Binding and Common-Mode Limits

### Isolated Pinned Derivative (Not Release Binding)

The separate isolated binder accepts ONLY the existing strict-v2 test endpoint ending
`AKfycbw-UnIZTK7uF6yLQfGWM_mSQBHD6aVL_e7AoGikQY5cweh1EnGTuBN7z188XFnt-e4B2g/exec`.
It reconstructs the 43-file pinned source `02639f8c7e0361b72d1a19d03bf5fc6579ca2839`,
checks its pinned manifest SHA-256, and verifies the immutable offline template on every check.
Only the derivative's `website/assets/lead-config.js` endpoint changes. All other website/backend
bytes remain exact. Source, template and bound hashes are recorded in a separate derivative
manifest with `purpose: ISOLATED_ONLY`, `productionReady: false`, copied Sheet/project IDs,
deployment ID and version 2. This does NOT authorize release or prove remote deployment settings.
No changes to the original builder, checker, library or contract are needed.

Run from this review worktree, using a fresh ignored path:

```powershell
$Artifact = 'output/rollback/isolated-02639f8-v2-parent-retry'
node automation/bind-booking-rollback-isolated.mjs --out $Artifact
node automation/check-booking-rollback-isolated.mjs --artifact $Artifact
node --test automation/rollback/test-binding.mjs
node automation/rollback/binding-prepare-retry.mjs --artifact $Artifact
```

These are local integrity/HTTP/syntax checks, not browser, isolated Google or production
verification. They do not run the long packaging/mock suite. Existing artifact and runner
paths are never overwritten. The runner preparation pins the prior harness hash, retains
its native response observer and exact wire-body/single-POST guards, and writes ONLY
`output/acceptance/run-rollback-isolated-blank-retry.js`. It never invokes the runner or reads
the private fixture. The prior email runner is unchanged and MUST NOT be used unmodified here.

Parent read verification is mandatory: exact version 2/project, copied Sheet property,
`TSG_AUTOMATIC_REMINDERS_ENABLED=false`, and zero reminder triggers (only `onOpen`). This is
operator attestation, NOT automated proof from the manifest. The allowed unchanged record is
`TSG-OPTIMIZED-NOEMAIL-1792187088270`, timestamp `2026-10-16T21:44:48.270Z`, label
`TEST ONLY - Dylon optimized blank-email acceptance`, blank email, consent `No`, source
`book.html`, empty UTMs/referrer. Parent owns ALL original payload values and must preserve
them, including participant details and phone; no payload is constructed here. Expected
native acknowledgement is only `duplicate_ignored`. No fresh record or email is authorized.

The parent-owned ignored JSON fixture uses the prior harness structure (`payload`, `leadId`,
`timestamp`, `endpoint`, `expectedStatus`) and must explicitly carry these attestations:

- `approvedIsolatedCandidate`, `approvedUnchangedRetry`, `automaticRemindersDisabled`,
  `ownContactDetails`, `existingRowsCompleteVerifiedByParent`, `duplicateReadbackVerified`,
  all `true`. These are parent attestations, not automated remote proof.

Parent retains the separately read version/project/Sheet/trigger evidence and baseline counts
`{"Leads":21,"Bookings":18,"FollowUp":18,"Subscribers":7}` plus zero emails for the reference.
Verify the actual deployment/version before invoking the runner; project history alone is not
a deployment mapping. The local manifest states the required identity, not observed remote proof.

Start on port 4196 ONLY after verifying it is free; the server exits on collision. Default
mode exposes no fixture. To expose exactly ONE parent-provided ignored fixture, opt in:

```powershell
node automation/rollback/serve.mjs --isolated-binding --artifact $Artifact --port 4196 --private-fixture output/acceptance/fallback-isolated-retry-private.json
```

The explicit path must be a regular, non-symlink JSON file directly under ignored
`output/acceptance/`. Its bytes are snapshotted at startup and exposed only at
`http://127.0.0.1:4196/isolated-retry-fixture.json`, never under its filesystem path.
No other private/backend/doc/root-manifest files are served. Exact loopback Host+port,
same-origin checks, GET/HEAD-only methods and no-store apply. Stop the server when finished.
The safe public identity route is `http://127.0.0.1:4196/isolated-test-manifest.json`, including
bound manifest hash, source/binding identity and `requestTimeoutMs: 25000`. CSP connections
allow only self, the exact HTTPS Google endpoint and HTTPS `script.googleusercontent.com`
redirects. Website bytes are checked again before each response; no local POST is accepted.

Parent may invoke the NEW prepared runner once in a clean browser context with service
workers blocked, using the existing Playwright CLI `run-code --filename` workflow. This
reads the opted-in fixture before UI navigation, verifies exact bound-manifest identity,
then permits ONE exact unchanged POST and its real Google redirect/response. It does not
mock the acknowledgement. The authorized parent invocation is now completed: see
`../FALLBACK_ISOLATED_VERIFICATION.md` for native acknowledgement, counts/reference-row
readback, zero-email search and the explicit full-cell-comparison limitation. No second
invocation is authorized by these instructions. Stop on any mismatch or uncertainty; do
not retry automatically. A browser pass alone is not Sheet/inbox or production verification.

The tracked config retains the existing production string. Generated config replaces ONLY that endpoint with `''`; WhatsApp and 25000ms remain. There is no `--endpoint` option. A future separately authorized release binding must accept an explicit verified NEW strict booking `/exec` URL, reject legacy/isolated URLs, bind release AND fallback identically and record source/output hashes, authorization and deployment identity in a separate binding manifest. Preserve the immutable offline template. This checker intentionally rejects bound copies; their verification belongs to that future authorized binding contract.

Do not deploy the unbound template or silently default to legacy. This common-mode baseline can roll back FUTURE changes; identical release/fallback runtime does not magically cure a current/shared integration fault. A shared defect requires a separately reviewed fix or approved WhatsApp-only maintenance artifact. Legacy compatibility, active-live-trigger disabling, staging and production acceptance remain blockers in [the runbook](../../BOOKING_FLOW_ROLLOUT.md) and [parent-owned legacy plan](../LEGACY_ENDPOINT_COMPATIBILITY.md).
