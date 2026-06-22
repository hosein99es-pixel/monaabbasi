const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const dialogQsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const getFocusable = (root) => dialogQsa(focusableSelector, root).filter((element) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length));

function createDialogController(dialog) {
  let trigger = null;

  const close = () => {
    if (!dialog?.open) return;
    dialog.close();
  };

  const open = (initialFocusTarget, nextTrigger) => {
    if (!dialog || dialog.open) return;
    trigger = nextTrigger || document.activeElement;
    dialog.showModal();
    requestAnimationFrame(() => (initialFocusTarget || getFocusable(dialog)[0] || dialog).focus({ preventScroll: true }));
  };

  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-dialog-close]')) {
      close();
    }
  });

  dialog?.addEventListener('close', () => {
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
    trigger = null;
  });

  dialog?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = getFocusable(dialog);
    if (!focusables.length) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });

  return { open, close };
}
