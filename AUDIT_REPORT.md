# The Skate Guys Website Cleanup Audit

**Branch:** `audit/tsg-site-cleanup-july-2026`  
**Audit date:** July 7, 2026  
**Scope:** `index.html`, `book.html`, `elite.html`, `merch.html`, `assets/updates-data.js`, `assets/events/events-data.js`, and hero-image assets.

## Current direction

The recent redesign moved the site in the right direction:

- The homepage is now a decision page with **Book a Class** as its main action.
- The booking journey has fewer steps and sends a structured enquiry to WhatsApp.
- The homepage does not show an expired public event.
- A real Canoe Bay community photo has been added as homepage proof.

## Findings

| Severity | File(s) | Issue | Visitor impact | Required fix |
|---|---|---|---|---|
| High | `assets/updates-data.js`, `assets/hero/canoe-bay-team.js` | The Canoe Bay hero photo is loaded as an encoded WebP string inside JavaScript, then injected as a CSS background. | The image cannot be cached as a normal media file, is harder to maintain, and does not provide normal image semantics or responsive source handling. | Replace with a normal optimized asset at `assets/hero/canoe-bay-team.webp` and render it with `<picture>` / `<img>` plus an overlay. Remove the encoded-image loader after confirming the normal asset works. |
| High | `merch.html` | The merch metadata and information strip claim worldwide shipping / Shopify fulfilment and local-printer delivery. These claims require current operational confirmation. | Visitors can expect delivery options that may not be active. | Remove or rewrite as a neutral WhatsApp order-confirmation process until fulfilment rules are confirmed. Update Schema.org metadata to match. |
| Medium | `elite.html` | Navigation and footer links still point to `index.html#community`, but the new homepage has no `community` section. | Visitors are dropped at the top of the homepage instead of reaching the WhatsApp community. | Replace with the official WhatsApp community URL or add a dedicated community page later. |
| Medium | `index.html`, `assets/updates-data.js` | The hero container still has an accessibility label for branded wheel artwork even though it is replaced by a real group photo when the loader runs. Hero image loading logic is also mixed into the updates data file. | The page description is inaccurate for assistive technology and the content model is harder to maintain. | Give the real photo an accurate alt/accessible description and move hero media logic into the homepage or a dedicated script. |
| Medium | `merch.html` | Product catalogue includes fulfilment language and items that may need live stock confirmation. | Customers can ask for unavailable items or assume old prices are active. | Confirm inventory, price, sizing and availability before the next merch campaign. Keep only confirmed products as active purchase items. |
| Low | `assets/updates-data.js` | `tickerText` fields remain even though the redesigned homepage no longer renders a ticker. | Minor maintenance clutter. | Remove unused fields after confirming no other page reads them. |
| Low | `index.html`, `elite.html`, `merch.html` | Visual system and navigation structures are not yet fully unified across pages. | The site feels like several good pages rather than one polished system. | Standardize navigation, footer, button states and mobile menu behaviour after the core cleanup. |

## Verification notes

- The booking form has one package selector, required fields, and a structured WhatsApp handoff.
- `assets/events/events-data.js` is currently empty, so there is no active event card being pulled from that file.
- Current reviewed Elite page source does not show a live **50% off merch** benefit. A repository-wide text check should still be run locally in Codex before merge to ensure no obsolete phrase remains in any unreviewed file.

## Manual decisions required from TSG

1. Confirm the real merch delivery policy: Tobago, Trinidad, pickup, local delivery, international delivery, Shopify fulfilment, or WhatsApp-only ordering.
2. Confirm which products are currently in stock and available for immediate order.
3. Upload the final standard WebP hero file to `assets/hero/canoe-bay-team.webp` so the encoded-image workaround can be removed.
4. Confirm whether the current Elite percentage-saving language should remain or be rewritten as commitment-plan language.

## Acceptance criteria before merge

- No `index.html#community` links remain unless that section exists.
- No unverified shipping or fulfilment claim remains.
- The hero photo loads from a normal image asset, has an accurate accessible description, and keeps the existing text overlay readable.
- No live `50% off merch` reference remains anywhere in the repository.
- Homepage, booking, Elite and merch pages are checked at 320px, 375px, 390px, 768px, 1024px and 1440px.
- A link and console-error check passes.
