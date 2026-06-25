// Headless runtime smoke test for the built site (no real browser needed).
// Loads dist/en/index.html in jsdom, polyfills the few browser APIs jsdom lacks,
// executes the real site scripts, opens a Theatre work-card modal, and fails if
// any script throws or the modal does not populate. Run: node scripts/smoke.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = path.join(ROOT, 'dist', 'en', 'index.html');
if (!fs.existsSync(route)) {
  console.error('[smoke] dist/en/index.html missing — run `npm run build` first.');
  process.exit(1);
}

const errors = [];
const dom = new JSDOM(fs.readFileSync(route, 'utf8'), {
  url: pathToFileURL(route).href,
  runScripts: 'dangerously',
  pretendToBeVisual: true,
});
const { window } = dom;

// Capture anything the page logs as an error.
window.addEventListener('error', (e) => errors.push(String(e.error || e.message)));
window.onerror = (m) => errors.push(String(m));

// --- Polyfills for APIs jsdom does not implement (so scripts run as in a browser) ---
if (!window.matchMedia) {
  window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null });
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
}
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}
// jsdom <dialog> lacks showModal/close — approximate open/close state.
const Dialog = window.HTMLDialogElement && window.HTMLDialogElement.prototype;
if (Dialog && !Dialog.showModal) {
  Dialog.showModal = function () { this.open = true; this.setAttribute('open', ''); };
  Dialog.show = function () { this.open = true; this.setAttribute('open', ''); };
  Dialog.close = function () { this.open = false; this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
}

// --- Execute the site scripts in document order (head bootstrap, then deferred). ---
const scripts = [...window.document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'));
for (const src of scripts) {
  const file = path.resolve(path.dirname(route), src);
  if (!fs.existsSync(file)) { errors.push(`missing script ${src}`); continue; }
  try {
    const el = window.document.createElement('script');
    el.textContent = fs.readFileSync(file, 'utf8');
    window.document.head.appendChild(el); // runScripts:dangerously executes injected text
  } catch (err) {
    errors.push(`exec ${src}: ${err.message}`);
  }
}

// Fire DOMContentLoaded for listeners that wait on it.
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

// --- Open a Theatre work-card modal and check it populates. ---
const trigger = window.document.querySelector('[data-work]');
const modal = window.document.querySelector('#production-modal');
let modalText = '';
if (trigger && modal) {
  trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  modalText = (window.document.querySelector('#production-title')?.textContent || '').trim();
}

// --- Report ---
const pass = trigger && modal && modalText.length > 0 && errors.length === 0;
console.log('[smoke] scripts executed   :', scripts.length);
console.log('[smoke] work-card trigger  :', trigger ? 'found' : 'MISSING');
console.log('[smoke] #production-modal  :', modal ? 'present' : 'MISSING');
console.log('[smoke] modal title filled :', modalText ? JSON.stringify(modalText) : '(empty)');
console.log('[smoke] runtime errors     :', errors.length ? errors : 'none');
console.log(pass ? '[smoke] PASS ✅' : '[smoke] FAIL ❌');
process.exit(pass ? 0 : 1);
