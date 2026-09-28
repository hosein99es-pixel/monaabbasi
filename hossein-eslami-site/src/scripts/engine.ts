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

// Horizontal galleries: the section is as tall as the strip is wide, so vertical scroll moves it sideways.
function measure() {
  if (reduce) return;
  for (const g of galleries) {
    const track = g.querySelector<HTMLElement>('.hg__track');
    if (!track) continue;
    const dist = Math.max(0, track.scrollWidth - root.clientWidth);
    g.style.setProperty('--dist', `${dist}px`);
    g.style.height = `calc(100svh + ${dist}px)`;
  }
  lenis?.resize();
  update();
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
      }
    }
  }
  const max = root.scrollHeight - vh;
  if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}

let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
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
