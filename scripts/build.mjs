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
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteContent, writeProductionsBundle } from './sanity-content.mjs';

// Render inline Markdown (bold/italic/links) to HTML without a wrapping <p>, so
// editor-formatted copy drops into the existing inline spans. Plain text with no
// Markdown round-trips unchanged, so default output stays identical.
const renderInline = (value) => marked.parseInline(String(value ?? ''));
// Block Markdown (paragraphs, lists, emphasis) -> HTML, for editor-added section
// bodies that may span multiple paragraphs.
const renderBlock = (value) => marked.parse(String(value ?? ''));

// Stage D: append editor-defined sections before the Contact/Ending section, add
// matching nav links, then renumber every story section so the "Act NN" labels,
// the scroll rail count, and the nav stay consistent. Runs only when at least one
// extra section exists, so the default build output is unchanged.
function buildExtraSections(document, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const contact = document.querySelector('#contact');
  const nav = document.querySelector('#primary-nav');
  const contactNav = nav ? nav.querySelector('a[href="#contact"]') : null;
  if (!contact) return;

  const span = (cls, text, fa) => {
    const el = document.createElement('span');
    el.className = cls;
    if (fa) { el.lang = 'fa'; el.dir = 'rtl'; }
    el.textContent = text || '';
    return el;
  };

  for (const item of items) {
    const id = String(item.id || '').trim();
    if (!id) continue;

    const section = document.createElement('section');
    section.className = 'section about';
    section.id = id;
    section.setAttribute('aria-labelledby', `${id}-title`);
    section.setAttribute('data-story-act', '');
    section.setAttribute('data-story-title', item.title_en || '');
    section.setAttribute('data-story-title-fa', item.title_fa || '');

    const heading = document.createElement('div');
    heading.className = 'section-heading';
    const label = document.createElement('span');
    label.className = 'section-label';
    label.append(span('en', item.title_en), span('fa', item.title_fa, true));
    const h2 = document.createElement('h2');
    h2.className = 'large-copy reveal bilingual';
    h2.id = `${id}-title`;
    h2.append(span('en', item.heading_en || item.title_en), span('fa', item.heading_fa || item.title_fa, true));
    heading.append(label, h2);
    section.append(heading);

    if (item.body_en || item.body_fa) {
      const body = document.createElement('div');
      body.className = 'bilingual reveal';
      const bodyEn = document.createElement('div');
      bodyEn.className = 'en';
      bodyEn.innerHTML = renderBlock(item.body_en || '');
      const bodyFa = document.createElement('div');
      bodyFa.className = 'fa';
      bodyFa.lang = 'fa';
      bodyFa.dir = 'rtl';
      bodyFa.innerHTML = renderBlock(item.body_fa || '');
      body.append(bodyEn, bodyFa);
      section.append(body);
    }

    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    if (images.length) {
      const media = document.createElement('div');
      media.className = 'section-extra__media reveal';
      for (const src of images) {
        const img = document.createElement('img');
        img.setAttribute('src', src);
        img.setAttribute('alt', '');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        media.append(img);
      }
      section.append(media);
    }

    contact.before(section);

    if (nav) {
      const link = document.createElement('a');
      link.setAttribute('href', `#${id}`);
      link.append(span('en', item.title_en || id), span('fa', item.title_fa || id, true));
      if (contactNav) contactNav.before(link);
      else nav.append(link);
    }
  }

  // Hero is first in DOM order, so it keeps act "01" (main.js keys the prologue
  // reveal on [data-story-act="01"]). Everything else renumbers around the inserts.
  document.querySelectorAll('[data-story-act]').forEach((sec, i) => {
    sec.setAttribute('data-story-act', String(i + 1).padStart(2, '0'));
  });
}

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
// NOTE: /admin is no longer the old Decap panel. The Sanity Studio static build
// is placed at dist/admin by scripts/place-admin.mjs (run after the studio build),
// so 'admin' is intentionally NOT copied here.
const SHARED_DIRS = ['assets', 'images', 'downloads'];
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

// Editable site content now comes from Sanity first, then falls back to the
// committed JSON/JS files if Sanity is unavailable. The Sanity adapter maps the
// CMS schema back into this static site's existing content shape so the exact
// visual design can stay intact.

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

function buildLocale(locale, sourceHtml, content) {
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
  // Keep social-share images on the canonical site domain (tracks siteUrl).
  const socialImage = `${SITE_URL}/images/image33.jpg`;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', socialImage);
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) twitterImage.setAttribute('content', socialImage);

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
  const home = content.home;
  const S = content.sections;

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === 'string') el.textContent = value;
  };
  // Prose fields support inline Markdown (bold/italic/links); short labels and
  // headings stay plain text via setText.
  const setRich = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === 'string') el.innerHTML = renderInline(value);
  };

  // Hero (Profile / act 01).
  setText('#hero-title > .en', home.name_en);
  setText('#hero-title > .fa', home.name_fa);
  setRich('.hero__summary > .en', home.intro_en);
  setRich('.hero__summary > .fa', home.intro_fa);
  const heroImg = document.querySelector('.hero__media img');
  if (heroImg && typeof home.headshot === 'string' && home.headshot) {
    heroImg.setAttribute('src', home.headshot);
  }
  // Focal point: object-position chooses which part of a cover-cropped photo
  // stays visible (0 = left/top, 100 = right/bottom). 50/50 is the CSS default
  // (centre), so the style is only written when moved off-centre — keeping the
  // default output unchanged.
  if (heroImg) {
    const fx = Number.isFinite(home.headshot_focus_x) ? home.headshot_focus_x : 50;
    const fy = Number.isFinite(home.headshot_focus_y) ? home.headshot_focus_y : 50;
    if (fx !== 50 || fy !== 50) heroImg.setAttribute('style', `object-position:${fx}% ${fy}%`);
  }

  // Section labels / headings (acts 03-09). Editing these never adds/removes
  // nodes, so it is a pure text swap on existing elements.
  setText('#work .section-label > .en', S.theatre_label_en);
  setText('#work .section-label > .fa', S.theatre_label_fa);
  setText('#work-title > .en', S.theatre_heading_en);
  setText('#work-title > .fa', S.theatre_heading_fa);

  setText('#film .section-label > .en', S.film_label_en);
  setText('#film .section-label > .fa', S.film_label_fa);
  setText('#film-title > .en', S.film_heading_en);
  setText('#film-title > .fa', S.film_heading_fa);

  setText('#awards .section-label > .en', S.awards_label_en);
  setText('#awards .section-label > .fa', S.awards_label_fa);
  setRich('#awards-title > .en', S.awards_heading_en);
  setRich('#awards-title > .fa', S.awards_heading_fa);

  setText('#teaching .section-label > .en', S.teaching_label_en);
  setText('#teaching .section-label > .fa', S.teaching_label_fa);
  setRich('#teaching-title > .en', S.teaching_heading_en);
  setRich('#teaching-title > .fa', S.teaching_heading_fa);

  setText('#upcoming .section-label > .en', S.upcoming_label_en);
  setText('#upcoming .section-label > .fa', S.upcoming_label_fa);
  setText('#upcoming-title > .en', S.upcoming_heading_en);
  setText('#upcoming-title > .fa', S.upcoming_heading_fa);
  setRich('#upcoming .reel-panel > div > p.bilingual > .en', S.upcoming_body_en);
  setRich('#upcoming .reel-panel > div > p.bilingual > .fa', S.upcoming_body_fa);

  setText('#gallery .section-label > .en', S.gallery_label_en);
  setText('#gallery .section-label > .fa', S.gallery_label_fa);
  setText('#gallery-title > .en', S.gallery_heading_en);
  setText('#gallery-title > .fa', S.gallery_heading_fa);

  setText('#downloads .section-label > .en', S.downloads_label_en);
  setText('#downloads .section-label > .fa', S.downloads_label_fa);
  setText('#downloads-title > .en', S.downloads_heading_en);
  setText('#downloads-title > .fa', S.downloads_heading_fa);

  // Awards (act 05) and Teaching (act 06): regenerate the card grids from their
  // data arrays so editors can add / remove / reorder items. Markup mirrors the
  // original cards (first card expressive, rest tonal; bilingual h3 + paragraph).
  const buildCards = (gridSelector, items) => {
    const grid = document.querySelector(gridSelector);
    if (!grid || !Array.isArray(items)) return;
    const cards = items.map((item, index) => {
      const article = document.createElement('article');
      article.className = index === 0 ? 'card card--expressive reveal' : 'card card--tonal reveal';
      const number = document.createElement('span');
      number.className = 'card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const h3 = document.createElement('h3');
      const titleEn = document.createElement('span');
      titleEn.className = 'en';
      titleEn.textContent = item.title_en || '';
      const titleFa = document.createElement('span');
      titleFa.className = 'fa';
      titleFa.lang = 'fa';
      titleFa.dir = 'rtl';
      titleFa.textContent = item.title_fa || '';
      h3.append(titleEn, titleFa);
      const p = document.createElement('p');
      p.className = 'bilingual';
      const textEn = document.createElement('span');
      textEn.className = 'en';
      textEn.innerHTML = renderInline(item.text_en || '');
      const textFa = document.createElement('span');
      textFa.className = 'fa';
      textFa.lang = 'fa';
      textFa.dir = 'rtl';
      textFa.innerHTML = renderInline(item.text_fa || '');
      p.append(textEn, textFa);
      article.append(number, h3, p);
      return article;
    });
    grid.replaceChildren(...cards);
  };
  buildCards('#awards .about__grid', content.awards?.items);
  buildCards('#teaching .about__grid', content.teaching?.items);

  // Production cards keep their existing layout/action copy, but the public
  // content inside each card now comes from Sanity. Cards not yet represented in
  // Sanity keep their local fallback data from assets/js/productions.js.
  const setBilingualPair = (container, enValue, faValue) => {
    if (!container) return;
    const en = container.querySelector('.en');
    const fa = container.querySelector('.fa');
    if (en && typeof enValue === 'string') en.textContent = enValue;
    if (fa && typeof faValue === 'string') fa.textContent = faValue;
  };

  document.querySelectorAll('[data-work]').forEach((button) => {
    const key = button.getAttribute('data-work');
    const production = content.productions?.[key];
    const card = button.closest('.work-card');
    if (!production || !card) return;

    const image = card.querySelector('.work-card__media img');
    if (image && production.hero) {
      image.setAttribute('src', production.hero);
      image.setAttribute('alt', production.heroAlt || `${production.title} production photograph`);
      if (Number.isFinite(production.heroWidth)) image.setAttribute('width', String(production.heroWidth));
      if (Number.isFinite(production.heroHeight)) image.setAttribute('height', String(production.heroHeight));
      const focusX = Number.isFinite(production.heroFocusX) ? production.heroFocusX : null;
      const focusY = Number.isFinite(production.heroFocusY) ? production.heroFocusY : null;
      if (focusX !== null || focusY !== null) {
        image.style.setProperty('--work-image-position', `${focusX ?? 50}% ${focusY ?? 50}%`);
      }
    }

    const chips = card.querySelectorAll('.chip-set .chip');
    setBilingualPair(chips[0], production.role, production.roleFa);
    setBilingualPair(chips[1], production.year, production.yearFa || production.year);
    setBilingualPair(chips[2], production.venue, production.venueFa);
    setBilingualPair(card.querySelector('.work-card__title'), production.title, production.titleFa);
    setBilingualPair(
      card.querySelector('.work-card__meta'),
      [production.director ? `Directed by ${production.director}` : '', production.venue].filter(Boolean).join(' · '),
      [production.directorFa ? `به کارگردانی ${production.directorFa}` : '', production.venueFa].filter(Boolean).join(' · ')
    );
  });

  // Gallery (act 08): inject each photo's data into the existing cards so the
  // default output stays byte-identical (same values into the same elements).
  // Extra cards are cloned from the first; surplus cards removed — both only
  // happen when an editor changes the list. The runtime slideshow + pop-up read
  // the data-gallery-* attributes set here.
  // NOTE/seam: data-gallery-src is kept route-relative-unaware (raw) to preserve
  // byte-identical output; the runtime slideshow's use of it on /en//fa/ should
  // be made route-relative in a separate one-line change set.
  const galleryGrid = document.querySelector('#gallery .gallery-grid');
  const galleryItems = content.gallery?.items;
  if (galleryGrid && Array.isArray(galleryItems)) {
    const applyGalleryItem = (card, item, index) => {
      card.setAttribute('data-gallery-src', item.src || '');
      card.setAttribute('data-gallery-title', item.title_en || '');
      card.setAttribute('data-gallery-title-fa', item.title_fa || '');
      card.setAttribute('data-gallery-copy', item.copy_en || '');
      card.setAttribute('data-gallery-copy-fa', item.copy_fa || '');
      const img = card.querySelector('img');
      if (img) {
        img.setAttribute('src', item.src || '');
        const alt = locale === 'fa' && item.alt_fa ? item.alt_fa : item.alt_en || '';
        img.setAttribute('alt', alt);
        if (Number.isFinite(item.width)) img.setAttribute('width', String(item.width));
        else img.removeAttribute('width');
        if (Number.isFinite(item.height)) img.setAttribute('height', String(item.height));
        else img.removeAttribute('height');
      }
      const labelEn = card.querySelector('strong > .en');
      if (labelEn && typeof item.label_en === 'string') labelEn.textContent = item.label_en;
      const labelFa = card.querySelector('strong > .fa');
      if (labelFa && typeof item.label_fa === 'string') labelFa.textContent = item.label_fa;
      const number = card.querySelector('span[aria-hidden="true"]');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
    };
    const cards = Array.from(galleryGrid.querySelectorAll('.gallery-card'));
    const template = cards[0];
    galleryItems.forEach((item, i) => {
      let card = cards[i];
      if (!card && template) {
        card = template.cloneNode(true);
        galleryGrid.append(card);
      }
      if (card) applyGalleryItem(card, item, i);
    });
    for (let i = galleryItems.length; i < cards.length; i += 1) cards[i].remove();
  }

  // Editor-added sections (+ nav links + act renumbering).
  buildExtraSections(document, content.extras?.items);

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
  "img-src 'self' data: https://cdn.sanity.io; font-src 'self' https://fonts.gstatic.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "script-src 'self'; connect-src 'self'; form-action 'self'";

// The Sanity Studio (static build) is served ONLY at /admin/. It needs a looser
// policy than the public site: its own bundle (self), styled-components inline
// styles, web workers, and calls to the Sanity APIs/CDN over https + websockets.
// This scoped policy applies only to /admin/* (emitted first so Netlify's
// most-specific match wins); the public site keeps the strict CSP below.
// Former note (kept for history): /admin used to host the Decap CMS.
// applies only to /admin/* and is emitted first so Netlify's most-specific match
// wins; the public site keeps the strict CSP below, unchanged.
// Sanity hosts the Studio uses. Auto-updating studios pull modules (JS + CSS)
// from the APEX sanity-cdn.com — a CSP wildcard (*.sanity-cdn.com) does NOT match
// the bare apex, so it must be listed explicitly alongside the wildcard.
const SANITY_CDN = 'https://sanity-cdn.com https://core.sanity-cdn.com https://*.sanity-cdn.com';
const ADMIN_CSP =
  "default-src 'self'; base-uri 'self'; " +
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${SANITY_CDN}; ` +
  `style-src 'self' 'unsafe-inline' ${SANITY_CDN}; ` +
  `img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io ${SANITY_CDN}; ` +
  `font-src 'self' data: https://*.sanity.io ${SANITY_CDN}; ` +
  `connect-src 'self' https://*.sanity.io wss://*.sanity.io https://api.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io ${SANITY_CDN}; ` +
  "frame-src 'self' https://*.sanity.io https://*.sanity-cdn.com; frame-ancestors 'self'; worker-src 'self' blob:; form-action 'self'";

function writeHeaders() {
  // IMPORTANT: a catch-all `/*` CSP would ALSO match /admin, and Netlify then
  // sends both CSP headers — the browser enforces the intersection, so the strict
  // public policy wins and breaks the Sanity Studio. So the CSP is scoped: the
  // strict public policy only on the public HTML routes, the Studio policy only
  // on /admin/*. Non-CSP security headers stay on /* (they don't conflict).
  const publicPaths = ['/', '/en/*', '/fa/*', '/cv.html', '/portfolio.html'];
  const publicCspBlocks = publicPaths
    .map((p) => `${p}\n  Content-Security-Policy: ${CSP}\n`)
    .join('\n');
  const headers = `/admin/*
  Content-Security-Policy: ${ADMIN_CSP}

${publicCspBlocks}
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=()
`;
  fs.writeFileSync(path.join(DIST, '_headers'), headers);
  log('wrote _headers');
}

// Rewrites for hosts that read a _redirects file (Cloudflare Pages, Netlify).
// `sanity build` emits root-absolute asset URLs (/static/*, /vendor/*) even
// though the Studio is hosted under /admin, so those are rewritten to their real
// location; and /admin/* falls back to the Studio's index.html (single-page app).
// Real files are served before these 200 rewrites, so assets are unaffected.
function writeRedirects() {
  const redirects = `/static/*   /admin/static/:splat   200
/vendor/*   /admin/vendor/:splat   200
/admin/*    /admin/index.html      200
`;
  fs.writeFileSync(path.join(DIST, '_redirects'), redirects);
  log('wrote _redirects');
}

async function main() {
  log(`site URL: ${SITE_URL}`);
  rimraf(DIST);
  fs.mkdirSync(DIST, { recursive: true });
  copyShared();
  const sourceHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const content = await loadSiteContent({root: ROOT, log});
  writeProductionsBundle(path.join(DIST, 'assets/js/productions.js'), content.productions);
  for (const locale of Object.keys(LOCALES)) buildLocale(locale, sourceHtml, content);
  writeRootChooser();
  writeHeaders();
  writeRedirects();
  log('done.');
}

main();
