# Cleanup Audit Changelog

## July 7, 2026 — Audit branch created

This branch was created from `main` to move remaining website cleanup work out of production.

### Baseline captured

- Homepage conversion redesign is already live on `main`.
- Booking page simplification is already live on `main`.
- Canoe Bay community proof photo is currently delivered through an encoded JavaScript workaround.
- No Codex audit pull request existed before this branch.

### Work intentionally not merged directly to `main`

- Hero media refactor to a normal WebP image asset.
- Merch fulfilment claim cleanup.
- Remaining broken navigation and footer-link cleanup.
- Full repository search for obsolete `50% off merch` language.
- Responsive, accessibility, link and console-error verification.

### Required review process

1. Complete the fixes on this branch.
2. Review the Vercel preview at mobile and desktop sizes.
3. Confirm all merch stock and fulfilment statements.
4. Merge only after the audit acceptance criteria in `AUDIT_REPORT.md` are met.
