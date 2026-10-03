// Scroll engine: every [data-scene] gets --p (0..1) = how far the page has scrolled through it.
// CSS turns --p into transforms/opacity, so all motion is scrubbed by the visitor's own scroll.
// With "reduce motion" switched on, none of this runs and the CSS shows a static page instead.
import Lenis from 'lenis';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const galleries = [...document.querySelectorAll<HTMLElement>('[data-hg]')];
const bar = document.querySelector<HTMLElement>('.progress span');
const last = new WeakMap<HTMLElement, string>();

// Per gallery: how far the strip can travel, where each photo starts, and the footer controls.
interface Strip { track: HTMLElement; dist: number; offs: number[]; count: HTMLElement | null; btns: HTMLButtonElement[]; active: number }
const strips = new Map<HTMLElement, Strip>();
for (const g of galleries) {
  const track = g.querySelector<HTMLElement>('.hg__track');
  if (track) strips.set(g, { track, dist: 0, offs: [], count: g.querySelector('.hg__count b'), btns: [...g.querySelectorAll<HTMLButtonElement>('.hg__btn')], active: -1 });
}

// Horizontal galleries: the section is as tall as the strip is wide, so vertical scroll moves it sideways.
function measure() {
  for (const [g, st] of strips) {
    const items = [...st.track.children] as HTMLElement[];
    const first = items[0]?.offsetLeft ?? 0;
    st.offs = items.map((li) => li.offsetLeft - first);
    if (reduce) {
      st.dist = Math.max(0, st.track.scrollWidth - st.track.clientWidth);
      continue;
    }
    st.dist = Math.max(0, st.track.scrollWidth - root.clientWidth);
    g.style.setProperty('--dist', `${st.dist}px`);
    g.style.height = `calc(100svh + ${st.dist}px)`;
  }
  lenis?.resize();
  update();
}

// Footer of a strip: "03 / 12", arrows enabled or not, and the "that's all, keep scrolling" state at the end.
function syncStrip(g: HTMLElement, st: Strip, shift: number) {
  const atEnd = shift >= st.dist - 2;
  let a = 0;
  for (let i = 0; i < st.offs.length; i++) if (st.offs[i] <= shift + 40) a = i;
  if (atEnd) a = st.offs.length - 1;
  if (a !== st.active) {
    st.active = a;
    if (st.count) st.count.textContent = String(a + 1).padStart(2, '0');
  }
  g.toggleAttribute('data-end', st.dist > 0 && shift >= st.dist * 0.97);
  st.btns[0].disabled = shift <= 2;
  st.btns[1].disabled = atEnd;
}

function update() {
  const vh = innerHeight;
  if (!reduce) {
    for (const s of scenes) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue; // off screen: leave as is
      const span = Math.max(1, r.height - vh);
      const p = Math.min(1, Math.max(0, -r.top / span)).toFixed(4);
      if (last.get(s) !== p) {
        last.set(s, p);
        s.style.setProperty('--p', p);
        const st = strips.get(s);
        if (st) syncStrip(s, st, +p * st.dist);
      }
    }
  }
  const max = root.scrollHeight - vh;
  if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}

let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, gestureOrientation: 'both' }); // trackpad sideways swipes scroll the page too
  lenis.on('scroll', update);
  const raf = (t: number) => {
    lenis!.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });

// Re-measure only when the width changes (phones resize the height whenever the address bar moves).
let lastWidth = root.clientWidth;
addEventListener('resize', () => {
  if (root.clientWidth !== lastWidth) {
    lastWidth = root.clientWidth;
    measure();
  } else update();
});
measure();
// Arriving with /#section (e.g. from the 404 page): jump there once the tall scenes have their final size.
function jumpToHash() {
  const target = location.hash && document.querySelector<HTMLElement>(location.hash);
  if (!target) return;
  const y = target.getBoundingClientRect().top + scrollY;
  scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
  update();
}
const onReady = () => {
  measure();
  requestAnimationFrame(jumpToHash);
};
if (document.readyState === 'complete') onReady();
else addEventListener('load', onReady);

// Strip arrows: jump to the previous or next photo. The page scrolls, so the visitor sees the same motion as scrolling.
for (const [g, st] of strips) {
  for (const b of st.btns)
    b.addEventListener('click', () => {
      const i = Math.min(st.offs.length - 1, Math.max(0, st.active + Number(b.dataset.dir)));
      const shift = Math.min(st.dist, st.offs[i]);
      if (reduce) return st.track.scrollTo({ left: shift });
      const y = g.getBoundingClientRect().top + scrollY + shift;
      if (lenis) lenis.scrollTo(y, { duration: 0.9 });
      else scrollTo(0, y);
    });
  if (reduce) {
    st.track.addEventListener('scroll', () => syncStrip(g, st, st.track.scrollLeft), { passive: true });
    continue;
  }
  // A sideways swipe on the strip moves it too (by scrolling the page), instead of doing nothing.
  let x0 = 0, y0 = 0, lastX = 0, sideways: boolean | null = null;
  const pin = g.querySelector<HTMLElement>('.hg__pin')!;
  pin.addEventListener('touchstart', (e) => {
    x0 = lastX = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    sideways = null;
  }, { passive: true });
  pin.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (sideways === null && Math.hypot(t.clientX - x0, t.clientY - y0) > 8) sideways = Math.abs(t.clientX - x0) > Math.abs(t.clientY - y0);
    if (!sideways) return;
    e.preventDefault();
    scrollBy(0, lastX - t.clientX);
    lastX = t.clientX;
  }, { passive: false });
}
for (const [g, st] of strips) if (st.active < 0) syncStrip(g, st, 0);

// If the visitor stops scrolling for a while, remind them there is more below.
const nudge = document.querySelector<HTMLElement>('.nudge');
let idle = 0;
const armNudge = () => {
  nudge?.classList.remove('on');
  clearTimeout(idle);
  idle = window.setTimeout(() => {
    const more = root.scrollHeight - (scrollY + innerHeight) > innerHeight * 0.6;
    if (nudge && more && scrollY > 80 && !root.classList.contains('menu-open') && !document.hidden) nudge.classList.add('on');
  }, 3500);
};
if (nudge) {
  addEventListener('scroll', armNudge, { passive: true });
  addEventListener('pointerdown', armNudge, { passive: true });
  addEventListener('keydown', armNudge);
  armNudge();
}

// mobile menu
const menu = document.querySelector<HTMLButtonElement>('.nav__menu');
const closeMenu = () => {
  root.classList.remove('menu-open');
  menu?.setAttribute('aria-expanded', 'false');
};
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  root.classList.toggle('menu-open', open);
});
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

// in-page navigation (smooth with Lenis, instant with reduced motion)
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not(.skip)').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    const el = id === '#top' ? document.body : document.querySelector<HTMLElement>(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView();
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  }),
);

// blocks that fade/rise in once
const rv = document.querySelectorAll('.rv');
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -10% 0px' },
  );
  rv.forEach((el) => io.observe(el));
} else rv.forEach((el) => el.classList.add('in'));

// accent colour of the chapter on screen, used by the menu bar and the progress line
const chapters = document.querySelectorAll<HTMLElement>('[data-accent]');
if ('IntersectionObserver' in window) {
  const io2 = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && root.style.setProperty('--nav-acc', (e.target as HTMLElement).dataset.accent!)),
    { rootMargin: '-10% 0px -85% 0px' },
  );
  chapters.forEach((c) => io2.observe(c));
}
