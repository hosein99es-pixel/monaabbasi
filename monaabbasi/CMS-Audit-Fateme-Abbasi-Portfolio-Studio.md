# CMS Usability Audit — Fateme Abbasi Portfolio Studio

**Target:** `http://localhost:3333` (Sanity Studio + custom "Website Map" dashboard tool)
**Scope:** CMS / Studio only. The public site (`localhost:3000`) was treated as supporting evidence only.
**Date:** 25 June 2026
**Audience:** Developer building/maintaining the CMS
**Benchmark:** WordPress-class expectations for a non-technical editor managing a single portfolio site
**Method:** Live walkthrough of the running Studio. Surfaces reviewed: Website Map dashboard, section "Review section" modal, Structure desk, Portfolio homepage editor, Productions list + production editor, rich text/markdown editor, image hotspot/crop editor, Vision, Live Preview, Releases, draft/publish + validation states.

---

## 1. Executive summary

The product has a genuinely promising idea layered on top of Sanity: a **"Website Map" dashboard** that reframes content as the audience sees it (Profile, Resume, Theatre, Film & TV, Gallery, …) with friendly per-section "Review section" modals, a readiness meter, EN/FA bilingual framing, and a strong **hotspot/crop tool** with live aspect-ratio previews. When the editor stays inside this curated layer, the experience is closer to a premium editorial CMS than to a raw dev tool.

The problem is that the curated layer is a thin veneer over **unmodified Sanity Studio chrome**, and the seams show everywhere. The moment an editor clicks "Open full editor," they are dropped into Sanity's four-column desk structure, with developer surfaces sitting right next to their content: a **GROQ query playground (Vision)**, a **paywalled enterprise feature (Releases → "Talk to sales")**, a **broken Live Preview that prints a raw environment-variable error**, raw **slug fields**, a **`migration-test` dataset name** bleeding into friendly copy, and the underlying vendor name ("the full **Sanity** editor") breaking the white-label illusion. Validation tells the editor something is wrong with a red border but no message. There is a visible **CSS overlap bug** in the rich-text editor.

Net assessment against WordPress: **not yet competitive for a non-technical editor.** WordPress's core promise is that a non-technical person can edit, preview, and publish safely without ever meeting the machinery. This Studio repeatedly exposes the machinery. None of the gaps are deep — they are mostly configuration, role-gating, copy, and a handful of UI fixes — but until the dev surfaces are hidden and Live Preview works, an editor will hit a wall on day one.

**Headline blockers (fix before anyone hands this to an editor):**

1. Live Preview is broken and shows a raw token/error message (Critical).
2. Vision (GROQ playground) is exposed in the primary navigation (Critical).
3. Releases shows an enterprise paywall / "Talk to sales" in the primary navigation (High).
4. Validation shows no human-readable message (High).
5. Technical/migration fields and naming leak into the editor (slug, dataset name, `#profile` target, "Sanity") (High).

---

## 2. How findings are scored

| Severity | Meaning |
|---|---|
| **Critical** | Blocks a core task or destroys trust; an editor cannot safely complete a primary workflow. |
| **High** | Major friction, confusion, or risk of error/data loss; an editor will likely get stuck or scared. |
| **Medium** | Noticeable friction or inconsistency; slows editors and erodes confidence. |
| **Low** | Minor friction or unclear copy; easy to live with but worth fixing. |
| **Polish** | Cosmetic/consistency refinement that raises perceived quality. |

Each finding lists: location/flow · what the editor sees · why it hurts · what a WordPress-class CMS does better · recommended fix.

---

## 3. Findings

### CRITICAL

#### C1 — Live Preview is broken and exposes a raw developer error
- **Location:** Top nav → **Live preview** (`/presentation`).
- **What the editor sees:** A blank preview pane with the message: *"Missing SANITY_API_READ_TOKEN. Add a Viewer token to web/.env.local, restart next dev, then reopen Sanity Presentation."* plus an editable URL bar pointing at `localhost:3000/api/draft-mode/enable`.
- **Why it hurts:** Preview is the single most trust-building feature in a CMS — it answers "what will the public see?" Here it not only fails, it fails by instructing a non-technical editor to edit `.env.local` and "restart next dev." That is intimidating, useless to them, and signals the product is unfinished.
- **WordPress equivalent:** "Preview" always renders the post in the real theme in a new tab/inline frame; it never asks the user to configure tokens.
- **Recommended fix:** Provision the read token in the environment so Presentation works; render draft + published side-by-side. Wrap any preview failure in a friendly fallback ("Preview is temporarily unavailable — your content is safe") and log the technical detail to the console only, never to the editor.

#### C2 — Vision (GROQ query playground) is exposed in the primary navigation
- **Location:** Top nav → **Vision** (`/vision`).
- **What the editor sees:** A query IDE with **Dataset (`migration-test`)**, **API version**, **Custom API version (`v2026-06-22`)**, **Perspective (`Pinned release`)**, a GROQ query editor, params (`{}`), a result pane, and "Saved queries."
- **Why it hurts:** This is a pure developer/debugging tool. To a non-technical editor it is meaningless at best and alarming at worst; it also exposes dataset internals and an attack-surface-y query console. It makes the whole product read as a dev tool, not a CMS.
- **WordPress equivalent:** There is no SQL console in wp-admin for editors. Debug tooling lives behind developer plugins/capabilities.
- **Recommended fix:** Remove the Vision tool from the editor workspace entirely, or gate it to an `administrator`/developer role via Studio tool/role configuration. Default editor build should not include it.

---

### HIGH

#### H1 — "Releases" shows an enterprise paywall ("Upgrade to unlock / Talk to sales") in the primary nav
- **Location:** Top nav → **Releases** (`/releases`).
- **What the editor sees:** A month calendar and a marketing panel: *"Upgrade to unlock — Content Releases … Talk to sales / Learn more."*
- **Why it hurts:** A primary navigation tab leads to a sales wall the editor can never use. It is dead weight, looks broken/locked, and confuses the mental model of where to publish. It also implies scheduled publishing exists when it does not.
- **WordPress equivalent:** Scheduling ("Publish → Immediately → set date") is built into core, free, and lives next to the publish button — not behind a separate locked tab.
- **Recommended fix:** Hide the Releases tool unless the plan actually includes it. If scheduled publishing is a requirement, implement a lightweight scheduled-publish field/flow instead of surfacing the locked upsell.

#### H2 — Validation shows no human-readable message
- **Location:** Any required field, e.g. Portfolio homepage → 01·Profile → **Name** item → **Text** (reproduced by clearing the value).
- **What the editor sees:** The array item relabels to **"#1 Untitled"**, the Text field gets a red/pink border, and a small red icon appears beside the "Text" label. No inline sentence explaining the rule or how to fix it (the message is only reachable by hovering the icon).
- **Why it hurts:** Editors must guess what is wrong. "Untitled" is developer phrasing. Silent validation is the classic cause of "why can't I publish?" support tickets and of editors abandoning edits.
- **WordPress / premium CMS equivalent:** Inline, plain-language errors ("Name is required") directly under the field, plus a publish-blocking summary listing every problem with jump links.
- **Recommended fix:** Always render the validation message inline beneath the field. Use human copy ("Add a name in English"), and add a pre-publish checklist that lists all blocking issues with "fix this" links. Don't relabel items to "Untitled" — fall back to the field name or a placeholder like "Name (not filled in yet)."

#### H3 — Technical / migration fields and naming leak into the editor surface
- **Location:** Multiple — Production editor **Slug** (`man-az-to-bidar` + "Generate"); dashboard stat card **"Dataset · migration-test"**; section modal copy *"Status is read from the current migration-test dataset"* and *"Public website target: #profile"*; editor footer/labels referencing the underlying product.
- **What the editor sees:** Database/URL/infra concepts (slug, dataset, anchor targets) presented as if they were content fields.
- **Why it hurts:** The product's own promise on the dashboard is *"No technical fields, no guessing."* Slugs, dataset names, and anchor IDs directly contradict that. `migration-test` in particular is a build artifact that should never be visible — it makes the site feel like a staging experiment.
- **WordPress equivalent:** The permalink/slug is auto-generated and tucked under an "Edit" affordance; editors rarely touch it. There is no "dataset" concept surfaced anywhere.
- **Recommended fix:** Auto-generate slugs and hide the field (or collapse it under an "Advanced/Web address" disclosure for power users). Remove `migration-test` from all editor-facing copy — show the site name instead, or nothing. Replace `#profile`-style anchors with plain language ("Appears in: Homepage hero").

#### H4 — "Open full editor" drops the editor into raw four-column Sanity desk chrome
- **Location:** Section modal → **Open full editor** → `/structure/...`.
- **What the editor sees:** After the polished modal, a dense Sanity desk: left rail (Portfolio homepage / Productions / Journal), nested columns, breadcrumbs, a schema title ("Portfolio page") that differs from the friendly label ("Portfolio homepage"), and a narrow document pane in the 4th column.
- **Why it hurts:** The two layers feel like two different products. The curated dashboard sets an expectation the desk immediately breaks. The cramped nested-column layout is the opposite of WordPress's single focused editing canvas.
- **WordPress equivalent:** One full-width editing canvas per piece of content; no spatial puzzle of expanding columns.
- **Recommended fix:** Deep-link "Open full editor" into a **single focused document view** (full-width, not the nested desk), pre-scrolled to the relevant section tab. Hide or de-emphasize the desk's left structural rail for editor roles. Make the friendly label and the schema title agree.

#### H5 — "Name" (and "Introduction") modeled as reorderable arrays of localized items
- **Location:** Portfolio homepage → 01·Profile → **Name** ("Fateme Abbasi / en", "فاطمه عباسی / fa", "+ Add item", drag-to-reorder); same pattern for **Introduction** rich text.
- **What the editor sees:** A person's name presented as a list they can reorder, add to, or delete from, each row tagged `en`/`fa`.
- **Why it hurts:** It's an unsafe model for a singular concept. An editor can add a third "name," delete the English one, or reorder so Farsi renders first — silently breaking the public hero. It also conflates "translation" with "list item."
- **WordPress / localized-CMS equivalent:** Two clearly labeled fields ("Name (English)", "Name (Farsi / فارسی)"), not an open-ended array.
- **Recommended fix:** Model localized singletons as a fixed object with one field per language (or a proper i18n plugin), not an array. Reserve arrays for genuinely repeatable content (roles, credits, gallery images).

#### H6 — Rich-text "Markdown" mode is a bare textarea; mode-switching appears to dirty the draft
- **Location:** Any rich text field → **Markdown** toggle.
- **What the editor sees:** Plain text with no syntax highlighting, no live preview, no formatting affordances. After toggling Visual↔Markdown the footer changed to "Edited … · Unpublished changes" without the editor knowingly editing.
- **Why it hurts:** Markdown is itself a developer concept for many editors; offering it without preview invites broken formatting. Silently marking the document dirty on a view toggle erodes trust in the draft/publish state ("did I change something?").
- **WordPress equivalent:** The block editor is WYSIWYG by default; the "Code editor" is opt-in and clearly separate, and merely viewing it doesn't create a revision.
- **Recommended fix:** Default to Visual; consider hiding Markdown for non-technical editors, or give it a split live preview. Ensure switching modes is a no-op that does not mutate the document or set the dirty flag.

---

### MEDIUM

#### M1 — Rich-text editor has a visible CSS overlap bug
- **Location:** Rich text modal → "Text content" / "Choose how you want to write" header.
- **What the editor sees:** The bold heading *"Choose how you want to write"* is rendered overlapping the helper line *"Visual editing supports Markdown shortcuts…"* — the two lines sit on top of each other.
- **Why it hurts:** A literal rendering bug in the most-used editor signals low polish and makes the helper text unreadable.
- **WordPress equivalent:** Editor chrome is pixel-stable.
- **Recommended fix:** Fix the layout/spacing (the description block appears to collide with the panel header). Add a visual regression check on the rich-text component.

#### M2 — Redundant, overlapping helper copy in the rich-text editor
- **Location:** Rich text modal.
- **What the editor sees:** Two near-identical instructions: *"Use the visual editor or switch to Markdown. Markdown shortcuts work as you type."* and *"Visual editing supports Markdown shortcuts. Markdown mode edits the text source."*
- **Why it hurts:** Duplicated guidance adds noise and reading load for no benefit.
- **Recommended fix:** Keep one short line. Lead with the safe default ("Type normally — formatting tools are in the toolbar").

#### M3 — Raw, inconsistent values surface in the Productions list
- **Location:** Productions → All productions list subtitles.
- **What the editor sees:** `2024 · theatre · Actress`, and for film items `short Film · Short film` — lowercase enum values and inconsistent/duplicated casing.
- **Why it hurts:** Looks unfinished and exposes raw stored values. Inconsistent casing reads as a bug.
- **WordPress equivalent:** Taxonomy terms display with controlled, human labels.
- **Recommended fix:** Render display labels (Title Case: "Theatre", "Short Film") via the list preview config rather than raw field values; de-duplicate the medium/type so the same concept isn't printed twice.

#### M4 — Unexplained status dot in list rows
- **Location:** Productions list (and section cards) — a colored dot at the right of each row.
- **What the editor sees:** A dot with no legend or tooltip.
- **Why it hurts:** Status (draft vs published vs has-changes) is critical information shown without a key, so it carries no meaning to the editor.
- **WordPress equivalent:** Explicit "Draft / Published / Scheduled" text labels in the posts list.
- **Recommended fix:** Replace or annotate the dot with a labeled status chip ("Draft", "Published", "Unpublished changes") and a tooltip.

#### M5 — Two competing status vocabularies ("Drafts" perspective vs "Published/Draft" pills vs "Unpublished changes")
- **Location:** Top-right **Drafts** perspective dropdown; editor header **● Published ● Draft** pills; footer **"Unpublished changes."**
- **What the editor sees:** Three different ways of expressing publish state in three places, none cross-referenced.
- **Why it hurts:** Editors can't form a single reliable mental model of "is my change live?" The "Drafts" perspective switcher is itself a Sanity power-user concept.
- **WordPress equivalent:** One status, one place (the Publish panel: Draft → Published, with "Pending changes" when editing a published post).
- **Recommended fix:** Consolidate to one prominent status indicator near the primary action. Hide or simplify the perspective switcher for editor roles. Use consistent wording everywhere.

#### M6 — No alt text in the image editor (accessibility + SEO gap)
- **Location:** Image field → **Edit hotspot and crop** modal (and image fields generally).
- **What the editor sees:** Crop + hotspot + aspect previews, but no field for alternative text or caption.
- **Why it hurts:** Alt text is essential for accessibility and image SEO. Its absence in the primary image flow means images ship without it.
- **WordPress equivalent:** The media modal prompts for Alt Text, Caption, Title, and Description on every image.
- **Recommended fix:** Add a required (or strongly encouraged) **Alt text** field and optional caption on every image field, with bilingual support to match EN/FA.

#### M7 — Publishing affordance is unclear from the curated layer
- **Location:** Dashboard / section modal → editor footer.
- **What the editor sees:** "Open website," "View on website," "Open on website," "Unpublished changes" — but the actual **Publish** action lives in the desk footer and isn't surfaced in the friendly layer.
- **Why it hurts:** The flow from "I edited" to "it's live" is not obvious; "Open website" is easily confused with "publish."
- **WordPress equivalent:** A single, unmistakable blue **Publish/Update** button always in the same place.
- **Recommended fix:** Surface an explicit, consistently placed **Publish / Update** primary button (with a confirmation summary of what will change), distinct from "View site."

#### M8 — "Vision," "Structure," "Releases," "Perspective" are developer nomenclature
- **Location:** Primary nav + perspective switcher.
- **What the editor sees:** Tab labels that describe the tool's architecture, not the editor's task.
- **Why it hurts:** Labels should name what the editor wants to do ("Edit website," "Preview," "Publishing"), not internal tool names.
- **Recommended fix:** Rename/relabel the editor workspace tabs in human terms and drop the ones editors shouldn't see (see C2/H1).

---

### LOW

#### L1 — Schema title vs friendly label mismatch
- **Location:** Editor shows breadcrumb "Portfolio homepage" but H1 "Portfolio page." **Fix:** Make titles consistent and human.

#### L2 — "Used on 10 pages" / "Used on one page" reference panel is jargon-ish and collapsed by default
- **Location:** Document header. It exposes graph/reference internals. **Fix:** Reframe as "Where this appears on your site" with readable destinations, or hide for editors.

#### L3 — Dashboard "Website readiness 100%" lacks definition
- **Location:** Website Map hero. A readiness meter with no explanation of what 100% means or what would lower it. **Fix:** Tooltip/definition ("All 11 sections have required content"), and link each incomplete section to its fix.

#### L4 — "Status is read from the current dataset" / "current migration-test dataset" microcopy
- **Location:** Dashboard + section modals. Editor-facing copy referencing datasets. **Fix:** Remove; editors don't have a dataset concept.

#### L5 — Mixed language direction polish (LTR chrome around RTL Farsi content)
- **Location:** Throughout. Farsi values render RTL inside LTR rows; generally OK but spacing/alignment of `fa` tags and mixed strings ("short Film · Short film") needs attention. **Fix:** Audit bidi handling so EN/FA rows align cleanly.

#### L6 — "Edit homepage" vs "Open website" vs section cards — three entry points with overlapping meaning
- **Location:** Dashboard hero. **Fix:** Clarify primary vs secondary actions; make "Edit homepage" visually primary and "Open website" clearly a secondary/outbound link.

---

### POLISH

- **P1 — Iconography consistency:** Section icons (home, list, play, grid, star…) vary in weight/style; unify on one icon set and grid.
- **P2 — Empty/long-title handling:** "Ama… Na… Agar… Shayad… Hala… B…" truncates awkwardly in the list; add tooltips and a cleaner truncation rule.
- **P3 — Tooltip coverage:** Drag handles show "Drag to re-order" but status dots, the readiness meter, and "Generate" lack tooltips; add them consistently.
- **P4 — Button hierarchy in modals:** "Stay on dashboard / View on website / Open full editor" are visually similar weights; make the intended primary clearly dominant.
- **P5 — Loading/skeleton states:** Dashboard and lists pop in; add skeletons so the product feels deliberate.
- **P6 — Focus/keyboard states:** Verify visible focus rings, Escape-to-close on every modal, and tab order through the field tabs (couldn't confirm robust keyboard support in walkthrough — needs a dedicated pass).
- **P7 — The "What's new — Content Agent is generally available" toast** lingers bottom-left and overlaps content; make it dismissible and out of the editing area.

---

## 4. Top 10 UX problems (ranked)

1. **Live Preview is broken and shows a raw env-var error** (C1) — destroys the most important trust feature.
2. **GROQ query playground (Vision) in the editor's main nav** (C2) — a dev console handed to a non-technical user.
3. **Releases tab is an enterprise "Talk to sales" paywall** (H1) — dead, confusing primary-nav destination.
4. **Validation has no human-readable message** (H2) — editors can't tell what's wrong or how to publish.
5. **Technical/migration fields leak** — slug, `migration-test` dataset, `#profile` targets, "Sanity" name (H3).
6. **"Open full editor" dumps editors into raw four-column desk chrome** (H4) — two products in one.
7. **Name/Introduction modeled as reorderable arrays** (H5) — easy to silently break the hero.
8. **Publish path is unclear; multiple competing status vocabularies** (M5, M7) — "is it live?" is unanswerable.
9. **Markdown mode is a raw textarea and view-toggling dirties the draft** (H6, M6-adjacent) — formatting risk + phantom edits.
10. **Visible CSS overlap bug + redundant copy in the core rich-text editor** (M1, M2) — signals low polish where editors spend most time.

## 5. Top 10 missing CMS features

1. **Working, trustworthy preview** (draft + published, per-device) — currently broken.
2. **Pre-publish checklist / publish confirmation** summarizing what will go live and what's blocking it.
3. **Scheduled publishing** without an enterprise paywall.
4. **Revision history / undo & restore** with the ability to roll a page back (WordPress has full revisions).
5. **Alt text & captions on images** (accessibility/SEO).
6. **Role-based access** so editors never see Vision/Releases/desk internals, and an admin tier that can.
7. **In-context inline editing** (click text on a preview to edit it) — the "edit as the audience sees it" promise, delivered.
8. **Media library** — a single place to browse, reuse, search, and replace images (currently image fields are per-document only).
9. **Global search across content** that an editor understands (find a production, a credit, a photo).
10. **Autosave + clear save/published state** with conflict handling, plus an activity log ("you published Profile 3 min ago").

## 6. Top 10 design polish improvements

1. Fix the rich-text header overlap and collapse the duplicated helper copy (M1, M2).
2. Replace status dots with labeled status chips + tooltips everywhere (M4).
3. Unify publish-state language into one indicator near one Publish button (M5, M7).
4. Render human Title-Case display labels in lists; kill raw enum casing/dupes (M3).
5. Add skeleton/loading states for dashboard, lists, and editor (P5).
6. Establish one icon system and consistent weights (P1).
7. Make modal button hierarchy unambiguous (primary vs secondary) (P4).
8. Add visible focus rings, guaranteed Escape-to-close, and a verified tab order (P6).
9. Tame the "What's new" toast so it never overlaps the editing canvas (P7).
10. Clean bidi/RTL alignment so EN/FA rows look intentional (L5).

---

## 7. Recommendations

### 7.1 Recommended dashboard structure
Keep the Website Map concept — it's the product's best asset — but make it the *only* home and strip dev surfaces:

- **Primary nav (editor role):** `Edit website` (the section map) · `Preview` · `Media` · `Publishing`. Remove `Structure`, `Vision`, `Releases` from the editor build; move them to an `Admin/Developer` workspace gated by role.
- **Hero:** site identity, EN/FA toggle, one primary action ("Edit homepage"), one clearly-secondary outbound "View live site."
- **Readiness:** keep the meter but define it (tooltip + clickable list of what's incomplete, each deep-linking to the fix).
- **Section grid:** keep the numbered cards (Profile…Contact) with labeled status chips ("Ready / Needs attention / Draft"), a one-line "where this appears," and a single "Edit" action. Drop dataset/anchor jargon.
- **At-a-glance counts:** Productions, Gallery photos — keep; remove the "Dataset · migration-test" card entirely.

### 7.2 Recommended editor workflow
1. Editor opens the **section card** → concise "Review section" sheet (already good) → **Edit**.
2. "Edit" opens a **single focused, full-width document view** (not the nested desk), pre-scrolled to the right section, with the friendly numbered tabs retained.
3. Fields are **WYSIWYG by default**; localization is **fixed EN/FA fields**, not arrays; technical fields (slug) are auto-generated and hidden under "Advanced."
4. **Inline, plain-language validation** under each field; a persistent "X items need attention" banner with jump links.
5. **Autosave to draft**, with one clear status indicator ("Draft – not yet published" / "Published" / "Unpublished changes").
6. **Preview** is one click and always works, showing the draft in the real theme, desktop+mobile.

### 7.3 Recommended publishing workflow
1. One unmistakable **Publish / Update** button, always in the same place.
2. Clicking it opens a **confirmation summary**: which sections/pages change, EN+FA completeness, and any blocking validation (with fixes). No surprises.
3. After publish: success toast + "View live" + timestamped activity log entry.
4. **Scheduling** offered inline ("Publish now / Schedule for…"), not behind a paywalled tab.
5. **Unpublish/rollback** available from revision history.
6. Never let a view toggle or navigation mark content dirty; "Unpublished changes" must mean real changes.

### 7.4 Recommended media / image workflow
1. A real **Media library**: browse, search, filter, reuse, and replace images globally.
2. Every image flow includes **Alt text (EN/FA)** and optional caption, with a gentle required/nudge state.
3. Keep the **hotspot + crop with aspect previews** — it's a strength; add a visible "this is how it crops on the live site" label tied to real breakpoints.
4. Upload UX: drag-and-drop, progress, automatic format/size optimization, and a warning for low-resolution images.
5. Show where each asset is used (reverse references) in human terms before allowing delete.

---

## 8. Phased roadmap

### Phase 1 — Quick wins (days; unblock an editor)
- **Fix Live Preview** (provision token) or hide it behind a friendly fallback (C1).
- **Remove Vision and Releases** from the editor workspace / gate behind admin role (C2, H1).
- **Show inline validation messages**; stop relabeling items to "Untitled" (H2).
- **Strip migration/tech naming** from editor copy: `migration-test`, `#profile`, "Sanity," visible slug → auto-generate/hide (H3, L4).
- **Fix the rich-text overlap bug** and de-duplicate helper copy (M1, M2).
- **Label the status dots** and align publish-state wording (M4, M5).
- **Tame the "What's new" toast** (P7).

### Phase 2 — Next iteration (weeks; make it feel like a product)
- **Focused full-width document editing** from the section cards; hide the raw desk for editors (H4).
- **Remodel localized singletons** (Name/Introduction) as fixed EN/FA fields (H5).
- **One clear Publish button + pre-publish confirmation summary** (M7, publishing workflow).
- **Alt text/captions on all images** (M6); start a shared **Media library**.
- **WYSIWYG-by-default rich text**; hide or split-preview Markdown; ensure toggles don't dirty drafts (H6).
- **Human display labels** in all lists; loading skeletons; icon + button-hierarchy cleanup (M3, P1, P4, P5).
- **Accessibility pass:** focus states, Escape-to-close, keyboard nav (P6).

### Phase 3 — Product-ready milestone (the WordPress/Webflow bar)
- **Inline/visual editing** on a working live preview ("edit what the audience sees" — fully realized).
- **Revision history with rollback** and an **activity log**.
- **Scheduled publishing** built in (no paywall).
- **Role-based access** (editor vs admin/developer) with a clean editor-only build.
- **Global search**, reuse-aware media management, and bilingual completeness reporting baked into readiness.
- **Onboarding:** first-run tour of the section map, a sample edit, and a guided first publish.

---

## 9. What's already good (keep and build on)
- The **Website Map dashboard** framing (content as the audience experiences it) — a real differentiator.
- The **"Review section" modals** — clear purpose, "where this appears," and a guided handoff.
- The **hotspot + crop tool with live aspect-ratio previews** — better than many CMS image tools.
- **Numbered section tabs** that mirror the public site's structure.
- **First-class EN/FA bilingual** intent throughout.
- A **readiness meter** and per-section status — the right instinct, just needs definition and honesty.

The gap to WordPress is not vision — the vision is arguably nicer than WordPress. The gap is **finish and safety**: hide the machinery, make preview/publish/validation trustworthy, and stop the raw Sanity layer from leaking through. Phase 1 alone moves this from "dev tool" to "usable CMS."
