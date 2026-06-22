/* photo-slideshow.js - turns each gallery photo box into a self-contained
   4-slide auto show. Slides are sourced from the cards' existing data-gallery-*
   attributes (single source of truth), so the live preview dialog keeps working
   and stays in sync with whatever slide is showing.

   The four boxes advance on ONE lockstep ticker with a per-box index offset, so
   the wall always shows a rotation of the full set - the four frames on screen
   are never duplicates. A per-box reveal delay keeps it feeling organic rather
   than synchronized. Each box uses a different reveal mode. The ticker pauses
   while any box is hovered/focused, while the tab is hidden, and under reduced
   motion (which shows one static slide per box). */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('js')) return;

  const cards = Array.from(document.querySelectorAll('.gallery-card[data-gallery-src]'));
  if (cards.length < 2) return;

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

  // One catalogue, built from the cards themselves (DOM order = Stage, Backstage,
  // Script, Curtain). Every box cycles the full set.
  const studies = cards.map((card) => ({
    src: card.dataset.gallerySrc,
    titleEn: card.dataset.galleryTitle || '',
    titleFa: card.dataset.galleryTitleFa || '',
    copyEn: card.dataset.galleryCopy || '',
    copyFa: card.dataset.galleryCopyFa || ''
  }));
  const N = studies.length;

  const MODES = ['curtain', 'rise', 'dissolve', 'iris'];
  const DWELL = 5200; // ms a slide rests before the wall advances
  const boxes = [];

  cards.forEach((card, ci) => {
    const caption = card.querySelector(':scope > span'); // capture BEFORE adding a second span
    const labelStrong = caption && caption.querySelector('strong');
    const numberEl = caption && caption.querySelector('[aria-hidden="true"]');
    const origImg = card.querySelector('img');
    if (!origImg) return;

    const stage = document.createElement('span');
    stage.className = 'gallery-stage';
    stage.dataset.anim = MODES[ci % MODES.length];
    stage.setAttribute('aria-hidden', 'true'); // decorative; the caption names the active study
    stage.style.setProperty('--dwell', ((DWELL + 920) / 1000).toFixed(2) + 's');
    stage.style.setProperty('--reveal-delay', ci * 120 + 'ms'); // organic per-box offset

    const createSlide = () => {
      const img = document.createElement('img');
      img.className = 'gallery-slide';
      img.alt = '';
      img.width = 1200;
      img.height = 800;
      img.loading = 'lazy';
      img.decoding = 'async';
      return img;
    };
    const slides = [createSlide(), createSlide()];
    slides.forEach((img) => stage.append(img));

    const dots = document.createElement('span');
    dots.className = 'gallery-dots';
    const dotEls = studies.map(() => {
      const dot = document.createElement('i');
      dot.className = 'gallery-dot';
      dots.append(dot);
      return dot;
    });
    stage.append(dots);

    origImg.replaceWith(stage);

    const box = {
      offset: ci,
      current: ci % N,
      activeSlide: slides[0],
      idleSlide: slides[1]
    };

    box.paint = (index, animate) => {
      const study = studies[index];
      const incoming = animate ? box.idleSlide : box.activeSlide;
      const outgoing = animate ? box.activeSlide : box.idleSlide;

      incoming.src = study.src;
      incoming.classList.remove('is-prev');
      incoming.classList.add('is-active');
      outgoing.classList.remove('is-active');
      outgoing.classList.toggle('is-prev', animate && Boolean(outgoing.getAttribute('src')));

      if (animate) {
        box.activeSlide = incoming;
        box.idleSlide = outgoing;
      }

      box.current = index;
      dotEls.forEach((dot, i) => dot.classList.toggle('is-on', i === index));
      if (labelStrong) {
        // Rebuild the bilingual label so the language toggle keeps working.
        const en = document.createElement('span');
        en.className = 'en';
        en.textContent = study.titleEn;
        const fa = document.createElement('span');
        fa.className = 'fa';
        fa.lang = 'fa';
        fa.dir = 'rtl';
        fa.textContent = study.titleFa;
        labelStrong.replaceChildren(en, fa);
      }
      if (numberEl) numberEl.textContent = String(index + 1).padStart(2, '0');

      // Keep the preview dialog pointed at what is currently on screen.
      card.dataset.gallerySrc = study.src;
      card.dataset.galleryTitle = study.titleEn;
      card.dataset.galleryTitleFa = study.titleFa;
      card.dataset.galleryCopy = study.copyEn;
      card.dataset.galleryCopyFa = study.copyFa;
    };

    box.paint(box.current, false);
    boxes.push(box);
  });

  // --- Single lockstep ticker -------------------------------------------------
  let tick = 0;
  let timer = 0;
  const anyEngaged = () => cards.some((card) => card.matches(':hover, :focus-within'));

  const step = () => {
    tick += 1;
    boxes.forEach((box) => box.paint((tick + box.offset) % N, true));
  };
  const play = () => {
    if (timer || reduceMQ.matches || document.hidden || anyEngaged()) return;
    timer = setInterval(step, DWELL);
  };
  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = 0;
  };
  const sync = () => (reduceMQ.matches || document.hidden || anyEngaged() ? stop() : play());

  const engageEvents = ['pointerenter', 'pointerleave', 'focusin', 'focusout'];
  cards.forEach((card) => {
    engageEvents.forEach((ev) => card.addEventListener(ev, sync));
  });
  document.addEventListener('visibilitychange', sync);

  // Lifecycle: never let an interval or the start-up timeout outlive the page.
  // On bfcache restore (pageshow.persisted) re-evaluate whether to resume.
  let startTimer = 0;
  const teardown = () => {
    stop();
    if (startTimer) { clearTimeout(startTimer); startTimer = 0; }
  };
  window.addEventListener('pagehide', teardown);
  window.addEventListener('pageshow', (event) => { if (event.persisted) sync(); });

  if (!reduceMQ.matches) startTimer = setTimeout(play, 800);
})();
