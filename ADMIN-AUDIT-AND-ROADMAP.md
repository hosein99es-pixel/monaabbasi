# Admin CMS — audit, gap analysis & roadmap (Step 1, no code)

## Context (filled in)

- **Tech stack:** Static, file-based site. Hand-authored `index.html` + `assets/css|js`,
  compiled by a Node ESM build (`scripts/build.mjs`, using `jsdom` + `marked`) into
  `dist/`. **No server, no database, no React app.** Hosted on **Netlify**.
- **CMS:** **Decap CMS** (loaded from unpkg at `/admin/`) with **DecapBridge** for
  login and **GitHub** as the content store. Editing a field → commit to the repo →
  Netlify rebuild → live site updates. Local preview via `npx decap-server`.
- **Content store:** `content/*.json` — `home.json` (hero), `sections.json` (all
  section labels/headings/intros), `awards.json`, `teaching.json` (lists),
  `extra-sections.json` (editor-added sections). The build injects these into the
  page and regenerates list/section markup.
- **Main site:** one-page **bilingual (English + Persian)** portfolio, generated as
  two no-JS routes (`/en/`, `/fa/`). Ten "act" sections (Profile, Resume, Theatre,
  Film & TV, Awards, Teaching, Upcoming, Gallery, Downloads, Contact) plus
  editor-added custom sections, plus downloadable CV (2pp) and portfolio (21pp).

**Architectural ceiling to state up front:** Decap is a *git-based file CMS*. It is
excellent for structured content + versioning + multilingual, but several checklist
items (true Webflow-style click-to-edit on a live preview, field-level role
permissions, scheduled publishing, a redirect/form/submissions backend) are **not
native** to it. Those require either heavy custom widgets, a different CMS
(Sveltia for theming/preview; Sanity/Strapi for RBAC + scheduling + API — both a
larger migration to a hosted/DB model), or external services. This roadmap is
explicit about which gaps fit the current stack and which imply a platform decision.

---

## 1. Current admin inventory

- **Content types:** Home/hero (name, intro, headshot + focal point), Section text
  (labels/headings/intros for 7 sections), Awards (list), Teaching (list), Custom
  sections (add/remove). All **bilingual** (EN/FA fields).
- **Editing capabilities:** structured fields; **inline markdown** (bold/italic/link)
  on prose; **image upload** via Decap media; **headshot focal-point** inputs;
  add/remove/reorder list items; add whole new sections that also generate nav links.
- **Publishing flow:** **Editorial workflow** (draft → in review → ready) with
  per-change **deploy previews**; publish = merge → Netlify rebuild. Draft is fully
  isolated from production (separate branch/PR), satisfying the "never break the live
  site mid-edit" rule.
- **User/permission model:** **DecapBridge** invited collaborators; two roles
  (collaborator, admin). No per-section / per-field permissions.
- **Media handling:** Decap media library (browse + upload to `images/uploads`,
  committed to git). No folders, crop, tags, variants, or enforced alt text.
- **UX state:** Persian admin UI (`locale: fa`); light site-flavoured theme; plain
  bilingual field labels; Decap's built-in autosave, unsaved-changes warning, delete
  confirmation, and toasts.

## 2. Admin ↔ site structure map (mismatches)

| Site section | Editable today? | Mismatch / note |
|---|---|---|
| Profile / hero | ✅ name, intro, headshot+focus | — |
| Resume (education, skills) | ❌ | nested lists not modelled yet |
| Theatre (productions) | ❌ | cards + detail pop-up; not in CMS (Stage B) |
| Film & TV | ❌ | same as Theatre (Stage B) |
| Awards | ✅ list | — |
| Teaching | ✅ list | — |
| Upcoming | ✅ text | single fixed image not yet swappable |
| Gallery | ❌ photos | slideshow-coupled (Stage B) |
| Downloads (CV/portfolio) | ❌ | docs not data-driven yet (Stage C) |
| Contact (social links) | ❌ | hardcoded mailto/WhatsApp |
| Custom sections | ✅ add/remove | generic layout only |
| Global (nav, header, footer, SEO, theme) | ❌ | not modelled |

Main gap: the admin currently mirrors *some* sections; Resume, Theatre/Film,
Gallery, Downloads, Contact, and all **global** concerns aren't yet editable, and
there's no 1:1 visual sitemap.

---

## 3. Gap analysis vs. target checklist

Legend: ✅ present · 🟡 partial · ❌ missing

| Capability | Status | Notes |
|---|---|---|
| Block editing: add/remove/reorder/duplicate; reusable components | 🟡 | Add/remove/reorder via list widgets (drag in Decap). **Duplicate** and **reusable shared components** missing. Bespoke sections not block-editable. |
| Structured fields + rich text; repeatable collections | ✅ | JSON fields, markdown, lists. |
| Live WYSIWYG preview matching site + responsive toggle + click-to-edit on preview | ❌ | Decap has a generic preview pane, not styled like the site; no responsive toggle mirroring the site; **no click-to-edit on the real rendered page** (the headline Webflow-style gap). |
| Draft/published, explicit publish, scheduled publish, autosave, unsaved warning | 🟡 | Draft/review/publish ✅, autosave ✅, unsaved warning ✅, explicit publish ✅. **Scheduled publishing ❌** (Decap has no native scheduler). |
| Version history + diff + one-click rollback; audit log | 🟡 | Full git history = versions + who/when + revert. **No in-CMS diff/rollback UI**; audit is via GitHub/DecapBridge, not in-admin. |
| Media library: bulk upload, folders/tags, crop, focal point, responsive variants, required alt | 🟡 | Upload ✅, focal point ✅ (custom, hero). **Folders/tags/crop/variants/required-alt ❌.** |
| Roles & permissions (4 roles, per-section, publish control, approval) | 🟡 | DecapBridge roles (2) + approval via editorial workflow. **Granular per-section/field RBAC ❌.** |
| SEO/meta per page (title, desc, OG, slug, canonical, noindex, sitemap, snippet preview, redirects) | 🟡 | Canonical/hreflang/OG are auto-generated by the build but **not editable**; **no per-route SEO fields, sitemap.xml, snippet preview, or redirect manager.** |
| Navigation/menu editor, page tree, global header/footer | 🟡 | Nav auto-generates from sections. **No explicit menu editor, page tree, or editable header/footer.** |
| Global settings/theming (logo, colors, fonts, contact, social) | ❌ | All hardcoded. |
| Localization (multi-language) | ✅ | Bilingual EN/FA is core; both routes generated; strong point. |
| Form builder + submissions inbox | ❌ | Static site; needs an external service (Netlify Forms / Formspree). |
| Global search, filters, bulk actions | 🟡 | Decap in-collection search; bulk actions limited. Low relevance at current size. |
| Webhooks/API for content changes | 🟡 | Git/Netlify deploy hooks exist; no content API (static by design). |
| Admin IA mirrors site 1:1 + visual sitemap linking to edit | 🟡 | Collections ≈ sections; **no visual sitemap dashboard.** |

UX requirements: confirmations ✅, toasts ✅, autosave ✅, plain labels/Persian ✅,
responsive admin 🟡 (Decap is mostly responsive), guardrails 🟡 (form-based editing
inherently prevents layout breakage), **click-to-edit on live preview ❌**, undo/redo
🟡 (per-field), contextual tooltips 🟡 (some hints added), WCAG 🟡 (Decap's own UI).

---

## 4. Prioritized roadmap (impact vs. effort)

Ordered per your priorities (publishing safety → draft/preview → core editing UX),
and scoped to what fits the current Decap + build architecture unless flagged.

### Tier 1 — high impact, fits the stack, low/moderate effort
1. **Finish content coverage so the admin mirrors the site** (Stage B + C already
   queued): Gallery photos, Theatre/Film productions (+ detail pop-up), then
   auto-generate the CV/portfolio. *Impact: high (closes the biggest IA gap). Effort: M.*
2. **Site-matching preview templates in Decap** — register preview components +
   `registerPreviewStyle` so the editor preview looks like the real site, with a
   desktop/tablet/mobile width toggle. Closest WYSIWYG achievable in Decap.
   *Impact: high (your #1 UX ask). Effort: M.*
3. **SEO/meta + sitemap + redirects** — per-route editable title/description/OG image/
   noindex (build-injected), generated `sitemap.xml`, and a Netlify `_redirects`
   manager surfaced as a small CMS list. *Impact: high. Effort: M.*
4. **Global settings collection** — contact email, social links, logo, and
   header/footer text become editable + build-injected. *Impact: high. Effort: S.*
5. **Media hygiene** — make alt text required on image fields, and emit responsive
   image variants at build (you already keep an `images/optimized/` set).
   *Impact: med. Effort: S–M.*

### Tier 2 — moderate effort, real value
6. **Visual sitemap dashboard** — a custom `/admin` landing page that mirrors the
   site section-by-section with "edit this" deep links. *Impact: med-high (non-tech UX). Effort: M.*
7. **Reusable blocks + duplicate** — model shared/duplicatable section blocks.
   *Impact: med. Effort: M.*
8. **Menu/page-tree editor** — explicit control of nav order/labels (today it's
   derived). *Impact: med. Effort: M.*
9. **History/rollback UX** — surface git history / GitHub compare links in-admin for
   diff + one-click revert (true in-CMS diff is limited in Decap). *Impact: med. Effort: M.*

### Tier 3 — needs a platform decision or external service (flagged, not assumed)
10. **True click-to-edit on a live preview**, **scheduled publishing**, **granular
    field-level RBAC**, **media crop/folders**, **content API/webhooks** — these are
    beyond Decap's native scope. Options: **Sveltia CMS** (drop-in, better preview/
    theming, some of these), or migrate to **Sanity/Strapi** (full structured CMS with
    RBAC, scheduling, API — but a hosted/DB model and a larger, migrated build).
    *Impact: high but strategic. Effort: L. Decision required before building.*
11. **Form builder + submissions inbox** — add via **Netlify Forms** or Formspree
    (the site is static). *Impact: med. Effort: S–M, external.*

### Guardrails carried through every change set
- Draft stays isolated (editorial workflow / PR previews); never publish mid-edit.
- Content is plain JSON in git → every change reversible; no destructive migrations.
- Defaults always equal current content → public output stays byte-identical until an
  editor changes something (verified pattern already in use).
- Tests focus on publishing, versioning, and any permissions logic.

---

## Recommendation & what I need from you

Start with **Tier 1** in order (it also completes the Stage B/C work already queued),
since it closes the largest gaps without any platform change and keeps the live site
safe. Tier 3's headline items (Webflow-style live click-to-edit, scheduling, field
RBAC) need your call on whether to **stay on Decap** (accept those limits / add
Sveltia) or **migrate to a structured CMS** (Sanity/Strapi) — that's a fork worth
deciding before I build toward it.

**Awaiting your approval / priority pick before writing any feature code.**
