const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const persianTextRe = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const subscribeScroll = (callback, options) => {
  if (window.scrollStage?.subscribe) return window.scrollStage.subscribe(callback, options);
  callback();
  window.addEventListener('scroll', callback, { passive: true });
  window.addEventListener('resize', callback, { passive: true });
  return () => {
    window.removeEventListener('scroll', callback);
    window.removeEventListener('resize', callback);
  };
};

const appendBilingual = (parent, english, persian, className = 'bilingual') => {
  parent.className = className;
  const en = document.createElement('span');
  const fa = document.createElement('span');
  en.className = 'en';
  fa.className = 'fa';
  fa.lang = 'fa';
  fa.dir = 'rtl';
  if (persianTextRe.test(english || '')) {
    en.lang = 'fa';
    en.dir = 'rtl';
  }
  en.textContent = english || '';
  fa.textContent = persian || '';
  parent.replaceChildren(en, fa);
};

/* Bilingual accessible names for attributes that are written by JS (e.g. the
   document dialog's aria-label or dynamically generated gallery image alts).
   Each registered element keeps its English/Persian text and is re-localised
   whenever language.js announces a language change, so the accessible name
   always matches the active language. */
const currentLang = () => (document.documentElement.dataset.lang === 'fa' ? 'fa' : 'en');
const bilingualAttrEls = new Set();
const applyBilingualAttrs = (el) => {
  const store = el.__bilingualAttrs;
  if (!store) return;
  const fa = currentLang() === 'fa';
  Object.keys(store).forEach((attr) => el.setAttribute(attr, fa ? store[attr].fa : store[attr].en));
};
const setBilingualAttr = (el, attr, en, fa) => {
  if (!el) return;
  el.__bilingualAttrs = el.__bilingualAttrs || {};
  el.__bilingualAttrs[attr] = { en: en || '', fa: fa || '' };
  bilingualAttrEls.add(el);
  applyBilingualAttrs(el);
};
document.addEventListener('sitelanguagechange', () => {
  bilingualAttrEls.forEach(applyBilingualAttrs);
});

const initMobileNav = () => {
  const appBar = qs('.top-app-bar');
  const toggle = qs('.nav-toggle');
  const nav = qs('#primary-nav');
  if (!appBar || !toggle || !nav) return;

  const setOpen = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    setBilingualAttr(
      toggle,
      'aria-label',
      isOpen ? 'Close mobile navigation' : 'Open mobile navigation',
      isOpen ? 'بستن منوی موبایل' : 'باز کردن منوی موبایل'
    );
    nav.classList.toggle('is-open', isOpen);
  };

  // Localise the initial (closed) label so it is correct before any interaction.
  setOpen(toggle.getAttribute('aria-expanded') === 'true');

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (!appBar.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
};

const initTheme = () => {
  const root = document.documentElement;
  const toggle = qs('.theme-toggle');
  const themeMeta = qs('meta[name="theme-color"]');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const getStoredTheme = () => {
    try {
      return window.localStorage.getItem('mona-site-theme');
    } catch {
      return null;
    }
  };

  const getSystemTheme = () => prefersDark.matches ? 'dark' : 'light';

  const setTheme = (theme, shouldStore = true) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    toggle?.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    setBilingualAttr(
      toggle,
      'aria-label',
      nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      nextTheme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'
    );
    themeMeta?.setAttribute('content', nextTheme === 'dark' ? '#120d08' : '#fff8f6');

    if (shouldStore) {
      try {
        window.localStorage.setItem('mona-site-theme', nextTheme);
      } catch {
        // Storage may be unavailable in private browsing or strict browser modes.
      }
    }
  };

  setTheme(getStoredTheme() || getSystemTheme(), false);
  toggle?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  prefersDark.addEventListener?.('change', () => {
    if (!getStoredTheme()) setTheme(getSystemTheme(), false);
  });
};

const initReveal = () => {
  const revealItems = qsa('.reveal');
  // Tell the head-script fail-safe the reveal system is live so it won't
  // force-show everything. If this never runs (main.js failed to load/parse),
  // the flag stays unset and that fallback reveals content instead.
  const markReady = () => document.documentElement.setAttribute('data-reveal-ready', '');

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    markReady();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((item) => observer.observe(item));
  markReady();
};

const initHeroTitleReveal = () => {
  const title = qs('[data-hero-title]');
  if (!title) return;

  const revealPieces = () => {
    qsa(':scope > .fa, :scope > .en > span', title).forEach((piece) => {
      piece.style.opacity = '1';
      piece.style.transform = 'translateY(0)';
    });
  };

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealPieces();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealPieces();
      observer.disconnect();
    });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

  observer.observe(title);
};

const initPhotoReveal = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selector = 'img:not([data-no-photo-reveal])';
  const seen = new WeakSet();

  const markVisible = (image) => {
    image.classList.add('is-photo-visible');
  };

  if (reducedMotion || !('IntersectionObserver' in window)) {
    qsa(selector).forEach(markVisible);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      markVisible(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

  const observeImage = (image) => {
    if (!(image instanceof HTMLImageElement) || seen.has(image)) return;
    seen.add(image);
    observer.observe(image);
  };

  qsa(selector).forEach(observeImage);

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement && node.matches(selector)) observeImage(node);
        if (node instanceof Element) qsa(selector, node).forEach(observeImage);
      });
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Explicit lifecycle: stop watching the DOM and release the intersection
  // observer when the page is being unloaded/cached, so neither observer leaks.
  const teardown = () => {
    observer.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener('pagehide', teardown);
  };
  window.addEventListener('pagehide', teardown);
};

const getStorySections = () => qsa('[data-story-act]').map((section) => ({
  section,
  title: section.dataset.storyTitle || '',
  titleFa: section.dataset.storyTitleFa || '',
  act: section.dataset.storyAct || ''
}));

const initBrandSubtitle = () => {
  const subtitle = qs('.brand small');
  const navLinks = qsa('#primary-nav a[href^="#"]');
  const sections = getStorySections();

  if (!subtitle || !sections.length) return;

  const setSubtitle = ({ section, title, titleFa }) => {
    appendBilingual(subtitle, title, titleFa, 'bilingual');
    const activeHref = section.id ? `#${section.id}` : '#main';
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === activeHref) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };
  const updateSubtitle = () => {
    const marker = window.innerHeight * .34;
    const active = sections.find(({ section }) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom >= marker;
    }) || sections[0];
    setSubtitle(active);
  };

  subscribeScroll(updateSubtitle);
};

const initScrollStory = () => {
  const root = document.documentElement;
  const rail = qs('.story-rail');
  const title = qs('.story-rail__title', rail);
  const count = qs('.story-rail__count', rail);
  const sections = getStorySections();
  if (!rail || !title || !count || !sections.length) return;

  let activeSection = null;
  const setActive = (item, index) => {
    if (!item || activeSection === item.section) return;
    activeSection = item.section;
    sections.forEach(({ section }) => section.classList.toggle('story-is-active', section === item.section));
    appendBilingual(title, item.title, item.titleFa, 'story-rail__title bilingual');
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`;
  };

  const update = () => {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    root.style.setProperty('--story-progress', progress.toFixed(3));

    const marker = window.innerHeight * .42;
    const activeIndex = Math.max(0, sections.findIndex(({ section }) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom >= marker;
    }));
    setActive(sections[activeIndex] || sections[0], activeIndex);
  };

  subscribeScroll(update);
};

const initAdaptiveHeader = () => {
  const appBar = qs('.top-app-bar');
  const hero = qs('[data-story-act="01"]');
  if (!appBar || !hero) return;

  const update = () => {
    const heroRect = hero.getBoundingClientRect();
    const shouldDock = heroRect.bottom <= window.innerHeight * .38;
    const dockOffset = Math.max(0, window.innerHeight - appBar.offsetHeight - 16);
    appBar.style.setProperty('--header-dock-offset', `${dockOffset}px`);
    appBar.classList.toggle('is-bottom-docked', shouldDock);
  };

  subscribeScroll(update);
};

const initEndingTypewriter = () => {
  const line = qs('.ending-section__line[data-typewriter-text]');
  if (!line) return;

  const message = line.dataset.typewriterText || line.textContent.trim();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hasTyped = false;
  let frameId = 0;

  line.setAttribute('aria-label', message);

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    line.textContent = message;
    return;
  }

  line.textContent = '';

  const type = () => {
    if (hasTyped) return;
    hasTyped = true;
    let index = 0;
    line.classList.add('is-typewriting');

    const step = () => {
      line.textContent = message.slice(0, index);
      index += 1;

      if (index <= message.length) {
        frameId = window.setTimeout(step, index === 1 ? 160 : 62);
        return;
      }

      line.textContent = message;
      line.classList.remove('is-typewriting');
      line.classList.add('is-typewritten');
    };

    step();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      type();
      observer.disconnect();
    });
  }, { threshold: .45 });

  observer.observe(line);

  window.addEventListener('pagehide', () => {
    if (frameId) window.clearTimeout(frameId);
  }, { once: true });
};

const initHashAnchorStabilizer = () => {
  if (!window.location.hash) return;
  const targetId = decodeURIComponent(window.location.hash.slice(1));
  if (!targetId) return;

  const scrollToTarget = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
  };

  requestAnimationFrame(scrollToTarget);
  window.addEventListener('load', () => {
    requestAnimationFrame(scrollToTarget);
    window.setTimeout(scrollToTarget, 900);
    window.setTimeout(scrollToTarget, 2200);
  }, { once: true });
};

const initProductionDialog = () => {
  const dialog = qs('#production-modal');
  const controller = createDialogController(dialog);
  const title = qs('#production-title');
  const summary = qs('#production-summary');
  const hero = qs('#production-hero');
  const chips = qs('#production-chips');
  const metaGrid = qs('.production-meta-grid', dialog);
  const text = qs('#production-text');
  const gallery = qs('#production-gallery');

  const lightbox = qs('#image-lightbox');
  const lightboxController = createDialogController(lightbox);
  const lightboxImage = qs('img', lightbox);
  const lightboxCaption = qs('figcaption', lightbox);

  const render = (production) => {
    if (!production || !title || !summary || !hero || !chips || !metaGrid || !text || !gallery) return false;

    hero.src = production.hero;
    setBilingualAttr(hero, 'alt', `Portfolio image for ${production.title}`, `تصویر پرتفولیو برای ${production.titleFa}`);
    appendBilingual(title, production.title, production.titleFa, 'bilingual');
    appendBilingual(summary, production.summary, production.summaryFa, 'production-summary bilingual');

    const chipFragment = document.createDocumentFragment();
    [
      [production.role, production.roleFa, 'chip chip--primary'],
      [production.year, production.yearFa || production.year, 'chip'],
      [production.venue, production.venueFa, 'chip']
    ].filter(([enText, faText]) => enText || faText).forEach(([enText, faText, className]) => {
      const chip = document.createElement('span');
      appendBilingual(chip, enText, faText, className);
      chipFragment.append(chip);
    });
    chips.replaceChildren(chipFragment);

    const metaFragment = document.createDocumentFragment();
    [
      ['Role', 'نقش', production.role, production.roleFa],
      ['Director', 'کارگردان', production.director, production.directorFa],
      ['Venue', 'سالن', production.venue, production.venueFa],
      ['Festival / Date', 'جشنواره / تاریخ', production.festival, production.festivalFa]
    ].filter(([, , value, valueFa]) => value || valueFa).forEach(([term, termFa, value, valueFa]) => {
      const group = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      appendBilingual(dt, term, termFa, 'bilingual');
      appendBilingual(dd, value, valueFa, 'bilingual');
      group.append(dt, dd);
      metaFragment.append(group);
    });
    metaGrid.replaceChildren(metaFragment);

    const textFragment = document.createDocumentFragment();
    production.paragraphs.forEach((copy, index) => {
      const paragraph = document.createElement('p');
      appendBilingual(paragraph, copy, production.paragraphsFa[index], 'bilingual');
      textFragment.append(paragraph);
    });

    if (production.links?.length) {
      const links = document.createElement('p');
      links.className = 'production-links';
      production.links.forEach(([label, href], index) => {
        if (index) links.append(document.createTextNode(' · '));
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = label;
        links.append(anchor);
      });
      textFragment.append(links);
    }
    text.replaceChildren(textFragment);

    const galleryFragment = document.createDocumentFragment();
    production.images.forEach(([caption, captionFa, src], index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const image = document.createElement('img');
      const label = document.createElement('span');
      button.type = 'button';
      button.dataset.src = src;
      button.dataset.caption = caption;
      button.dataset.captionFa = captionFa;
      setBilingualAttr(button, 'aria-label', `Open portfolio image ${index + 1}: ${caption}`, `باز کردن تصویر ${index + 1}: ${captionFa}`);
      image.src = src;
      setBilingualAttr(image, 'alt', `${caption}, portfolio image`, `${captionFa}، تصویر پرتفولیو`);
      image.width = 1200;
      image.height = 800;
      image.loading = 'lazy';
      image.decoding = 'async';
      appendBilingual(label, caption, captionFa, 'bilingual');
      button.append(image, label);
      item.append(button);
      galleryFragment.append(item);
    });
    gallery.replaceChildren(galleryFragment);

    return true;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-work]');
    if (!trigger) return;
    const production = productions[trigger.dataset.work];
    dialog?.classList.add('is-loading');
    const didRender = render(production);
    if (!didRender) {
      dialog?.classList.remove('is-loading');
      return;
    }
    controller.open(title, trigger);
    requestAnimationFrame(() => dialog?.classList.remove('is-loading'));
  });

  gallery?.addEventListener('click', (event) => {
    const thumb = event.target.closest('button');
    if (!thumb || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = thumb.dataset.src;
    setBilingualAttr(lightboxImage, 'alt', `${thumb.dataset.caption}, portfolio image for Fateme Abbasi`, `${thumb.dataset.captionFa}، تصویر پرتفولیوی فاطمه عباسی`);
    appendBilingual(lightboxCaption, thumb.dataset.caption, thumb.dataset.captionFa, 'bilingual');
    lightboxController.open(qs('[data-dialog-close]', lightbox), thumb);
  });
};

const initGalleryDialog = () => {
  const dialog = qs('#gallery-preview');
  const controller = createDialogController(dialog);
  const image = qs('#gallery-preview-image');
  const title = qs('#gallery-preview-title');
  const copy = qs('#gallery-preview-copy');

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-gallery-src]');
    if (!trigger || !image || !title || !copy) return;
    image.src = trigger.dataset.gallerySrc;
    setBilingualAttr(image, 'alt', `${trigger.dataset.galleryTitle} portfolio image for Fateme Abbasi`, `${trigger.dataset.galleryTitleFa}، تصویر پرتفولیوی فاطمه عباسی`);
    appendBilingual(title, trigger.dataset.galleryTitle, trigger.dataset.galleryTitleFa, 'bilingual');
    appendBilingual(copy, trigger.dataset.galleryCopy, trigger.dataset.galleryCopyFa, 'bilingual');
    controller.open(title, trigger);
  });
};

const toPersianDigits = (value) => String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

/* Derive the "N pages" copy from the embedded documents themselves so the count
   can never drift from reality: count the .pp page sections inside each
   print-document and write the number into its placeholders (Latin + Persian). */
const initDocumentPageCounts = () => {
  qsa('[data-document-kind]').forEach((documentNode) => {
    const kind = documentNode.dataset.documentKind;
    const pages = qsa(':scope > .pp', documentNode).length;
    if (!pages) return;
    qsa(`[data-doc-pagecount="${kind}"]`).forEach((el) => { el.textContent = String(pages); });
    qsa(`[data-doc-pagecount-fa="${kind}"]`).forEach((el) => { el.textContent = toPersianDigits(pages); });
  });
};

const initDocumentPreview = () => {
  const dialog = qs('#document-preview');
  const controller = createDialogController(dialog);
  const title = qs('#document-preview-title');
  const printButton = qs('[data-document-print]', dialog);
  const documents = qsa('[data-document-kind]', dialog);
  if (!dialog || !documents.length) return;

  const labels = {
    resume: ['CV preview', 'پیش‌نمایش CV'],
    portfolio: ['Portfolio preview', 'پیش‌نمایش پرتفولیو']
  };

  const pageSizeStyle = () => {
    let style = qs('#document-print-page-size');
    if (!style) {
      style = document.createElement('style');
      style.id = 'document-print-page-size';
      document.head.append(style);
    }
    return style;
  };

  const setActiveDocument = (kind) => {
    const activeKind = kind === 'resume' ? 'resume' : 'portfolio';
    dialog.dataset.document = activeKind;
    documents.forEach((documentNode) => {
      const isActive = documentNode.dataset.documentKind === activeKind;
      documentNode.classList.toggle('is-active', isActive);
      documentNode.setAttribute('aria-hidden', String(!isActive));
      if (isActive) qsa('img', documentNode).forEach((image) => image.classList.add('is-photo-visible'));
    });
    appendBilingual(title, ...labels[activeKind], 'bilingual');
    return activeKind;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-document-open]');
    if (!trigger) return;
    const activeKind = setActiveDocument(trigger.dataset.documentOpen);
    setBilingualAttr(
      dialog,
      'aria-label',
      activeKind === 'resume' ? 'CV preview' : 'Portfolio preview',
      activeKind === 'resume' ? 'پیش‌نمایش رزومه' : 'پیش‌نمایش پرتفولیو'
    );
    controller.open(title || dialog, trigger);
  });

  printButton?.addEventListener('click', () => {
    const activeKind = setActiveDocument(dialog.dataset.document);
    const style = pageSizeStyle();
    const previousTitle = document.title;
    style.textContent = `@page { size: A4 ${activeKind === 'resume' ? 'portrait' : 'landscape'}; margin: 0; }`;
    document.body.classList.add('is-printing-document');
    document.title = activeKind === 'resume' ? 'Fateme Abbasi CV' : 'Fateme Abbasi Portfolio';

    const cleanup = () => {
      document.body.classList.remove('is-printing-document');
      document.title = previousTitle;
      style.textContent = '';
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.setTimeout(() => window.print(), 80);
    window.setTimeout(() => {
      if (document.body.classList.contains('is-printing-document')) cleanup();
    }, 1200);
  });
};

initLanguage({ toggle: qs('.lang-toggle') });
initTheme();
initMobileNav();
initReveal();
initHeroTitleReveal();
initPhotoReveal();
initBrandSubtitle();
initScrollStory();
initAdaptiveHeader();
initEndingTypewriter();
initHashAnchorStabilizer();
initProductionDialog();
initGalleryDialog();
initDocumentPreview();
initDocumentPageCounts();

const year = qs('#year');
if (year) year.textContent = new Date().getFullYear();
