import { SHOW_PLACEHOLDERS } from '../consts';

const PH = /\[[^\]]+\]/g;

/** Text with any [PLACEHOLDER] removed (and the separator before it). */
export const clean = (s = '') => s.replace(/\s*[·,&]?\s*\[[^\]]+\]/g, '').trim();

/** Should this value be shown at all? */
export const visible = (s = '') => (SHOW_PLACEHOLDERS ? s.trim() !== '' : clean(s) !== '');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML for a value: placeholders highlighted in review mode, removed otherwise. */
export const html = (s = '') =>
  SHOW_PLACEHOLDERS ? esc(s).replace(PH, (m) => `<span class="ph">${m}</span>`) : esc(clean(s));

export const pad = (n: number) => String(n).padStart(2, '0');
