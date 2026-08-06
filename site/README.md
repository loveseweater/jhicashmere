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

Default local admin password:

```text
jinhexi2026
```

To use another password:

```powershell
$env:JINHEXI_ADMIN_PASSWORD="your-new-password"
node server.js
```

## Editable Content

- Products: `data/products.json`
- Blog posts: `data/posts.json`

The admin panel saves changes back to these JSON files.

## Domain Deployment Notes

Point `jhicashmere.com` to the hosting server, then run this Node site behind HTTPS. For a production launch, change the admin password and use a proper reverse proxy such as Nginx, Caddy, or a managed Node host.
