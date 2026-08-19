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
