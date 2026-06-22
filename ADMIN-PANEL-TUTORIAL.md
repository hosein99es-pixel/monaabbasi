# Admin content panel for fatemeabbasi.com — complete setup tutorial

This guide adds a private `/admin` panel where an authorised person logs in, edits
the site's text/images through a friendly form, and clicks **Publish**. Saving
commits the change to your Git repo, Netlify rebuilds, and only then does the live
site update. The panel is gated by real server-side login (Netlify Identity), so it
is genuinely private — not just a hidden URL.

Stack: **Decap CMS** (the editor UI) + **Netlify Identity** (login) + **Git Gateway**
(lets the editor commit without a GitHub account).

> Tailored to this project: a Netlify-hosted static site built by `scripts/build.mjs`
> into `dist/`, with a strict Content-Security-Policy. The CSP step below is the part
> generic tutorials skip — without it the admin page silently fails to load.

---

## How it fits together (read this first)

```
Editor → /admin (Decap UI) → logs in (Netlify Identity)
       → edits content → Publish
       → Git Gateway commits to your repo (e.g. content/home.json)
       → Netlify runs `npm run build`
       → build injects content into the pages → dist/ deploys
       → live site updates
```

The critical idea: **the editor never edits the live HTML directly.** They edit a
*content file*; the build turns that file into the page. So the public site only
changes on a successful rebuild, and unpublished drafts never appear live.

This means there is **one prerequisite refactor**: today your text lives hard-coded
inside `index.html`. To make it editable, the editable parts must move into a content
file that `build.mjs` reads. That is the only code change required; everything else is
configuration and dashboard clicks. (I can do that refactor for you — see Step 2.)

---

## Prerequisites

- The site is already on Netlify and deploys from a Git repo (GitHub/GitLab/Bitbucket).
  If it's currently drag-and-drop deployed, connect it to a Git repo first
  (Netlify → Site configuration → Build & deploy → link repository).
- Netlify build settings: **Build command** `npm run build`, **Publish directory** `dist`.
- You can log into the Netlify dashboard for this site.

---

## Step 1 — Add the admin panel files (in your source, not dist)

Create a folder `admin/` at the project root with two files.

**`admin/index.html`** — the page that loads the editor:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Content admin</title>
</head>
<body>
  <!-- Netlify Identity widget (login) -->
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  <!-- Decap CMS (the editor) -->
  <script src="https://unpkg.com/decap-cms@^3.6.0/dist/decap-cms.js"></script>
</body>
</html>
```

**`admin/config.yml`** — what the editor can change. Start small, with the home page
content. (Field names must match the content file from Step 2.)

```yaml
backend:
  name: git-gateway
  branch: main          # change if your production branch is named differently

media_folder: "images/uploads"     # where uploaded images are committed in the repo
public_folder: "/images/uploads"   # URL prefix those images are served from

collections:
  - name: "pages"
    label: "Site content"
    files:
      - name: "home"
        label: "Home page"
        file: "content/home.json"
        fields:
          - { label: "Name (English)",  name: "name_en",  widget: "string" }
          - { label: "Name (Persian)",  name: "name_fa",  widget: "string", required: false }
          - { label: "Intro (English)", name: "intro_en", widget: "text" }
          - { label: "Intro (Persian)", name: "intro_fa", widget: "text", required: false }
          - { label: "Headshot", name: "headshot", widget: "image", required: false }
          # add a field per editable piece of content you expose
```

---

## Step 2 — Make the content editable (the one refactor)

Decap edits a file in the repo; the build turns it into HTML. Create a content file,
e.g. **`content/home.json`**:

```json
{
  "name_en": "Fateme Abbasi",
  "name_fa": "فاطمه عباسی",
  "intro_en": "I am Fateme Abbasi, also known as Mona...",
  "intro_fa": "فاطمه عباسی هستم؛ خیلی‌ها من را با نام مونا هم می‌شناسند...",
  "headshot": "/images/edit/fateme-abbasi-headshot.jpg"
}
```

Then `scripts/build.mjs` must read this file and inject the values into the page when
it generates `dist/en/` and `dist/fa/` (replacing the currently hard-coded text). The
build already centralises content per locale, so this is a contained change: load the
JSON, and substitute the relevant nodes before writing each route.

> This is the only programming step. Tell me which pieces of content you want editable
> (just the intro? the whole page? gallery captions? the CV/portfolio text?) and I'll
> wire `build.mjs` + `config.yml` to match. Keep the first version small, then expand.

---

## Step 3 — Ship `/admin` in the build output

Your build copies a fixed list of folders into `dist/`. Add `admin` (and the new
`content` upload target if needed) so the panel is served at `/admin/`.

In `scripts/build.mjs`, add `'admin'` to the `SHARED_DIRS` array:

```js
const SHARED_DIRS = ['assets', 'images', 'downloads', 'admin'];
```

After `npm run build`, confirm `dist/admin/index.html` and `dist/admin/config.yml`
exist. The panel will live at `https://fatemeabbasi.com/admin/`.

---

## Step 4 — Loosen the CSP **for `/admin` only** (important)

The strict Content-Security-Policy on the site (`script-src 'self'`) will block Decap,
which loads scripts from `unpkg.com` and `identity.netlify.com` and calls Netlify/Git
APIs. Keep the strict policy for the public site and give `/admin/*` its own policy.

In `scripts/build.mjs`, the `writeHeaders()` function currently writes one `/*` block.
Add a **more specific** `/admin/*` block *before* it (Netlify applies the most specific
matching rule):

```
/admin/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://unpkg.com https://identity.netlify.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*; font-src 'self' data:; connect-src 'self' https://identity.netlify.com https://api.netlify.com https://api.github.com; frame-src 'self' https://app.netlify.com

/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

If anything in the admin UI fails to load, open the browser console, read the CSP
violation, and add the named origin to the matching directive above. (The exact
`connect-src` list can vary slightly by Netlify region/feature.)

---

## Step 5 — Enable Netlify Identity + Git Gateway (dashboard)

1. Netlify dashboard → your site → **Integrations / Identity** → **Enable Identity**.
2. Under **Identity → Registration**, set **Registration preferences = Invite only**
   (so random visitors can't sign up).
3. (Recommended) **Identity → Services → Git Gateway → Enable Git Gateway.** This lets
   logged-in editors commit to the repo without their own GitHub account.
4. Optional: under **Identity → Registration → External providers**, add Google/GitHub
   login if you prefer that over email.

---

## Step 6 — Let the site handle login + invites

Netlify invite emails link to your site root with a token (e.g. `/#invite_token=...`).
You need the Identity widget to catch that and open the login/accept dialog. Two clean
options:

- **Simplest:** in the Netlify Identity settings, the invite/confirmation/recovery
  flows can be pointed at `/admin/` — the widget is already on that page, so invitees
  land directly on the panel to set their password. Verify the redirect under
  **Identity → Emails** templates if needed.
- **Or** add the Identity widget to the public site too. ⚠️ This conflicts with the
  strict site CSP (external script + inline redirect), so prefer the option above to
  keep the public site locked down.

---

## Step 7 — Invite the admin and test

1. Netlify → **Identity → Invite users** → enter the admin's email.
2. They receive an email, set a password, and land on `/admin/`.
3. In the panel: edit a field → **Publish**. Watch Netlify start a new deploy.
4. When the deploy finishes, confirm the change is live on the public site.
5. Confirm a logged-out visitor going to `/admin/` is prompted to log in and cannot
   edit anything — and that none of the admin UI appears anywhere on the public pages.

---

## Troubleshooting

- **Admin page blank / console shows CSP errors** → fix the `/admin/*` CSP (Step 4);
  add the blocked origin to the right directive.
- **"Failed to load config.yml"** → `dist/admin/config.yml` missing; check Step 3 and
  that YAML indentation is valid.
- **Login works but Publish fails / "Git Gateway error"** → Git Gateway not enabled, or
  the `branch:` in `config.yml` doesn't match your production branch.
- **Edits don't appear** → the build isn't reading `content/home.json` yet (Step 2), or
  the deploy failed (check the Netlify deploy log).
- **Anyone can sign up** → set Registration to **Invite only** (Step 5.2).

---

## Alternatives (optional)

- **Sveltia CMS** — a drop-in, much faster modern replacement for Decap. Same
  git-based model and almost the same `config.yml`; just swap the script in
  `admin/index.html` for the Sveltia bundle. Good if the Decap UI feels sluggish.
- **DecapBridge** — a free auth service purpose-built for Decap if you'd rather not use
  Netlify Identity at all (no Auth0/back-end setup).
- **Hosted CMS (Sanity / Contentful)** — content lives in their access-controlled
  dashboard and the build pulls it in; more setup, zero auth wiring on your side.

---

## What I can do for you next

The dashboard steps (4–7) are yours to click, but I can do all the repo work:
1. Refactor `build.mjs` + create `content/home.json` so chosen content is editable (Step 2).
2. Add `admin/index.html` + `admin/config.yml` (Step 1).
3. Add `admin` to the build copy list and the `/admin/*` CSP block (Steps 3–4).

Just tell me **which content should be editable** and the **production branch name**,
and I'll implement that side end-to-end.
```
