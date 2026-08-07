# JINHEXI Website

This is the first maintainable website build for `jhicashmere.com`.

## Run Locally

```powershell
cd site
node server.js
```

Open:

- Website: http://localhost:4173
- Admin: http://localhost:4173/admin.html

Set a local admin password before starting:

```powershell
$env:JINHEXI_ADMIN_PASSWORD="your-private-password"
node server.js
```

## Editable Content

- Products: `data/products.json`
- Blog posts: `data/posts.json`

The admin panel saves changes back to these JSON files.

## Domain Deployment Notes

For Cloudflare Pages, set `ADMIN_PASSWORD` in the Pages environment variables. Do not write the admin password into website files or documentation.
