# CMS content flow

## Before remediation

1. The legacy static site in the repository root contains the complete bilingual portfolio and visual language.
2. `migration` extracts that source, transforms it into one `portfolioPage` singleton plus ordered `production` documents, and validates/imports only into `migration-test`.
3. The standalone `studio` edits those documents, but its preview links point to legacy `/#...` anchors.
4. `web` queries only `post` documents from `production`, so none of the migrated portfolio reaches the public page.

## Target flow for the Gate 2 demo

1. Editors update the singleton and productions in the standalone Studio.
2. Launch-critical localized fields are schema-gated; migration metadata stays hidden and optional.
3. `web` makes one projected, typed GROQ request to `migration-test` for the singleton and its ordered production references.
4. `/`, `/en`, and `/fa` render the same model with locale-specific copy, direction, navigation, images, contact details, and managed downloads.
5. Studio's Website map and document views link to the matching route and section.
6. The Studio Presentation tool opens `/en` in Next.js Draft Mode for live preview and click-to-edit overlays. This requires `SANITY_API_READ_TOKEN` in `web/.env.local` and `SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3000` when running the standalone Studio locally.

## Local editing checklist

1. Run the web app from `web`: `npm run dev`.
2. Run the standalone Studio from `studio`: `npm run dev:migration -- --host 0.0.0.0`.
3. Add a Sanity Viewer token to `web/.env.local` as `SANITY_API_READ_TOKEN=...`, then restart the web dev server.
4. Open `http://localhost:3333`, sign in to Sanity, and use the `Live preview` tool for click-to-edit editing. The `Published page` tab in Structure is intentionally read-only.

`production` is intentionally outside this flow until the human-approved cutover phase.
