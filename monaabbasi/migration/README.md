# Portfolio migration to Sanity

This directory contains a repeatable, review-first migration from the legacy bilingual static
portfolio into Sanity project `esf8v11h`.

The scripts are deliberately locked to the temporary `migration-test` dataset. They do not write to
`production`.

## Scope

- English and Persian profile content
- Resume introduction, education, and skills
- 18 detailed theatre/film productions
- Awards, teaching experience, upcoming work, gallery, contact, and SEO metadata
- Original image assets referenced by the source content
- Existing `cv.html` and `portfolio.html` remain static downloadable files in this first pass

The existing blog schemas (`post`, `author`, and `category`) remain unchanged.

## Source

By default the scripts read the parent legacy project two directories above this folder. Override
that location when needed:

```bash
SOURCE_ROOT=/absolute/path/to/legacy-site npm run dry-run
```

## Safe workflow

From this directory:

```bash
# 1. Generate the source snapshot, transformed manifest, and validation report.
npm run dry-run

# 2. Review reports/inventory.json and reports/dry-run.json.

# 3. Create migration-test (if missing) and deploy the portfolio schema.
npm run dataset:prepare

# 4. Show the import plan without writing data.
npm run import

# 5. Upload assets and import content into migration-test.
npm run import:commit

# 6. Compare remote counts and references with the manifest.
npm run validate:remote
```

The dataset preparation and import commands use the existing Sanity CLI login. Run
`cd ../studio && npx sanity login` first if authentication has expired.

To inspect migrated content in the standalone Studio:

```bash
cd ../studio
npm run dev:migration
```

Then open `http://localhost:3333`.

## Rerun behavior

- The `portfolioPage` singleton uses the fixed ID `portfolioPage`.
- Productions keep Sanity-generated IDs. The importer finds them by their stable `sourceKey` and
  replaces the matching document, preventing duplicates on reruns.
- Assets are reused by `source.id` (`legacy:<relative-path>`).
- Array `_key` values and Portable Text keys are deterministic.

Do not make editorial changes in `migration-test` before the final rerun; a rerun intentionally
replaces migrated fields with source values.

## Production cutover

Production is intentionally outside these scripts. After migration-test review:

1. Freeze edits in the legacy CMS.
2. Rerun extraction and validation against the final source snapshot.
3. Add an explicit production-import command after human approval.
4. Update the Next.js frontend to query `portfolioPage` and `production` content at `/en` and `/fa`.
5. Crawl both locale routes, verify metadata and assets, and preserve existing URLs.
