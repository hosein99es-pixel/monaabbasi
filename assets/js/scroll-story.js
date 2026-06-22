// Scroll-storytelling layer (prologue mask morph, curtain wipe, act cues).
// Externalised from an inline <script> so a strict CSP (script-src 'self')
// can be enforced. Self-contained; reduced-motion + try/catch guarded.
// === SCROLL STORY JS ===
// Additive scroll-storytelling layer. Lives entirely in this one block.
// Never edits existing scripts; coexists with motion.js. All work is gated by
// a reduced-motion check and wrapped in try/catch so any failure leaves the
// original site fully functional.
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  function boot() {
    try {
      var cue = 'cubic-bezier(0.16, 1, 0.3, 1)';

      /* ---------- PART ONE: PROLOGUE CONTROLLER ----------
         Scroll-driven mask cross-fade (comedy<->tragedy) through the prologue
         wrapper, then a feathered curtain wipe that reveals Act 01 cleanly
         beneath it without a transparent overlap or exposed scroll layer.
         The hero headline reveal is deferred until the
         curtain has lifted. Note: we intentionally do NOT lock body scroll
         — the effect is *driven* by scroll, so locking it would freeze the
         animation. Reduced motion / JS-off / errors all bypass it. */
      var heroReveal = function () {};
      var prologueDone = false;
      var proWrap = document.getElementById('prologue-scroll-wrapper');
      var prologue = document.getElementById('prologue');
      var pCue = prologue ? prologue.querySelector('.prologue-cue') : null;
      var lStart = document.getElementById('left-comedy');
      var lEnd = document.getElementById('left-tragedy');
      var rStart = document.getElementById('right-tragedy');
      var rEnd = document.getElementById('right-comedy');
      function prologueHeight() { return proWrap ? proWrap.offsetHeight : 0; }

      // Typewriter tagline (machine-write effect), runs while the card is up
      var tagText = prologue ? prologue.querySelector('.prologue-tagline .pt-text') : null;
      var tagCaret = prologue ? prologue.querySelector('.prologue-tagline .pt-caret') : null;
      if (tagText) {
        var tagMsg = 'I am Fateme Abbasi. An Actress.';
        var ti = 0;
        var typeNext = function () {
          if (ti <= tagMsg.length) {
            tagText.textContent = tagMsg.slice(0, ti);
            ti++;
            // tiny pause after the sentence-ending period for rhythm
            var prev = tagMsg.charAt(ti - 2);
            setTimeout(typeNext, prev === '.' ? 360 : 58);
          } else if (tagCaret) {
            setTimeout(function () { tagCaret.style.animation = 'none'; tagCaret.style.opacity = '0'; }, 1400);
          }
        };
        setTimeout(typeNext, 550);
      }

      if (prologue && proWrap && lStart && lEnd && rStart && rEnd) {
        var pTicking = false;
        var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
        var renderProlog = function () {
          pTicking = false;
          // Range = full wrapper height (NOT minus innerHeight): progress hits 1
          // exactly when the hero scrolls to the top, so the curtain lift and the
          // site reveal happen simultaneously with no empty gap afterwards.
          var range = proWrap.offsetHeight;
          var progress = range > 0 ? clamp01((window.scrollY - proWrap.offsetTop) / range) : 1;

          // Mask morph: begins at 15% scroll, completes at 60% (then a brief hold)
          var mp = clamp01((progress - 0.15) / 0.45);
          lStart.style.opacity = String(1 - mp);
          lEnd.style.opacity = String(mp);
          rStart.style.opacity = String(1 - mp);
          rEnd.style.opacity = String(mp);

          if (pCue) pCue.style.opacity = String(Math.max(0, 0.7 - progress * 5));
          if (tagText && tagText.parentNode) tagText.parentNode.style.opacity = String(Math.max(0, 1 - progress * 3.5));

          var EXIT_START = 0.55; // start once Act 01 is entering beneath the curtain
          if (progress >= EXIT_START) {
            // Phase 2: a single feathered wipe avoids double-exposed scenes.
            // Keep the card mounted during reverse scrolling until the wipe
            // has fully completed.
            var exit = clamp01((progress - EXIT_START) / (1 - EXIT_START));
            if (prologue.style.display === 'none' && exit < 0.999) prologue.style.display = '';
            prologue.style.setProperty('--prologue-clip', (exit * 100).toFixed(3) + '%');
            prologue.style.transform = 'none';
            prologue.style.opacity = '1';
            if (exit >= 0.999) { // tolerance: float division never hits exactly 1
              if (prologue.style.display !== 'none') prologue.style.display = 'none';
              if (!prologueDone) { prologueDone = true; requestAnimationFrame(heroReveal); }
            }
          } else {
            // Reversible: if user scrolls back up, bring the curtain back
            if (prologue.style.display === 'none') prologue.style.display = '';
            prologue.style.setProperty('--prologue-clip', '0%');
            prologue.style.transform = 'none';
            prologue.style.opacity = '1';
          }
        };
        var onScrollProlog = window.scrollStage ? renderProlog : function () {
          if (pTicking) return;
          pTicking = true;
          requestAnimationFrame(renderProlog);
        };
        if (window.scrollStage) {
          window.scrollStage.subscribe(onScrollProlog, { immediate: false });
        } else {
          window.addEventListener('scroll', onScrollProlog, { passive: true });
          window.addEventListener('resize', onScrollProlog, { passive: true });
        }
        renderProlog();
      } else {
        prologueDone = true; // no prologue present -> hero reveals normally
      }

      /* ---------- A. PROGRESS BAR ---------- */
      var bar = document.createElement('div');
      bar.id = 'scroll-story-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
      var barTicking = false;
      function updateBar() {
        barTicking = false;
        // Only start filling once the prologue has been scrolled past
        var pH = prologueHeight();
        var scrollable = document.body.scrollHeight - window.innerHeight - pH;
        var pct = scrollable > 0 ? Math.max(0, (window.scrollY - pH) / scrollable) * 100 : 0;
        bar.style.transform = 'scaleX(' + (Math.min(100, pct) / 100).toFixed(4) + ')';
      }
      var onScrollBar = window.scrollStage ? updateBar : function () {
        if (barTicking) return;
        barTicking = true;
        requestAnimationFrame(updateBar);
      };
      if (window.scrollStage) {
        window.scrollStage.subscribe(onScrollBar, { immediate: false });
      } else {
        window.addEventListener('scroll', onScrollBar, { passive: true });
        window.addEventListener('resize', onScrollBar, { passive: true });
      }
      updateBar();

      /* ---------- B. SECTION ENTRANCES (scroll reveal) ----------
         Reveal targets are derived from each section's EXISTING semantic class
         rather than hand-stamping s-hidden onto every bilingual node. Same
         visual behavior, but additive and safe for the .en/.fa structure. */
      var io = ('IntersectionObserver' in window)
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                e.target.classList.add('s-visible');
                io.unobserve(e.target);
              }
            });
          }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' })
        : null;

      function hide(el, variant) {
        if (!el) return;
        el.classList.add('s-hidden');
        if (variant === 'left') el.classList.add('s-left');
        if (variant === 'fade') el.classList.add('s-fade');
        if (io) io.observe(el); else el.classList.add('s-visible');
      }
      function stagger(list, step, variant) {
        Array.prototype.forEach.call(list, function (el, i) {
          el.style.transitionDelay = (i * step) + 's';
          hide(el, variant);
        });
      }

      document.querySelectorAll('main > section').forEach(function (sec) {
        if (sec.classList.contains('hero')) return; // hero handled by load sequence
        if (sec.classList.contains('biography')) {
          // text-heavy: reveal heading + paragraphs individually, staggered
          var kids = sec.querySelectorAll('.bio-copy > h2, .bio-copy > p, .education__list .education-card');
          stagger(kids, 0.1);
        } else if (sec.classList.contains('work')) {
          // project/work: leftward slide, per-card stagger
          stagger(sec.querySelectorAll('.work-card'), 0.08, 'left');
          hide(sec.querySelector('.timeline'));
        } else if (sec.classList.contains('about')) {
          // list/card sections (awards, teaching, downloads): top-to-bottom
          hide(sec.querySelector('.section-heading'));
          stagger(sec.querySelectorAll('.about__grid > .card'), 0.08);
        } else if (sec.classList.contains('gallery')) {
          hide(sec.querySelector('.section-heading'));
          stagger(sec.querySelectorAll('.gallery-card'), 0.08);
        } else if (sec.classList.contains('contact')) {
          // contact: opacity only, stays grounded
          hide(sec.querySelector('h2'), 'fade');
          hide(sec.querySelector('.contact-card'), 'fade');
        } else {
          // plain section (upcoming)
          hide(sec.querySelector('.reel-panel') || sec);
        }
      });

      /* ---------- C. HERO ENTRANCE SEQUENCE ----------
         English is split for the type-like reveal. Persian stays whole so Arabic
         shaping, RTL order, and the language toggle remain intact. */
      var heroTitle = document.querySelector('[data-hero-title]');
      if (heroTitle) {
        var langSpans = heroTitle.querySelectorAll(':scope > span');
        if (!langSpans.length) langSpans = [heroTitle];
        var animatedTitlePieces = [];
        Array.prototype.forEach.call(langSpans, function (span) {
          var isPersian = span.matches('.fa, [lang="fa"], [dir="rtl"]');
          var text = span.textContent;
          if (isPersian) {
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(16px)';
            span.style.transition = 'opacity 0.55s 0.08s ' + cue + ', transform 0.55s 0.08s ' + cue;
            animatedTitlePieces.push(span);
            return;
          }
          span.textContent = '';
          text.split('').forEach(function (ch, i) {
            var s = document.createElement('span');
            s.textContent = ch === ' ' ? ' ' : ch;
            s.style.display = 'inline-block';
            s.style.opacity = '0';
            s.style.transform = 'translateY(16px)';
            s.style.transition =
              'opacity 0.5s ' + (i * 0.04) + 's ' + cue +
              ', transform 0.5s ' + (i * 0.04) + 's ' + cue;
            span.appendChild(s);
            animatedTitlePieces.push(s);
          });
        });
        heroReveal = function () {
          animatedTitlePieces.forEach(function (s) {
            s.style.opacity = '1';
            s.style.transform = 'translateY(0)';
          });
        };
        // If the prologue is already gone (or absent), reveal right away;
        // otherwise the prologue controller fires heroReveal on curtain exit.
        if (prologueDone) requestAnimationFrame(heroReveal);
      }

      // Subtitle / role text fades in after the headline settles
      var subtitle = document.querySelector('.hero__summary');
      if (subtitle) {
        subtitle.style.opacity = '0';
        subtitle.style.transition = 'opacity 0.8s ' + cue;
        setTimeout(function () { subtitle.style.opacity = '1'; }, 600);
      }

      // Scroll cue: only injected if none already exists in the hero
      var hero = document.querySelector('.hero');
      if (hero && !hero.querySelector('.scroll-cue')) {
        if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
        var sc = document.createElement('span');
        sc.className = 'scroll-cue';
        sc.setAttribute('aria-hidden', 'true');
        sc.innerHTML =
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M12 5v14M19 12l-7 7-7-7"/></svg>';
        hero.appendChild(sc);
      }

      /* ---------- F. COUNTING NUMBERS ----------
         Stats are numbers carrying a %, +, x or k suffix. This page's numbers
         are Persian calendar years and ordinal labels (no suffix), so the gate
         intentionally matches nothing here and never mangles a year/ordinal. */
      function animateCount(el, target, suffix, duration) {
        duration = duration || 1200;
        var start = null, dec = (target % 1 !== 0);
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = eased * target;
          el.textContent = (dec ? val.toFixed(1) : Math.floor(val)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }
      var statRe = /^\s*(\d+(?:\.\d+)?)\s*([%+xk])\s*$/;
      var statObs = ('IntersectionObserver' in window)
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (!e.isIntersecting) return;
              var el = e.target, m = el.textContent.match(statRe);
              if (m) animateCount(el, parseFloat(m[1]), m[2]);
              statObs.unobserve(el);
            });
          }, { threshold: 0.6 })
        : null;
      if (statObs) {
        document.querySelectorAll('[data-count]').forEach(function (node) {
          if (statRe.test(node.textContent)) statObs.observe(node);
        });
      }

      /* ---------- G. HOVER MICRO-INTERACTIONS (self-drawing underline) ----------
         Applied only to plain in-content links that don't already have a hover
         treatment (nav links, .button, brand, and list links are skipped — they
         already animate in motion.css). */
      document.querySelectorAll('main a').forEach(function (a) {
        if (a.classList.contains('button')) return;
        if (a.closest('.nav-links, .contact-list, .brand, .button-row')) return;
        a.classList.add('s-link');
      });

      /* ---------- I. SIGNATURE MOMENT — Ambient Gradient Shift ----------
         Chosen for this design: dark/cinematic "Material Stage" with a single
         solid themed background. A custom cursor (Option A) would fight the
         hero pointer-tilt already in motion.js; the magnetic CTA (Option B)
         suits minimal/light layouts. The ambient shift is subliminal, works in
         both light and dark themes, and leaves the existing motion untouched.
         Reads the THEME background token via a probe (so it never fights the
         light/dark toggle) and nudges body bg within a few % as you scroll. */
      if (window.CSS && CSS.supports && CSS.supports('background-color', 'hsl(0 0% 0%)')) {
        var probe = document.createElement('div');
        probe.style.cssText =
          'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none;' +
          'background-color:var(--md-sys-color-background);';
        document.body.appendChild(probe);

        var readBaseHSL = function () {
          var rgb = getComputedStyle(probe).backgroundColor.match(/\d+(?:\.\d+)?/g);
          if (!rgb) return null;
          var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
          var h = 0, s = 0, l = (max + min) / 2;
          if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));
            switch (max) {
              case r: h = ((g - b) / d) % 6; break;
              case g: h = (b - r) / d + 2; break;
              default: h = (r - g) / d + 4;
            }
            h *= 60; if (h < 0) h += 360;
          }
          return { h: h, s: s * 100, l: l * 100 };
        };

        var gradTicking = false;
        var updateAmbient = function () {
          gradTicking = false;
          var base = readBaseHSL();
          if (!base) return;
          var scrollable = document.body.scrollHeight - window.innerHeight;
          var p = scrollable > 0 ? window.scrollY / scrollable : 0;
          var wave = Math.sin(p * Math.PI * 2);
          var l = Math.max(0, Math.min(100, base.l + wave * 2.2)); // within a few %
          var h = (base.h + wave * 4 + 360) % 360;
          document.body.style.backgroundColor =
            'hsl(' + h.toFixed(1) + ' ' + base.s.toFixed(1) + '% ' + l.toFixed(1) + '%)';
        };
        var onScrollGrad = window.scrollStage ? updateAmbient : function () {
          if (gradTicking) return;
          gradTicking = true;
          requestAnimationFrame(updateAmbient);
        };
        if (window.scrollStage) {
          window.scrollStage.subscribe(onScrollGrad, { immediate: false });
        } else {
          window.addEventListener('scroll', onScrollGrad, { passive: true });
        }
        updateAmbient();
      }
    } catch (e) {
      // Never leave the visitor trapped behind a half-built curtain
      var pgw = document.getElementById('prologue-scroll-wrapper');
      var pg = document.getElementById('prologue');
      if (pg) pg.style.display = 'none';
      if (pgw) pgw.style.height = '0';
      console.warn('[scroll-story] Enhancement failed gracefully:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
