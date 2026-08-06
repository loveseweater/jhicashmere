# JINHEXI Cloudflare Deployment Plan

## Direction

Use `jhicashmere.com` as the brand site. The site should not replace Amazon checkout in the early stage. It should:

- Present the JINHEXI brand.
- Show products and product education.
- Publish care guides and knitwear blog content.
- Send retail buyers to Amazon product pages.
- Collect wholesale and overseas buyer inquiries.
- Allow the owner to update products and blog posts from an admin page.

## Recommended Cloudflare Architecture

- Domain/DNS: Cloudflare, existing `jhicashmere.com`.
- Frontend hosting: Cloudflare Pages.
- Backend API: Cloudflare Pages Functions or Workers.
- Database: Cloudflare D1.
- Admin login: password-protected admin panel, with the password stored as a Cloudflare environment secret.

This avoids buying a separate Tencent Cloud server for the first version.

## Product Fields Needed

- Product name
- Category
- Colors
- Price or price range
- Product status
- Description
- Product image
- Amazon URL
- Amazon button text
- Material composition
- Size guide notes

## Blog Fields Needed

- Title
- Date
- Excerpt
- Full content
- SEO title
- SEO description

## Launch Steps

1. Keep `jhicashmere.com` DNS active in Cloudflare.
2. Create a Cloudflare Pages project for the website files.
3. Create a D1 database for products and posts.
4. Move local JSON data into D1 tables.
5. Set an admin password secret in Cloudflare.
6. Bind `jhicashmere.com` and `www.jhicashmere.com` to the Pages project.
7. Add Amazon product links after each ASIN/listing is live.

## Amazon Traffic Strategy

- Product cards should show `View on Amazon` when the Amazon listing is live.
- If a product is not live on Amazon, show `Amazon Coming Soon`.
- Blog posts should naturally link to related products, then route users to Amazon for checkout.
- Homepage should include an Amazon store entry after Brand Store is live.

## Compliance Notes

- If a product is not 100% cashmere, do not label it as 100% cashmere.
- Use exact material composition on product pages and Amazon listings.
- Add care instructions and size guidance to reduce returns.
