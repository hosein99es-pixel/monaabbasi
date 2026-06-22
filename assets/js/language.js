function initLanguage({ root = document.documentElement, body = document.body, toggle } = {}) {
  const setLanguage = (language) => {
    const nextLanguage = language === 'fa' ? 'fa' : 'en';
    const isPersian = nextLanguage === 'fa';
    const direction = isPersian ? 'rtl' : 'ltr';

    root.dataset.lang = nextLanguage;
    root.lang = nextLanguage;
    root.dir = direction;
    body.dir = direction;

    // Only the in-page <button> toggle (single-source index.html) is updated
    // here. Built per-locale routes replace it with an <a> that navigates to the
    // sibling route, so its label/state must stay as authored by the build.
    if (toggle && toggle.tagName === 'BUTTON') {
      toggle.setAttribute('aria-pressed', String(isPersian));
      // The toggle label is written in the language the user currently reads:
      // Persian when Persian is active (it offers a switch to English) and English otherwise.
      toggle.setAttribute('aria-label', isPersian ? 'تغییر زبان به انگلیسی' : 'Switch to Persian');
    }

    document.querySelectorAll('[data-aria-label-fa]').forEach((element) => {
      if (!element.dataset.ariaLabelEn) {
        element.dataset.ariaLabelEn = element.getAttribute('aria-label') || '';
      }
      element.setAttribute('aria-label', isPersian ? element.dataset.ariaLabelFa : element.dataset.ariaLabelEn);
    });

    // Let other modules (e.g. dynamically generated dialog/gallery labels) re-localise.
    document.dispatchEvent(new CustomEvent('sitelanguagechange', { detail: { lang: nextLanguage } }));
  };

  setLanguage(root.dataset.lang || 'en');
  // In-page toggling only applies to the <button> source. An <a> switcher in a
  // built route navigates to the sibling locale on its own (works without JS).
  if (toggle && toggle.tagName === 'BUTTON') {
    toggle.addEventListener('click', () => setLanguage(root.dataset.lang === 'fa' ? 'en' : 'fa'));
  }

  return { setLanguage };
}
