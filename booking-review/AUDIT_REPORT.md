# The Skate Guys Site Audit Report

Branch: `codex/tsg-site-audit`
Date: 2026-07-07

## Issues Found

| Severity | File | Exact Issue | User Impact | Proposed Fix |
| --- | --- | --- | --- | --- |
| Critical | `index.html` | Homepage class package prices and durations conflict with the required business rules and with `book.html`: Starter Pass shows `$130`, Bootcamp shows `$195 / 3 classes`, Academy Monthly shows `$260`. | Visitors may choose or dispute the wrong package and price before booking. | Update homepage package cards to Starter Pass `2 classes / 10 days / $140 TTD`, Beginner Bootcamp `4 classes / 14 days / $260 TTD`, Academy Monthly `4 classes / 30 days / $280 TTD`. |
| High | `merch.html` | Product cards reference missing local images: `bucket-hat.jpg`, `hoodie-solid-sk8.jpg`, `keychain.jpg`, `hoodie-therapy.png`, `tee-skate-mom.jpg`, `hoodie-f8.png`, `hoodie-running.png`, and `tee-christmas.png`. | The merch page renders broken image icons across most product cards. | Use the committed `classic-tshirt-community.jpg` where available and convert missing-image products to styled placeholders until real assets are committed. |
| High | `merch.html`, `index.html` | Shipping/worldwide claims appear in metadata, hero copy, stats, info strip, and homepage merch teaser without support in the current business rules. | Unsupported claims can mislead customers about fulfillment and availability. | Remove worldwide/free-delivery shipping claims and replace with neutral WhatsApp/Shopify ordering language. |
| High | `merch.html` | Discount/deal claims appear in the merch top bar and email capture copy (`exclusive discounts`, `exclusive community deals`). | Violates the instruction not to make unsupported discount claims and risks conflicting offers. | Remove discount/deal language without replacing it with another merch discount. |
| High | `index.html` | Homepage referral CTA advertises `$20 TTD off` discount, including a prefilled WhatsApp message requesting the discount. | Unsupported discount claim can create customer service friction. | Remove the discount/referral promo or rewrite as a neutral “bring a friend” prompt with no discount. |
| High | `index.html` | The homepage “Join the Community” CTA under testimonials points to `#learn`, a booking form, not the community/WhatsApp action. | Users trying to join the community are sent to the wrong section. | Point the CTA to the WhatsApp community link or change the label to match the destination. |
| Medium | `index.html` | A note links to `#referral`, but no element with `id="referral"` exists. | Clicking the link does nothing, especially confusing on mobile. | Remove the missing anchor reference or add a real referral section only if the offer is confirmed. |
| Medium | `index.html` | Homepage contains duplicate hardcoded updates/events markup and JS-rendered update/event logic. | More maintenance risk and possible stale content if JS data changes. | Keep the data-driven render path and leave a clean fallback only where needed. |
| Medium | `index.html` | `assets/hero/canoe-bay-team.js` and `assets/hero/` do not exist in this checkout, and the homepage currently has no Canoe Bay hero image to refactor. | The requested hero-image refactor cannot be safely completed without the real committed source photo. | Do not invent imagery. Add a documented blocker; when the real Canoe Bay group photo is supplied, commit it as a normal image and render it with `<picture>`/`<img>`. |
| Medium | `merch.html` | The favicon points to `/favicon.ico`, which is not present. | Browser requests a missing asset. | Reuse the committed PNG favicon path used by other pages. |
| Medium | `book.html` | Package card metadata omits the price unit after the slash pattern (`2 classes / 10 days / TTD`). | Booking choices are less clear on mobile and less consistent with the business rules. | Show full package metadata, including `$140 TTD`, `$260 TTD`, and `$280 TTD`. |
| Medium | `book.html` | The booking form does not collect a WhatsApp/phone number even though TSG confirms bookings by WhatsApp. | Staff receive incomplete booking context if WhatsApp does not expose the sender clearly. | Add a required WhatsApp number field and include it in the generated message. |
| Medium | `elite.html` | Mobile menu button updates visual state only; it does not expose `aria-expanded` or a controlled menu relationship. | Screen reader and keyboard users receive less accurate navigation state. | Add `aria-expanded`, `aria-controls`, and toggled state on the burger button. |
| Medium | `index.html`, `elite.html`, `merch.html` | Animated ticker/reveal/pulse behavior has no `prefers-reduced-motion` fallback. | Motion-sensitive users may have a worse experience. | Add reduced-motion CSS to disable marquee, pulse, reveal transitions, and hover motion. |
| Low | `book.html` | The Book page navigation is thinner than the other pages and omits direct WhatsApp/mobile menu options. | Users on the booking page have fewer escape routes if they need help. | Keep the simple booking page, but add a visible WhatsApp help link. |
| Low | `index.html`, `book.html`, `elite.html`, `merch.html` | Some buttons and links use icon/emoji-prefixed text inconsistently across pages. | The experience feels less consistent and can create noisy accessible names. | Normalize the highest-value CTAs around “Book a Class”, “See Upcoming Events”, “WhatsApp Us”, and “Join Community”. |
| Low | `assets/events/events-data.js` | Events data is empty, and the homepage correctly shows the empty state. | No expired events were found, but TSG must manually add upcoming events when confirmed. | Leave empty state in place and avoid inventing event details. |

## Safe Fixes Planned

- Correct class-package prices and duration copy.
- Remove unsupported merch shipping, discount, and deal claims.
- Fix the broken `#referral` link and misleading community CTA.
- Replace missing merch image references with accessible placeholders or committed images.
- Improve booking form completeness and package metadata.
- Add reduced-motion fallbacks and small navigation accessibility improvements.
- Document the Canoe Bay hero image blocker instead of using stock or AI-generated people.
