# Source-to-Sanity mapping

| Source                                | Target                                                 | Notes                                                                           |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `content/home.json`                   | `portfolioPage` singleton                              | Localized name/introduction and headshot with hotspot                           |
| Hero chips in `index.html`            | `portfolioPage.roles[]`                                | Page-owned localized objects                                                    |
| Resume markup in `index.html`         | `portfolioPage.resume*`, `education[]`, `skills[]`     | HTML is extracted into structured fields and Portable Text                      |
| `assets/js/productions.js`            | `production` documents                                 | 18 records; ordinary documents use generated IDs and stable `sourceKey` lookups |
| Production image tuples               | `production.heroImage` and `gallery[]`                 | Originals uploaded to Sanity Asset Pipeline                                     |
| `content/awards.json`                 | `portfolioPage.awards[]`                               | Page-owned objects preserve ordering                                            |
| `content/teaching.json`               | `portfolioPage.teachingExperiences[]`                  | Page-owned objects preserve ordering                                            |
| `content/gallery.json`                | `portfolioPage.gallery[]`                              | Images, localized labels/titles/captions, and alt text                          |
| `content/sections.json`               | `portfolioPage.sectionIntroductions[]`, `upcomingWork` | Semantic section identifiers replace presentation-specific field names          |
| `content/extra-sections.json`         | `portfolioPage.customSections[]`                       | Currently empty, but fully modeled for future entries                           |
| Contact/footer markup in `index.html` | `portfolioPage.contact`, `footerText`                  | Email, phone, WhatsApp, and localized copy                                      |
| `dist/en` and `dist/fa` metadata      | `portfolioPage.seo`                                    | Preserves localized title and description                                       |
| `cv.html`, `portfolio.html`           | Static download paths                                  | Not converted into editable Sanity documents in this pass                       |

## Localization

Localized fields are arrays of `{language, value}` objects with stable locale keys (`en`, `fa`).
Rich text values are direct Markdown-to-Portable-Text conversions. Missing translations remain
missing and are reported; English text is never silently copied into Persian fields.

## Asset policy

- Upload original referenced files only.
- Skip `images/optimized` derivatives.
- Reuse identical source paths on reruns.
- Keep localized alt text alongside each Sanity image.
- Report missing Persian alt text for editorial cleanup.

## Validation gates

- Source and transformed counts match.
- Every production `sourceKey` is unique.
- Every referenced local image exists.
- Portable Text is an array with stable keys.
- Arrays have unique `_key` values.
- Missing locales are warnings; broken assets, duplicate identities, or malformed Portable Text are
  errors.
