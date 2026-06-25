# Sanity + Netlify cutover guide

This project uses Sanity project `esf8v11h`.

## Current Sanity dataset state

- `production` is now the canonical dataset for the live site.
- `migration-test` is kept temporarily as a safety copy.
- `migration-test-comments` was empty and has been deleted.

Local backup exports were created in `migration/backups/` before the merge.

## Local development

Run the Studio:

```bash
cd studio
npm run dev
```

Run the web app:

```bash
cd web
npm run dev
```

The default dataset is now `production`. To intentionally run against the temporary dataset:

```bash
cd studio
npm run dev:migration
```

For the web app, change `web/.env.local` only if you intentionally want to preview another dataset.

## Sanity CORS origins

Configured origins:

- `http://localhost:3000`
- `http://localhost:3333`
- `https://monaabbasi.netlify.app`

## Netlify environment variables

Set these on the Netlify site that owns `https://monaabbasi.netlify.app`:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=esf8v11h
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://monaabbasi.netlify.app
```

If the Studio is deployed somewhere public, also set:

```text
NEXT_PUBLIC_SANITY_STUDIO_URL=https://YOUR-STUDIO-DOMAIN
SANITY_STUDIO_ORIGIN=https://YOUR-STUDIO-DOMAIN
```

For draft preview / live editing, create a Sanity Viewer token and set it as a secret:

```text
SANITY_API_READ_TOKEN=YOUR_VIEWER_TOKEN
```

Published content can render without this token if the dataset is public. Draft preview needs it.

## Important choice: exact site vs new CMS web app

The `web` folder is a CMS-connected Next.js app. It is not guaranteed to be pixel-identical to the existing live site.

To connect the exact current site, use one of these paths:

1. **Replace the live Netlify site with `web`**  
   Fastest CMS cutover, but design may differ from the existing site.

2. **Retrofit the existing live-site source to read Sanity**  
   Best for preserving the exact current design. The existing source must fetch from Sanity at build time or runtime using the same project/dataset values above.

Do not delete `migration-test` until the chosen live-site path is verified on Netlify.

## After live verification

When `https://monaabbasi.netlify.app` is confirmed to read from `production`, delete the temporary dataset:

```bash
cd studio
npx sanity dataset delete migration-test
```

Sanity will ask for confirmation unless `--force` is used.
