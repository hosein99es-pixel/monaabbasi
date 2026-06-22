// Behaviour for the standalone print pages (cv.html / portfolio.html).
// Extracted from inline on-click attributes so a strict CSP (script-src 'self',
// no 'unsafe-inline') can be enforced. Uses event delegation on data-* hooks.
(function () {
  var root = document.documentElement;
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-toggle-lang]')) {
      var isPersian = root.dataset.lang === 'fa';
      root.dataset.lang = isPersian ? 'en' : 'fa';
      root.dir = isPersian ? 'ltr' : 'rtl';
      return;
    }
    if (event.target.closest('[data-print]')) {
      window.print();
    }
  });
})();
