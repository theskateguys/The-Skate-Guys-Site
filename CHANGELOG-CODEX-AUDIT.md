# Codex Audit Changelog

Date: 2026-07-07
Branch: `codex/tsg-site-audit`

## Changed Files

- `AUDIT_REPORT.md`
  - Added the pre-edit audit with severity, affected files, user impact, and proposed fixes.
- `index.html`
  - Corrected class package pricing and durations to match the required business rules.
  - Simplified the hero CTAs to keep `Book a Class` primary and `See Upcoming Events` secondary.
  - Added an early trust band with real coach/community imagery, a testimonial excerpt, and links into the full coaches/reviews sections.
  - Removed unsupported referral-discount and merch-shipping claims.
  - Fixed the misleading community CTA and removed the broken `#referral` path.
  - Replaced duplicated hardcoded update cards with a JS-rendered updates container.
  - Added reduced-motion handling and an explicit mobile-menu control relationship.
- `book.html`
  - Added a required WhatsApp number field to the booking form.
  - Included the WhatsApp number in the generated booking message.
  - Clarified package card metadata with full TTD prices.
  - Added a WhatsApp help link in the navigation.
  - Added reduced-motion handling.
- `merch.html`
  - Removed unsupported worldwide shipping, free delivery, and discount/deal claims.
  - Fixed the missing favicon path.
  - Replaced missing local product image references with accessible placeholders.
  - Replaced placeholder boxes with temporary local logo mockups for T-shirts, hoodies, bucket hat, keychain, and socks.
  - Updated ordering language to use neutral Shopify/WhatsApp wording.
  - Added reduced-motion handling and an explicit mobile-menu control relationship.
- `assets/merch/mockup-*.svg`
  - Added draft product mockups using the existing TSG logo.
- `MERCH_MOCKUP_ROLLOUT.md`
  - Added a review rollout so TSG can approve, revise, or replace temporary merch mockups before treating them as final.
- `HOMEPAGE_TRUST_ROLLOUT.md`
  - Added a review rollout for the new near-top coaches/testimonials trust placement.
- `elite.html`
  - Added reduced-motion handling.
  - Improved mobile-menu state with `aria-controls` and `aria-expanded`.

## Deferred

- Canoe Bay hero image refactor: the requested `assets/hero/canoe-bay-team.js` and source image were not present in this checkout. No stock images or AI-generated people were used. TSG should provide the real Canoe Bay group photo so it can be committed as a normal optimized asset and rendered with `<picture>` or `<img>`.
