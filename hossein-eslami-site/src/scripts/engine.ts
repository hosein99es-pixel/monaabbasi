// Scroll engine: every [data-scene] gets --p (0..1) = how far the page has scrolled through it.
// CSS turns --p into transforms/opacity, so all motion is scrubbed by the visitor's own scroll.
import Lenis from 'lenis';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const galleries = [...document.querySelectorAll<HTMLElement>('[data-hg]')];
const bar = document.querySelector<HTMLElement>('.progress span');
const last = new WeakMap<HTMLElement, string>();

function measure() {
  for (const g of galleries) {
    const track = g.querySelector<HTMLElement>('.hg__track');
    if (!track) continue;
    const dist = Math.max(0, track.scrollWidth - innerWidth);
    g.style.setProperty('--dist', `${dist}px`);
    g.style.height = `${innerHeight + dist}px`;
  }
  update();
}

function update() {
  const vh = innerHeight;
  for (const s of scenes) {
    const r = s.getBoundingClientRect();
    const span = Math.max(1, r.height - vh);
    const p = Math.min(1, Math.max(0, -r.top / span)).toFixed(4);
    if (last.get(s) !== p) {
      last.set(s, p);
      s.style.setProperty('--p', p);
    }
  }
  const max = root.scrollHeight - vh;
  if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
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
} else {
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
}
addEventListener('resize', measure);
addEventListener('load', measure);
measure();

// in-page navigation (smooth with Lenis, instant with reduced motion)
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    const el = id === '#top' ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    root.classList.remove('menu-open');
    menu?.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.4 });
    else (el as HTMLElement).scrollIntoView();
    if (id !== '#top') history.replaceState(null, '', id);
  }),
);

// mobile menu
const menu = document.querySelector<HTMLButtonElement>('.nav__menu');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  root.classList.toggle('menu-open', open);
});

// blocks that fade/rise in once
const rv = document.querySelectorAll('.rv');
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -10% 0px' },
  );
  rv.forEach((el) => io.observe(el));
} else rv.forEach((el) => el.classList.add('in'));

// nav: which chapter is on screen (sets the accent colour of the nav)
const chapters = document.querySelectorAll<HTMLElement>('[data-accent]');
const navEl = document.querySelector<HTMLElement>('.nav');
if ('IntersectionObserver' in window && navEl) {
  const io2 = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && navEl.style.setProperty('--nav-acc', (e.target as HTMLElement).dataset.accent!)),
    { rootMargin: '-10% 0px -85% 0px' },
  );
  chapters.forEach((c) => io2.observe(c));
}
