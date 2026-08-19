# JINHEXI site rebuild handoff

Date: 2026-08-18

## Current stage

Frontend redesign completed for the local JINHEXI independent website.

## Target site

- Local path: `D:\wps\204958225\WPS云盘\大朗瑾禾熙\JNI独立站营运\site`
- Local preview: `http://localhost:4173/`
- Admin preview: `http://localhost:4173/admin.html`

## What changed

- Rebuilt the public storefront design across `index.html`, `collection.html`, `product.html`, and `journal.html`.
- Added `site-refresh.css` as the new storefront design layer.
- Simplified collection cards to a single product image plus title, price, and short copy.
- Moved detail imagery fully onto the product detail page and kept the product introduction/specs there.
- Added a final compact storefront override in `site-refresh.css` so the homepage hero, headings, navigation, journal cards, product detail, and secondary sections render about half as tall as the earlier oversized layout.
- Tightened related product cards on product detail pages so outside product cards stay focused on one main image, title, price, and detail entry.
- Reworked the homepage back to a standard editorial-commerce layout: clear copy on the left, a single 4:5 product image on the right, and unified image frames across featured products and posts.
- Expanded the journal with six newer posts covering cashmere sourcing, wool context, care, pilling, and capsule wardrobe content.
- Replaced the journal social preview image with a real catalog image instead of the old generic hero artwork.
- Updated collection and product social preview images to more relevant product imagery.
- Synced `sitemap.xml` and kept `robots.txt` focused on indexable public pages.
- Preserved WhatsApp, email, product detail, collection, journal, and admin paths.
- Fixed the local Node preview path containment check so Windows local static pages no longer return false 403 responses.

## Content currently available

- Products: 8 items from `data/products.json`
- Posts: 11 items from `data/posts.json`
- Product images: all referenced local image paths exist

## Verification

- `node --check app.js`, `product.js`, `journal.js`, `server.js`, `functions/_defaults.js`: passed
- `GET /index.html`, `GET /collection.html`, `GET /product.html?id=100-cashmere-crewneck-sweater`, `GET /journal.html`, `GET /journal.html?post=cashmere-vs-wool`: 200 from local preview server
- `GET /api/products`: 200, 8 items
- `GET /api/posts`: 200, 11 items
- `GET /sitemap.xml`: includes the new journal entries
- Product image path scan passed
- Data scan passed: 8 products have card images and galleries; 11 posts all have images.
- New homepage hero image generated and then removed after the layout was simplified back to a standard single-image hero.
- New CSS check passed for no purple theme, no negative letter spacing, and no nested-card pattern

## Visual QA note

The in-app browser/localhost automation remained unreliable in this desktop run, so final screenshot capture was not completed. HTTP, syntax, SEO head, data, and asset checks were completed instead.

## Conversion-optimization redesign (2026-08-19)

Goal set by user: conversion & purchase guidance first, refined Scandi style, English (US/EU) audience.

### What changed

- Added `conversion-refresh.css` as the conversion + polish layer (loaded last on all four pages).
- **Home hero**: added a "Get launch access" email → WhatsApp capture form (`data-launch-form`).
- **Announcement bar** (all pages): benefit-led copy "Complimentary shipping & 30-day returns · 100% cashmere".
- **Product cards** (`app.js` `productTemplate`): added 100% cashmere badge, ★4.9 (28) rating, colour swatches (parsed from `colors`), and a primary "Notify me" CTA linking to WhatsApp pre-order enquiry.
- **Product detail** (`product.js` `renderProduct`): added rating + review link, interactive colour swatches + size pills, a buyer-trust bar (free shipping / 30-day returns / 100% cashmere), a "Notify me when it launches" CTA, a verified-reviews social-proof section, and a 4-question FAQ. Added click handlers for colour/size selection.
- **Collection**: added a bottom conversion CTA ("Not sure which piece is for you?" → WhatsApp).
- **Mobile conversion bar**: product page second action is now "Notify me".
- Fixed a pre-existing bug where `.refresh-service-section` / `.refresh-contact-section` had `background: transparent` from the site-refresh compact pass, making white text unreadable on the paper background. Restored the full-bleed ink (service) and rust (contact) colour blocks in `conversion-refresh.css`.

### Verification

- `node --check` on all JS files: passed.
- Local preview: home / collection / product pages render with all new conversion elements.
- Colour & size selectors tested in-browser: 3 swatches + 4 sizes, active-state switching works.
- Service & contact sections confirmed to render ink/rust background with readable white text.

## Regenerated brand images (2026-08-19)

User reported that two large images didn't scale with the window and wanted them replaced with newly generated, on-brand images (with embedded text). Regenerated via image-gen and wired into the site.

### New assets (site/assets/)
- `hero-banner-jinhexi.png` — 16:9 home hero banner, model in ivory cashmere + rust scarf, embedded "Cashmere for everyday winter." / "100% cashmere · JINHEXI" serif text.
- `product-turtleneck-jinhexi.png` — 3:4 product shot of a deep-navy oversized turtleneck with embedded "100% cashmere / Oversized turtleneck" text.

### Where they are used
- **Home hero**: `.refresh-hero` is now a full-width responsive banner (`.refresh-hero-banner img { width:100%; height:auto }`) with the Shop-collection / Why-cashmere CTA row and the Get-launch-access capture below. `h1` moved to `.sr-only` for SEO/a11y. The hero copy/waitlist colours were re-mapped to ink on the paper background. Layout overrides live at the end of `conversion-refresh.css`.
- **Collection / detail (turtleneck sweater)**: regenerated images were rendered to webp and written over `assets/catalog-branded/100-cashmere-turtleneck-sweater-02.webp` (1200px main) and `assets/catalog-thumbs/100-cashmere-turtleneck-sweater-02.webp` (760px thumb), so both the collection card and the PDP main image now use the new shot. No data file change needed (products.json already pointed at these files).

### Responsiveness
Both images use `width:100%; height:auto`, so they scale with the viewport (the original complaint). Verified in the browser that banner width tracks the container (1180px at the test viewport).

### Verification
- Browser: home hero banner + CTA + launch-access row render correctly on the paper background; collection turtleneck card shows the new shot; PDP main image points to the regenerated webp.
- `node --check` on JS unchanged this round (no JS edits).

## Mobile hero + launch-readiness pass (2026-08-19)

### Mobile
- Added a **vertical hero banner** `assets/hero-banner-jinhexi-mobile.png` (9:16, same brand/typeface as the desktop one). The home hero now uses `<picture>` with a `(max-width: 860px)` source so phones get the vertical image and desktop keeps the horizontal one. Responsive (`width:100%; height:auto`).
- Fixed the fixed bottom `.mobile-conversion-bar` covering the footer: added `padding-bottom:104px` to `.storefront-footer` on ≤860px.
- Verified mobile at 390px viewport (Playwright + Chromium): home, collection, and PDP all render in a clean single column with no overflow; vertical hero loads on mobile.

### Launch-readiness / Google Ads prep
- **Favicon**: generated `favicon.ico` (brand ink + "J") and `assets/favicon.png`; wired into all 7 pages (`<link rel="icon">` + apple-touch-icon). Eliminated the favicon 404 console error.
- **Legal pages** (English, EU/UK/US-ready): `privacy-policy.html`, `terms.html`, `shipping-returns.html`; added a "Legal" footer link set to all pages and added them to `sitemap.xml`. Styled via `.legal-page`.
- **Compliance**: removed the fabricated ratings/reviews ("4.9 · 28 reviews", 3 fake testimonials) from product cards and PDP — these would violate FTC / Google policy and block ad approval. Kept the real trust bar (free shipping / 30-day returns / 100% cashmere) and the FAQ. Softened "Independently verified fibre" → "Genuine fibre, nothing blended" to avoid implying an unearned third-party certification.
- **Analytics / Search Console hooks** added to `header.js` (inactive placeholders): paste the real GA4 Measurement ID and the `google-site-verification` content token to enable.

### Verification
- `node --check` on all JS: passed.
- Link check: all internal href/src across 8 HTML files resolve (no dead links).
- Playwright QA: every page returns 200, titles correct, policy pages render; home page has no console errors; PDP has rating/proof removed, FAQ + trust bar intact; collection cards have no rating.
- Mobile screenshots (390px): home (vertical hero, footer no longer covered), collection, PDP all look clean.
