/* motion.js - scroll and pointer state for the Material Stage motion layer.
   CSS owns the animation; this file only feeds compositor-safe custom
   properties for stagger, parallax, and scroll progress. */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('js')) return;

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clampUnit = (value) => clamp(value, 0, 1);

  const SEQUENTIAL = ['.hero__content', '.production-body', '.gallery-preview-card > div'];
  const ROWWISE = ['.about__grid', '.education__list', '.work-grid', '.gallery-grid', '.timeline', '.contact-list', '.production-meta-grid', '.production-gallery'];
  const PROGRESS_SELECTORS = ['.section', '.statement', '.section-ornament', '.reel-panel', '.work-card', '.gallery-card', '.contact-card'];
  const TILT_SELECTORS = ['.card', '.education-card', '.bio-copy', '.contact-card', '.work-card', '.gallery-card', '.reel-panel', '.upcoming-image-card'];
  const PARALLAX_SPECS = [
    ['.hero__media img', 0.12, 40],
    ['.bio-mark', -0.055, 26],
    ['.section-ornament svg', 0.08, 18],
    ['.reel-panel', -0.035, 18],
    ['.work-card__media img', 0.045, 20],
    ['.gallery-card img', 0.06, 24]
  ];

  const tiltEl = document.querySelector('.hero__media');
  const tilt = { tx: 0, ty: 0, cx: 0, cy: 0 };
  const MAX_TILT = 4;
  let parallaxTargets = [];
  let progressTargets = [];
  let visible = new WeakSet();
  let ticking = false;

  const setRowwiseStagger = () => {
    SEQUENTIAL.forEach((selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        Array.from(group.children).forEach((child, index) => child.style.setProperty('--si', index));
      });
    });

    ROWWISE.forEach((selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        const rows = new Map();
        Array.from(group.children).forEach((child) => {
          const top = Math.round(child.offsetTop);
          if (!rows.has(top)) rows.set(top, []);
          rows.get(top).push(child);
        });
        rows.forEach((row) => row.forEach((child, index) => child.style.setProperty('--si', index)));
      });
    });
  };

  const collectTargets = () => {
    const seenParallax = new WeakSet();
    parallaxTargets = [];
    progressTargets = [];

    PARALLAX_SPECS.forEach(([selector, speed, limit]) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (seenParallax.has(el)) return;
        seenParallax.add(el);
        el.dataset.parallax = '';
        parallaxTargets.push({ el, speed, limit });
      });
    });

    PROGRESS_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.dataset.scrollProgress = '';
        progressTargets.push(el);
      });
    });
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
          entry.target.classList.toggle('is-motion-active', entry.isIntersecting);
        });
        requestTick();
      }, { rootMargin: '24% 0px 24% 0px' })
    : null;

  const observeTargets = () => {
    if (!observer) {
      parallaxTargets.forEach(({ el }) => visible.add(el));
      progressTargets.forEach((el) => visible.add(el));
      return;
    }
    parallaxTargets.forEach(({ el }) => observer.observe(el));
    progressTargets.forEach((el) => observer.observe(el));
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };

  function frame() {
    ticking = false;

    const viewportHeight = window.innerHeight || 1;
    const documentHeight = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    const viewportMid = viewportHeight / 2;
    const pageProgress = clampUnit(window.scrollY / documentHeight);

    root.style.setProperty('--page-progress', pageProgress.toFixed(4));
    root.classList.toggle('is-scrolled', window.scrollY > 24);

    progressTargets.forEach((el) => {
      if (!visible.has(el)) return;
      const rect = el.getBoundingClientRect();
      const progress = clampUnit((viewportHeight - rect.top) / (viewportHeight + rect.height));
      const signed = clamp((rect.top + rect.height / 2 - viewportMid) / viewportHeight, -1, 1);
      el.style.setProperty('--view-progress', progress.toFixed(4));
      el.style.setProperty('--view-signed', signed.toFixed(4));
    });

    parallaxTargets.forEach(({ el, speed, limit }) => {
      if (!visible.has(el)) return;
      const rect = el.getBoundingClientRect();
      const signed = clamp((rect.top + rect.height / 2 - viewportMid) / viewportHeight, -1, 1);
      const py = clamp(signed * viewportHeight * speed, -limit, limit);
      el.style.setProperty('--py', `${py.toFixed(2)}px`);
    });

    tilt.cx += (tilt.tx - tilt.cx) * 0.12;
    tilt.cy += (tilt.ty - tilt.cy) * 0.12;
    if (tiltEl) {
      tiltEl.style.setProperty('--rx', `${tilt.cx.toFixed(3)}deg`);
      tiltEl.style.setProperty('--ry', `${tilt.cy.toFixed(3)}deg`);
    }

    if (Math.abs(tilt.tx - tilt.cx) > 0.005 || Math.abs(tilt.ty - tilt.cy) > 0.005) requestTick();
  }

  const bindPointerTilt = () => {
    if (!finePointer.matches || !tiltEl) return;

    tiltEl.addEventListener('pointermove', (event) => {
      const rect = tiltEl.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.ty = clamp(nx * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      tilt.tx = clamp(-ny * MAX_TILT * 2, -MAX_TILT, MAX_TILT);
      requestTick();
    });

    tiltEl.addEventListener('pointerleave', () => {
      tilt.tx = 0;
      tilt.ty = 0;
      requestTick();
    });
  };

  const bindCardTilt = () => {
    if (!finePointer.matches) return;

    document.querySelectorAll(TILT_SELECTORS.join(',')).forEach((el) => {
      if (el.dataset.tiltBound === 'true') return;
      el.dataset.tiltBound = 'true';

      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--ry', `${clamp(nx * MAX_TILT * 1.8, -MAX_TILT, MAX_TILT).toFixed(3)}deg`);
        el.style.setProperty('--rx', `${clamp(-ny * MAX_TILT * 1.8, -MAX_TILT, MAX_TILT).toFixed(3)}deg`);
      });

      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  };

  const start = () => {
    if (reduceMQ.matches) {
      root.classList.remove('is-scrolled');
      return;
    }

    setRowwiseStagger();
    collectTargets();
    observeTargets();
    bindPointerTilt();
    bindCardTilt();
    if (window.scrollStage?.subscribe) {
      window.scrollStage.subscribe(requestTick);
    } else {
      addEventListener('scroll', requestTick, { passive: true });
    }
    addEventListener('resize', () => {
      setRowwiseStagger();
      requestTick();
    }, { passive: true });
    requestTick();
  };

  reduceMQ.addEventListener?.('change', () => location.reload());

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
