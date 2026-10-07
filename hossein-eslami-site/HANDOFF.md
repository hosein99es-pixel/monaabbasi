# Project Handoff: Mohammad Hossein Eslami portfolio site

_Last updated: 2026-10-07. Live at **https://hosseineslami.netlify.app**._

---

## 1. Repository & Git

| Item | Value |
|---|---|
| Repo (HTTPS) | https://github.com/hosein99es-pixel/monaabbasi.git |
| Repo (SSH) | `git@github.com:hosein99es-pixel/monaabbasi.git` |
| Visibility | **Public** |
| Default branch | `main` (one "Initial commit"; this site is **not** merged into it) |
| Working branch | **`claude/pensive-gates-e6ka7g`**, 12 commits ahead of `main`, 0 behind, in sync with origin |
| Uncommitted changes | None at handoff |
| Stashes | None |
| Open PRs | [hosein99es-pixel/monaabbasi#1](https://github.com/hosein99es-pixel/monaabbasi/pull/1) "Codex/cms remediation cutover" (`codex/cms-remediation-cutover`). **Unrelated**: it concerns the other site at the repo root (see below). No PR exists for this site's branch. |

**The repo holds two unrelated sites.**

- The repo root (`index.html`, `admin/`, `content/`, `cv.html`, `portfolio.html`, `ADMIN-PANEL-*.md`, `qa-*.png`, root `package.json`) is a **different person's site (Fateme Abbasi)**. Do not touch it.
- All work for this project lives in **`hossein-eslami-site/`**.

---

## 2. Project Overview & Tech Stack

### What it is

An English, **single-page, scroll-driven portfolio** for Mohammad Hossein Eslami, a theatre director, scene designer and producer based in Tehran. It's an Apple-product-page-style "scroll-telling" page:

- Visitors only scroll. There are no subpages and no modals.
- Pinned full-screen photos carry headlines placed inside empty parts of each picture.
- Sideways photo strips are driven by vertical scroll.
- The page ends with downloads for the CV and portfolio PDFs.

The design language is bright colours, glassmorphism, brutalism (hard ink borders and offset shadows) and Material 3 Expressive shapes (SVG clip-path "cookie", "clover", "sunny", plus arch and pill radii).

### Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js **22** (pinned on Netlify via `NODE_VERSION = "22"`; dev used v22.22.2, npm 10.9.7) |
| Framework | **Astro 7.3.5** (static output, `build.format: 'directory'`) |
| Markdown | Astro 7 default processor (Sätteri). No remark/rehype plugins. |
| Content | Astro content collections (`glob` loader, zod schema from `astro/zod`) |
| Images | `astro:assets` `<Picture>` / `getImage`, which outputs AVIF + WebP at several widths |
| Smooth scroll | `lenis` 1.3.26 |
| Font | `@fontsource-variable/roboto-flex` (wdth axis), self-hosted and preloaded |
| SEO | `@astrojs/sitemap`, JSON-LD (Person + ItemList of CreativeWork), canonical, OG image generated from the portrait |
| Package manager | **npm** (`package-lock.json` committed) |
| Hosting | **Netlify**, project `hosseineslami`, site id `e57136be-89aa-42a4-9160-89f1ddc74c37`, team `hosein99es` |

### Folder structure (`hossein-eslami-site/`)

```
astro.config.mjs        site URL = process.env.URL (Netlify) || 'https://hosseineslami.netlify.app'; sitemap (excludes /404)
netlify.toml            build "npm run build", publish "dist", NODE_VERSION 22
README.md               Owner-facing guide, in Persian: how to add works, swap photos and PDFs
HANDOFF.md              This file
public/
  _headers              Long cache for /_astro/*, 1 day for /downloads/*
  downloads/            CV (3 pp, A4) + Portfolio (32 pp) PDFs. Built outside this repo, see §5.
  favicon.svg, favicon.ico
src/
  consts.ts             NAME, TAGLINE, DESCRIPTION, EMAIL, LINKEDIN, HANDLE (hoseinizm) → INSTAGRAM/TELEGRAM, DOWNLOADS
  content.config.ts     Schemas for `works` and `writing` collections
  content/works/*.md    10 productions (frontmatter: order, year, venue, roles, credits, cover, gallery…; body = project text)
  content/writing/*.md  4 papers/theses
  assets/portrait.jpg, assets/works/<slug>/*.jpg   source photos (~11 MB)
  layouts/Base.astro    <head>, SEO, nav, skip link, idle "Scroll ↓" nudge, imports engine.ts
  pages/index.astro     THE page: hero mosaic → 6 featured chapters → "More work" bento → About → Writing → CV → Contact
  pages/404.astro       noindex, links back to /#sections
  pages/robots.txt.ts   robots.txt generated from Astro.site
  components/
    Frame.astro         Pinned full-bleed photo + headline lines (props: lines, box, size, tone, shade, focus/mfocus, info card)
    Story.astro         Project text column: facts, credits, shaped photos; label colour picked via lib/color.ts
    HGallery.astro      Sideways strip + footer (hint text, rail, "03 / 12" counter, ←/→ buttons)
    WordReveal.astro    Pinned sentence whose words light up on scroll
    Pic.astro           <Picture> wrapper (single size in PREVIEW builds)
    ShapeDefs.astro     SVG clipPath defs for Material shapes
  lib/  shapes.ts (clipPath generator) · schema.ts (JSON-LD Person) · color.ts (ink/white text on an accent, WCAG)
  scripts/engine.ts     Scroll engine (see below)
  styles/site.css       The whole design system (tokens, components, mobile, reduced-motion block)
```

### Key architectural patterns

- **Scroll engine (`src/scripts/engine.ts`).**
  - Every `[data-scene]` section gets a CSS var `--p` (0→1) for how far the page has scrolled through it.
  - All motion is pure CSS computed from `--p` (`clamp/calc`), so animation is scrubbed by the visitor's own scroll.
  - Sideways strips (`[data-hg]`) get `--dist`, and their section height is set to `100svh + dist`.
  - The engine also runs:
    - Lenis (`gestureOrientation: 'both'`)
    - the strip counter and buttons, and sideways touch-swipe mapping
    - the idle nudge
    - the mobile menu and in-page anchor scrolling
    - `.rv` reveal-on-enter and the chapter accent colour (`--nav-acc`)
  - Width-only resize re-measures, so the mobile address bar doesn't cause jank.
- **`prefers-reduced-motion`.** The engine skips `--p`. The CSS has a full static layout: no pinning, strips become native horizontal scrollers, all text is visible.
- **Featured vs. other works.**
  - The 6 chaptered works are hard-coded in `index.astro` (the `FEATURED` set).
  - Any other work in `content/works/` appears automatically in the "More work" bento grid, sorted by `order`.
- **Content rule.** All copy must be traceable to the owner's own sources (see §5).

---

## 3. Environment & Setup

### Prerequisites

- Node.js ≥ 22 and npm.
- Nothing else: no database, no Docker, no backend, no API keys.
- Optional, for QA: Playwright + Chromium (screenshots and behaviour tests), and Lighthouse via `npx lighthouse`.

### Environment variables

There is **no `.env` file and none is needed.**

| Var | Where | Purpose |
|---|---|---|
| `URL` | Set automatically by Netlify | Site origin for canonical, OG, sitemap and robots. Locally it falls back to `https://hosseineslami.netlify.app`. |
| `PUBLIC_PREVIEW=1` | Manual, optional | Lighter build (single image size, no OG/touch icon) used only to publish an in-chat preview. **Never set on Netlify.** |

### Commands

```bash
cd hossein-eslami-site
npm ci                    # install (or: npm install)
npm run dev               # dev server → http://localhost:4321
npm run build             # production build → dist/  (≈10–100 s; image processing dominates the first build)
npm run preview           # serve dist/ at http://localhost:4321
```

**Tests and linting.**

- There is **no test suite, linter or formatter configured.** `astro check` is not installed, and running it triggers an interactive install prompt that hangs non-interactive shells.
- Verification so far has been manual scripts, which are not in the repo:
  - Playwright, against `npm run preview`:
    - screenshots at 1024/1280/1366/1440/1536/1920 desktop widths, iPhone 13 and Pixel 7
    - reduced-motion mode
    - no horizontal overflow
    - nav and anchor jumps, deep link `/#contact`, mobile menu
    - strip counter and buttons, sideways swipe, idle nudge
  - Lighthouse, mobile and desktop.
- **Last results:** desktop 100/100/100/100; mobile 97 (performance) / 100 / 100 / 100.

### Deploying

The **live site is not connected to Git.** It's deployed by uploading the source.

- Through the Netlify MCP connector: `deploy-site` with the site id above returns an `npx @netlify/mcp … --proxy-path <one-time URL>` command.
- Run that command **from a clean copy of the site folder** (`git ls-files hossein-eslami-site`), so `dist/`, `dist-preview/` and `node_modules/` aren't zipped.
- Netlify then builds remotely with `netlify.toml`.

The simpler alternative, which the owner may do:

1. In Netlify, Site configuration → Build & deploy → Link repository.
2. Choose repo `hosein99es-pixel/monaabbasi`, branch `claude/pensive-gates-e6ka7g`, base directory `hossein-eslami-site`.
3. Every push then auto-deploys.

---

## 4. Current Status

### Done and verified (live)

- The one-page site: hero mosaic, then 6 chapters (Mephisto For Ever, In Front of City Theater, Maid to Marry, Asgardia, The Good Person of Szechwan, Mixed Sandwich), then More work, About, Writing, CV & Portfolio downloads, Contact.
- Copy:
  - A full fact-check against the owner's portfolio, CV and messages. Invented claims were removed and "fill in later" placeholders deleted.
  - A tone pass to sound less machine-written.
  - Tagline and About use **Director · Scene Designer · Producer**.
- Instagram and Telegram links (@hoseinizm) with icons in the footer and in JSON-LD `sameAs`.
- Sideways-strip UX fix:
  - hint text, live counter, ←/→ buttons and an end state
  - sideways trackpad and touch swipes move the strip
  - "Scroll ↓" nudge after 3.5 s idle
- Reduced-motion layout, accessibility (alt text, contrast), SEO (sitemap, robots, canonical, OG 1200×630, JSON-LD), 404 page, favicon (SVG + ICO).
- No horizontal overflow at any tested size.

### In progress or partial

- Nothing is mid-edit. All work is committed and deployed.
- The branch is **not merged to `main`**, and no PR was requested.

### Suggested next tasks (backlog; confirm with the owner first)

1. **Watch whether visitors still get stuck** on pinned or sideways sections. If they do, shorten the strips (fewer photos) or switch them to ordinary swipe carousels.
2. **"Powered by Netlify" badge** shows bottom-right (Netlify-injected on the free plan). Check whether it can be turned off in Netlify settings.
3. **Custom domain** (e.g. `hosseineslami.work`), if the owner buys one. Netlify's `URL` env then updates canonical and OG automatically.
4. **Connect Netlify to Git** (see §3) so deploys don't need the upload workaround.
5. **Add CI checks:** at least `npm run build`, optionally `@astrojs/check` and a Playwright smoke test.
6. **Fix the README mismatch:** it calls the grid "Studio & earlier work" and mentions a `duration` field. The page heading is now "More work", and `duration` is never shown.
7. When **Mephisto For Ever** opens (scheduled Nov 2026), update its status, chips ("Opening Nov 2026", "Now in rehearsal") and photos.

---

## 5. Known Issues & Gotchas

### Owner's standing rules (follow strictly)

- **No invented facts.** Every claim must come from the owner's portfolio, CV or messages. Earlier invented details (photographer names, interpretations, embellishments) had to be removed. If unsure, ask.
- **Spellings:**
  - Name: **"Mohammad Hossein Eslami"** (per passport), short form "M. Hossein Eslami". (The handle `hoseinizm`, the LinkedIn slug and the email use "hosein"; that's correct for those accounts.)
  - Confirmed: Dariush Adhami, Maziar Shafiei, Labkhand Theatre Complex, and the characters Kurt, Nicole and Rebekka.
- **Mixed Sandwich** is an **underground production staged without an official permit.** Keep that wording, and never list a venue for it.
- Work order is by importance (`order` field). Don't add a "curation" category.
- One long page only: no new pages and no pop-up cards except in emergencies.

### Technical gotchas

- **Copy position on photos is hand-tuned.** `box="left:…;top:…svh;width:…vw"` plus `size` on each `<Frame>` was checked at 1024–1920 widths so text never covers faces. After changing any headline, re-screenshot all widths. Phones ignore `box` and stack the text at the bottom.
- **Hero question** overflowed at 1280×720 before; it's fixed via `.hero__text.frame__text { --fs: 0.62 }`. Keep that specificity.
- **`astro check`** prompts to install a package and hangs a non-interactive shell. Don't run it unattended.
- **Sandboxed cloud containers** (Claude Code on the web):
  - The upload host `netlify-mcp.netlify.app` must be in the environment's network allowlist.
  - Node's `fetch` must be told to use the proxy: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx -y @netlify/mcp@latest …`. Without it, the upload returns **403 "Host not in allowlist"** even when curl works.
- **Netlify site name.** `hoseineslami` (one "s") was taken by someone else; the project is named **`hosseineslami`**. Subdomains can't contain dots, so `hosseineslami.work.netlify.app` is impossible.
- **The PDFs in `public/downloads/` and their generator scripts are not in the repo.**
  - The CV and portfolio were built with Python (PyMuPDF/Pillow/Playwright) in an ephemeral scratchpad that no longer exists.
  - To change them, edit the PDFs directly or rebuild from the owner's sources, then replace the files under the same names.
  - The page shows each PDF's file size, computed at build time.
- **The in-chat preview artifact** (claude.ai artifact) is a separate, stale copy, built with `PUBLIC_PREVIEW=1` with `_astro` renamed to `assets`. Its download buttons don't work inside the chat sandbox. The live Netlify site is the source of truth.
- **Synthetic touch tests:** Lenis reads `targetTouches`, so fake `TouchEvent`s must include it or they throw. Real devices are fine.
- **Instagram link** couldn't be verified from a server (HTTP 429 rate limit). Telegram was verified.

### Credentials & sensitive config

- **No secrets in the repo** and none required to build.
- Netlify access goes through the owner's Netlify connector (team `hosein99es`, owner role). Don't commit tokens. The `--proxy-path` URLs from `deploy-site` are one-time deploy credentials: don't log or commit them.
- The owner's email (`mohammadhosein.eslami95@gmail.com`) is intentionally public on the site.
- Commit messages must not include AI model identifiers. The previous agent ended commits with `Co-Authored-By` / `Claude-Session` trailers, per its session rules.
