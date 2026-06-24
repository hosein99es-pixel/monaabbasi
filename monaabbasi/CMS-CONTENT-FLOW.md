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
5. Studio's website map and document views link to the matching locale route and section.

`production` is intentionally outside this flow until the human-approved cutover phase.
