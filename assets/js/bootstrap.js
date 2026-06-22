// Bootstrap: runs early (render-blocking <script src> in <head>) so the no-js
// -> js swap and scroll-stage plumbing are ready before paint. Extracted from a
// former inline <head> script so a strict Content-Security-Policy (script-src
// 'self', no 'unsafe-inline') can be enforced.
(function () {
  document.documentElement.classList.replace('no-js', 'js');

  window.scrollStage = (function () {
    var subscribers = new Set();
    var ticking = false;
    var readState = function () {
      return {
        scrollY: window.scrollY || window.pageYOffset || 0,
        viewportHeight: window.innerHeight || document.documentElement.clientHeight || 1,
        documentHeight: Math.max(document.body ? document.body.scrollHeight : 0, document.documentElement.scrollHeight)
      };
    };
    var flush = function () {
      ticking = false;
      var state = readState();
      subscribers.forEach(function (subscriber) { subscriber(state); });
    };
    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(flush);
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    document.documentElement.setAttribute('data-scroll-stage', 'ready');
    return {
      request: request,
      subscribe: function (subscriber, options) {
        subscribers.add(subscriber);
        if (!options || options.immediate !== false) {
          window.requestAnimationFrame(function () { subscriber(readState()); });
        }
        return function () { subscribers.delete(subscriber); };
      }
    };
  })();

  /* Fail-safe: if the reveal module (main.js) never claims ownership by setting
     data-reveal-ready, reveal everything at DOMContentLoaded. A JS load/parse
     failure can then never leave the page blank behind the .js hidden states. */
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.documentElement.hasAttribute('data-reveal-ready')) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  });
})();
