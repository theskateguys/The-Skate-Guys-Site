# TSG transfer snapshot

This branch is a reviewable handoff archive, not a deployable website root. Start with HANDOFF.md and MANIFEST.json. Preserve AGENTS.md boundaries.

- website-whatsapp/: pinned approved WhatsApp website release plus source documentation; raw generated evidence omitted.
- booking-review/: prepared Google intake review sources; not production activated.
- merch-draft/: local uncommitted colour-selector draft and five PNGs, with remote baseline for comparison.
- bundles/: exact earlier six-entry merchandise ZIP (data archive, not Git history).
- source-baselines/: selective pinned files needed to understand contracts. These do not recreate Git ancestry or satisfy guard checks.

Root vercel.json disables Git deployment for this transfer branch. Do not connect/publish this root or promote any included isolated endpoint. Snapshot source config remains unchanged except documented privacy redactions. Full historical Git objects, credentials, local settings, generated logs and customer records are excluded.

MANIFEST.json hashes every payload file. Its own hash is in MANIFEST.sha256; self-hashing is intentionally avoided. Exclusions and transformations are recorded. Documentation records past evidence, not fresh production verification.
