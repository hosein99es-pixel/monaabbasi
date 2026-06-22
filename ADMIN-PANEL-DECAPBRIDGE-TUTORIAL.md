# Private admin panel with DecapBridge — beginner tutorial

This sets up a private `/admin` page where an authorised person logs in, edits the
site's text/images in a friendly form, and clicks **Publish**. Publishing saves the
change into your GitHub repo (through DecapBridge), Netlify rebuilds, and only then
does the live site change. The editor needs **no GitHub account** — DecapBridge handles
their login. The panel never appears anywhere on the public site.

You said you already have a **GitHub account** and a **DecapBridge account** — good,
that's the hard part. Everything below is click-by-click.

---

## The big picture (plain language)

```
Editor → goes to fatemeabbasi.com/admin → logs in (DecapBridge)
       → edits text → clicks Publish
       → DecapBridge saves the change into your GitHub repo
       → Netlify sees the new commit and runs the build
       → the site rebuilds and the change goes live
```

Two things to understand:

1. **The editor edits a content file, not the live page.** So drafts never show on the
   public site — only a finished, published rebuild does.
2. Because of #1, there's **one coding step**: today the text is baked into
   `index.html`; it has to move into a small content file the build reads. That's the
   only programming task — I can do it for you (Part 5). Everything else is clicks.

---

## What you need before starting

- ✅ GitHub account.
- ✅ DecapBridge account.
- Your website's code in a **GitHub repository** that **Netlify deploys from**
  (Part 1 sets this up if it isn't already).
- Netlify build settings: **Build command** = `npm run build`, **Publish directory**
  = `dist`.

---

## Part 1 — Put your site in a GitHub repo that Netlify builds from

DecapBridge works by committing to GitHub, and Netlify must rebuild when that commit
arrives. So the site needs to live in a GitHub repo connected to Netlify.

**Is it already connected?** In Netlify → your site → **Site configuration → Build &
deploy → Continuous deployment**. If you see a linked GitHub repository, you're done —
skip to Part 2. If it says the site is deployed manually (drag-and-drop), do this:

1. Create the repo on GitHub: go to <https://github.com/new>, name it
   (e.g. `fatemeabbasi-site`), keep it **Private**, click **Create repository**.
2. Get your code onto GitHub. Easiest for beginners is **GitHub Desktop**
   (<https://desktop.github.com>):
   - Install it, sign in.
   - **File → Add local repository** → choose your project folder
     (`mona-abbasi-material-stage`). If it says it's not a repo, click
     **create a repository** instead.
   - Click **Publish repository** → pick the repo you made → Publish.
3. Connect Netlify to the repo: Netlify → **Add new site → Import an existing project**
   → GitHub → pick the repo. Set **Build command** `npm run build` and **Publish
   directory** `dist`. Deploy.
   - (If you already have the live site and don't want a second one, instead use
     **Site configuration → Build & deploy → Link repository** on the existing site.)

Note your repo's path in the form `your-username/your-repo` — DecapBridge needs it.

---

## Part 2 — Create a GitHub access token for DecapBridge

DecapBridge uses this token to read/write your repo on the editor's behalf.

1. Go to <https://github.com/settings/tokens> → **Fine-grained tokens** →
   **Generate new token**.
2. **Token name**: `DecapBridge - fatemeabbasi`.
3. **Expiration**: pick a long one (e.g. 1 year). Set a reminder to renew.
4. **Repository access** → **Only select repositories** → choose your site repo.
5. **Repository permissions** → set:
   - **Contents** → **Read and write**.
   - **Pull requests** → **Read and write** (needed only if you later turn on Decap's
     editorial/draft workflow; safe to include now).
6. Click **Generate token** and **copy it now** (you won't see it again). Paste it
   somewhere temporary for the next step.

---

## Part 3 — Add the admin page to your site

In your project, create a folder named `admin/` at the project root and put one file in
it.

**`admin/index.html`**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>fatemeabbasi.com — content admin</title>
  </head>
  <body>
    <!-- Use a version higher than 3.8.3 so "Login with Google/Microsoft" works -->
    <script src="https://unpkg.com/decap-cms@^3.8.4/dist/decap-cms.js"></script>
  </body>
</html>
```

You'll add `admin/config.yml` in the next part (DecapBridge generates it for you).

---

## Part 4 — Register the site in DecapBridge

In the DecapBridge dashboard, click **Add site** and fill the form:

- **Git provider**: GitHub.
- **Git repository**: your repo path, `your-username/your-repo`.
- **Git access token**: paste the token from Part 2.
- **Your Decap CMS login URL**: `https://fatemeabbasi.com/admin/index.html`.
- **Auth type**:
  - **Classic** → editors log in with email + password (simplest).
  - **PKCE** → enables "Login with Google / Microsoft" buttons. Pick this if you want
    the editor to sign in with a Google account.

Click **Create site**. DecapBridge now shows a **generated `config.yml`**. **Copy it**
and save it as **`admin/config.yml`** in your project (next to `admin/index.html`).

That generated file already contains the correct `backend:` block (it points Decap at
DecapBridge instead of Netlify Identity). You'll add your content fields to it in the
next part. It will look roughly like this (use *your* generated values, don't copy
mine):

```yaml
backend:
  name: git-gateway
  repo: your-username/your-repo
  branch: main
  identity_url: https://auth.decapbridge.com/...      # provided by DecapBridge
  gateway_url: https://gateway.decapbridge.com         # provided by DecapBridge

media_folder: "images/uploads"
public_folder: "/images/uploads"

# --- you add this part (Part 5) ---
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
```

---

## Part 5 — Make the content editable (the one coding step)

Decap saves a file; the build turns it into the page. Create the content file the
config points to, **`content/home.json`**:

```json
{
  "name_en": "Fateme Abbasi",
  "name_fa": "فاطمه عباسی",
  "intro_en": "I am Fateme Abbasi, also known as Mona...",
  "intro_fa": "فاطمه عباسی هستم؛ خیلی‌ها من را با نام مونا هم می‌شناسند...",
  "headshot": "/images/edit/fateme-abbasi-headshot.jpg"
}
```

Then `scripts/build.mjs` must **read `content/home.json` and inject those values** into
the page when it generates `dist/en/` and `dist/fa/` (replacing the text that's
currently hard-coded in `index.html`). Until this is done, editing in the panel will
commit changes but the visible page won't update.

> This is the only programming part. Tell me which content you want editable (just the
> intro? the whole home page? gallery captions? the CV/portfolio text?) and I'll wire
> `build.mjs` + the `config.yml` `fields:` to match. Start small, expand later.

---

## Part 6 — Ship `/admin` and give it its own CSP

Two small edits to `scripts/build.mjs` (or tell me and I'll do them):

**6a. Copy the admin folder into the build output.** Add `'admin'` to the `SHARED_DIRS`
list so the panel is served at `/admin/`:

```js
const SHARED_DIRS = ['assets', 'images', 'downloads', 'admin'];
```

**6b. Relax the CSP for `/admin` only.** The strict site policy (`script-src 'self'`)
will block Decap, which loads from `unpkg.com` and talks to DecapBridge. Keep the strict
policy for the public site and add a **more specific** `/admin/*` rule *before* the `/*`
rule in the `writeHeaders()` function (Netlify uses the most specific match):

```
/admin/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*; font-src 'self' data:; connect-src 'self' https://*.decapbridge.com https://api.github.com; frame-src 'self' https://*.decapbridge.com

/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

If the admin page shows a blank screen, open the browser console (F12), look for a
"Refused to connect/load" CSP message, and add the exact domain it names to the matching
directive above. (DecapBridge's domains are under `decapbridge.com`, which the rule above
already allows.)

---

## Part 7 — Publish and log in

1. Commit and push everything to GitHub (in GitHub Desktop: write a summary →
   **Commit to main** → **Push origin**).
2. Netlify will auto-build. Wait until the deploy finishes (Netlify → Deploys).
3. Go to `https://fatemeabbasi.com/admin/`. You should see the Decap login.
4. Log in (as the site owner you can log in via DecapBridge). Try editing a field and
   clicking **Publish**, then watch a new Netlify deploy start. When it finishes, the
   change is live.

---

## Part 8 — Invite the editor (no GitHub account needed)

1. In the **DecapBridge dashboard**, open your site → **Manage collaborators**.
2. Enter the editor's email → **Send**. They get an invite email, set up a login
   (password, or Google/Microsoft if you chose PKCE), and land on `/admin/`.
3. New people join as **collaborators** (can edit content only). You can promote a
   trusted one to **admin** (can invite/remove others) from the collaborators table.

---

## Troubleshooting

- **Admin page is blank** → CSP is blocking it. Fix the `/admin/*` block (Part 6b);
  check the console for the exact blocked domain.
- **Can log in but Publish fails** → the GitHub token is wrong/expired or lacks
  **Contents: Read and write**, or the `repo`/`branch` in `config.yml` is wrong.
- **Edits commit but the site doesn't change** → the build isn't reading
  `content/home.json` yet (Part 5), or the Netlify deploy failed (check the deploy log).
- **"Config not found"** → `dist/admin/config.yml` is missing; confirm Part 6a and that
  the YAML indentation is intact.
- **Invite email missing** → check spam; re-send from Manage collaborators.

---

## What I can do for you

The dashboard/GitHub clicks (Parts 1, 2, 4, 7, 8) are yours. I can do the repo code
(Parts 3, 5, 6): create `admin/index.html`, build the content file, wire `build.mjs` to
read it, add `admin` to the copy list, and add the `/admin/*` CSP block.

Just tell me **which content should be editable** and your **production branch name**
(usually `main`), and I'll implement that side.

---

### Sources
- DecapBridge — Getting started: https://decapbridge.com/docs/getting-started
- Decap CMS — Install / configuration: https://decapcms.org/docs/install-decap-cms/ , https://decapcms.org/docs/configuration-options/
