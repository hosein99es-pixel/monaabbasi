// Build pipeline: generate per-locale static routes (/en/, /fa/) from a single
// content source (index.html). Each route is fully functional WITHOUT
// JavaScript — language is gated by CSS via the root [data-lang] attribute, so
// baking data-lang/lang/dir into the HTML renders one language with no script.
//
// Responsibilities:
//   * bake lang / dir / data-lang per locale
//   * inject canonical + hreflang (en, fa, x-default) and per-locale og:url
//   * localize <title> / <meta description>
//   * convert the in-place language toggle button into a real anchor to the
//     sibling route (works without JS; preserves the .lang-toggle styling)
//   * copy shared assets to dist/ root and rewrite route-relative URLs (../)
//   * emit a no-JS root chooser at dist/index.html
//
// Single source of truth for content remains index.html; this script only
// transforms structure/metadata per locale.

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const SITE_URL = (pkg.config?.siteUrl || 'https://example.com').replace(/\/$/, '');

const LOCALES = {
  en: {
    dir: 'ltr',
    title: 'Fateme Abbasi — Portfolio',
    description:
      'Official portfolio for Fateme Abbasi (Mona Abbasi): acting, theatre directing, teaching, awards, photos, CV, and portfolio.',
    switcherHref: '../fa/',
    switcherLabel: 'فارسی',
    switcherAria: 'نمایش این وب‌سایت به زبان فارسی',
    switcherLang: 'fa',
    switcherDir: 'rtl'
  },
  fa: {
    dir: 'rtl',
    title: 'فاطمه عباسی — نمونه‌کارها',
    description:
      'نمونه‌کارهای رسمی فاطمه عباسی (مونا عباسی): بازیگری، کارگردانی تئاتر، تدریس، جوایز، عکس‌ها، رزومه و پرتفولیو.',
    switcherHref: '../en/',
    switcherLabel: 'English',
    switcherAria: 'View this site in English',
    switcherLang: 'en',
    switcherDir: 'ltr'
  }
};

// Shared top-level directories/files copied once to dist/ root and referenced
// by routes via ../  (no per-locale duplication of heavy image assets).
// 'admin' publishes the private Decap CMS panel at /admin/ (never linked from
// any public page; gated by DecapBridge login).
const SHARED_DIRS = ['assets', 'images', 'downloads', 'admin'];
const SHARED_FILES = ['cv.html', 'portfolio.html'];
// Route-relative reference roots that must be prefixed with ../ inside /en/ /fa/.
const REWRITE_PREFIXES = ['assets/', 'images/', 'downloads/', 'cv.html', 'portfolio.html'];

const log = (...a) => console.log('[build]', ...a);

// Best-effort clean. Some mounted filesystems refuse to unlink macOS .DS_Store
// metadata files (EPERM); those are skipped and harmlessly overwritten in place.
function rimraf(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p)) {
    const full = path.join(p, entry);
    let stat;
    try { stat = fs.lstatSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      rimraf(full);
      try { fs.rmdirSync(full); } catch { /* non-empty due to locked files */ }
    } else {
      try { fs.unlinkSync(full); } catch { /* locked (e.g. .DS_Store) */ }
    }
  }
}

// Content-only recursive copy. Avoids fs.cpSync, which preserves source file
// modes/timestamps and fails with EACCES on some mounted filesystems.
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === '.DS_Store') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
}

// Editable home-page content, managed through Decap CMS via DecapBridge and
// stored as JSON (content/home.json). Keeping the values in a data file lets an
// authorised editor change the home page name, intro, and headshot without
// touching markup. The committed defaults equal the original hardcoded strings,
// so the public output is unchanged until an editor edits and publishes.
function loadHomeContent() {
  const file = path.join(ROOT, 'content', 'home.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing content/home.json (home page content source).\n` +
      `Expected at: ${file}\n` +
      `This file is required by the build — restore it from version control ` +
      `(or let the CMS recreate it) before running the build.`
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function copyShared() {
  for (const dir of SHARED_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) copyRecursive(src, path.join(DIST, dir));
  }
  for (const file of SHARED_FILES) {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) copyRecursive(src, path.join(DIST, file));
  }
}

// Prefix a single URL with ../ when it points at a shared root reference.
function rewriteUrl(value) {
  if (!value) return value;
  const v = value.trim();
  if (/^(https?:|data:|mailto:|tel:|#|\/|\.\.\/)/.test(v)) return value; // absolute / anchor / already-relative-up
  for (const prefix of REWRITE_PREFIXES) {
    if (v === prefix || v.startsWith(prefix)) return `../${v}`;
  }
  return value;
}

function rewriteSrcset(value) {
  if (!value) return value;
  return value
    .split(',')
    .map((part) => {
      const seg = part.trim();
      if (!seg) return seg;
      const [url, ...descriptor] = seg.split(/\s+/);
      return [rewriteUrl(url), ...descriptor].join(' ');
    })
    .join(', ');
}

// Rewrite url(images/...) etc. inside inline style attributes / <style> text.
function rewriteCssUrls(text) {
  if (!text) return text;
  return text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, quote, url) => {
    const rewritten = rewriteUrl(url);
    return `url(${quote}${rewritten}${quote})`;
  });
}

function buildLocale(locale, sourceHtml, homeContent) {
  const cfg = LOCALES[locale];
  const dom = new JSDOM(sourceHtml);
  const { document } = dom.window;
  const html = document.documentElement;
  const head = document.head;

  // 1) Root language attributes (this alone makes the route correct without JS).
  html.setAttribute('lang', locale);
  html.setAttribute('dir', cfg.dir);
  html.setAttribute('data-lang', locale);
  document.body.setAttribute('dir', cfg.dir);

  // 2) Localised title + description.
  const titleEl = document.querySelector('title');
  if (titleEl) titleEl.textContent = cfg.title;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', cfg.description);

  // 3) Canonical + hreflang alternates + og:url.
  document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = `${SITE_URL}/${locale}/`;
  head.appendChild(canonical);
  const alternates = [
    ['en', `${SITE_URL}/en/`],
    ['fa', `${SITE_URL}/fa/`],
    ['x-default', `${SITE_URL}/en/`]
  ];
  for (const [hreflang, href] of alternates) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.setAttribute('hreflang', hreflang);
    link.href = href;
    head.appendChild(link);
  }
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', `${SITE_URL}/${locale}/`);

  // 4) Convert the in-place language toggle into a sibling-route anchor.
  const toggle = document.querySelector('.lang-toggle');
  if (toggle) {
    const a = document.createElement('a');
    a.className = toggle.className;
    a.setAttribute('href', cfg.switcherHref);
    a.setAttribute('hreflang', cfg.switcherLang);
    a.setAttribute('lang', cfg.switcherLang);
    a.setAttribute('dir', cfg.switcherDir);
    a.setAttribute('data-lang-switch', cfg.switcherLang);
    a.setAttribute('aria-label', cfg.switcherAria);
    a.textContent = cfg.switcherLabel;
    toggle.replaceWith(a);
  }

  // 4b) Inject editable home-page content (Decap CMS via DecapBridge).
  //     Each route carries both language spans (CSS gates which one shows), so
  //     both the English and Persian values are written into their matching
  //     spans for every locale — preserving the existing dual-span markup. This
  //     runs BEFORE the URL-rewrite pass (step 5) so a relative headshot path is
  //     rewritten to ../ exactly like the original hardcoded reference, keeping
  //     the output byte-identical until an editor changes a value.
  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === 'string') el.textContent = value;
  };
  setText('#hero-title > .en', homeContent.name_en);
  setText('#hero-title > .fa', homeContent.name_fa);
  setText('.hero__summary > .en', homeContent.intro_en);
  setText('.hero__summary > .fa', homeContent.intro_fa);
  const heroImg = document.querySelector('.hero__media img');
  if (heroImg && typeof homeContent.headshot === 'string' && homeContent.headshot) {
    heroImg.setAttribute('src', homeContent.headshot);
  }

  // 5) Rewrite route-relative URLs to reach shared assets at dist/ root.
  document.querySelectorAll('[src]').forEach((el) => el.setAttribute('src', rewriteUrl(el.getAttribute('src'))));
  document.querySelectorAll('[href]').forEach((el) => {
    const rel = el.getAttribute('rel') || '';
    if (rel.includes('canonical') || rel.includes('alternate')) return; // absolute already
    el.setAttribute('href', rewriteUrl(el.getAttribute('href')));
  });
  document.querySelectorAll('[srcset]').forEach((el) => el.setAttribute('srcset', rewriteSrcset(el.getAttribute('srcset'))));
  document.querySelectorAll('[style]').forEach((el) => {
    const s = el.getAttribute('style');
    const rw = rewriteCssUrls(s);
    if (rw !== s) el.setAttribute('style', rw);
  });
  document.querySelectorAll('style').forEach((el) => {
    el.textContent = rewriteCssUrls(el.textContent);
  });

  const outDir = path.join(DIST, locale);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html>\n${html.outerHTML}\n`);
  log(`wrote ${locale}/index.html`);
}

function writeRootChooser() {
  // No-JS friendly chooser. Canonical points at the default locale; a meta
  // refresh sends script-less clients onward while visible links remain usable.
  const htmlDoc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fateme Abbasi — Portfolio</title>
  <link rel="canonical" href="${SITE_URL}/en/" />
  <link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />
  <link rel="alternate" hreflang="fa" href="${SITE_URL}/fa/" />
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/" />
  <meta http-equiv="refresh" content="0; url=./en/" />
</head>
<body>
  <p>Choose a language — یک زبان را انتخاب کنید:</p>
  <ul>
    <li><a href="./en/" hreflang="en">English</a></li>
    <li><a href="./fa/" hreflang="fa" lang="fa" dir="rtl">فارسی</a></li>
  </ul>
</body>
</html>
`;
  fs.writeFileSync(path.join(DIST, 'index.html'), htmlDoc);
  log('wrote root chooser');
}

// Real HTTP security headers for hosts that support a _headers file (Netlify,
// Cloudflare Pages). Mirrors the per-page CSP <meta> but adds directives that
// only take effect as a header (frame-ancestors) plus defence-in-depth headers.
// Kept in sync with the CSP <meta> authored in the HTML sources.
const CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; " +
  "img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "script-src 'self'; connect-src 'self'; form-action 'self'";

// Decap CMS is served ONLY at /admin/. It loads its bundle from unpkg and talks
// to DecapBridge + GitHub, which the strict site CSP forbids. This scoped policy
// applies only to /admin/* and is emitted first so Netlify's most-specific match
// wins; the public site keeps the strict CSP below, unchanged.
const ADMIN_CSP =
  "default-src 'self'; script-src 'self' https://unpkg.com; " +
  "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
  "img-src 'self' data: blob: https://*; font-src 'self' data:; " +
  "connect-src 'self' https://*.decapbridge.com https://api.github.com; " +
  "frame-src 'self' https://*.decapbridge.com";

function writeHeaders() {
  const headers = `/admin/*
  Content-Security-Policy: ${ADMIN_CSP}

/*
  Content-Security-Policy: ${CSP}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=()
`;
  fs.writeFileSync(path.join(DIST, '_headers'), headers);
  log('wrote _headers');
}

function main() {
  log(`site URL: ${SITE_URL}`);
  rimraf(DIST);
  fs.mkdirSync(DIST, { recursive: true });
  copyShared();
  const sourceHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const homeContent = loadHomeContent();
  for (const locale of Object.keys(LOCALES)) buildLocale(locale, sourceHtml, homeContent);
  writeRootChooser();
  writeHeaders();
  log('done.');
}

main();
