const DEBUG_PERFORMANCE = false;
const adminPerfStart = performance.now();
const collapsedKey = 'bianti-sidebar-collapsed';
const confirmModal = document.querySelector('#adminConfirm');
const confirmTitle = document.querySelector('#adminConfirmTitle');
const confirmMessage = document.querySelector('#adminConfirmMessage');
const confirmOk = document.querySelector('[data-confirm-ok]');
let pendingConfirmForm = null;

if (localStorage.getItem(collapsedKey) === '1') {
  document.body.classList.add('sidebar-collapsed');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-menu]')) {
    document.body.classList.toggle('menu-open');
  }

  if (e.target.closest('[data-menu-close]') || e.target.matches('.admin-sidebar a')) {
    document.body.classList.remove('menu-open');
  }

  if (e.target.closest('[data-sidebar-toggle]')) {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem(collapsedKey, document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
  }

  const copyCatalog = e.target.closest('[data-copy-catalog]');
  if (copyCatalog) {
    navigator.clipboard?.writeText(copyCatalog.dataset.copyCatalog || '');
  }

  const editCategory = e.target.closest('[data-edit-category]');
  if (editCategory) {
    const form = editCategory.closest('article')?.querySelector('.edit-cat');
    if (form) form.hidden = false;
  }

  const closeCategory = e.target.closest('[data-close-category]');
  if (closeCategory) {
    const form = closeCategory.closest('.edit-cat');
    if (form) form.hidden = true;
  }

  if (e.target.closest('[data-confirm-cancel]') || e.target === confirmModal) {
    closeAdminConfirm();
  }

  if (e.target.closest('[data-confirm-ok]') && pendingConfirmForm) {
    const form = pendingConfirmForm;
    closeAdminConfirm();
    form.dataset.confirmed = '1';
    form.requestSubmit();
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-confirm-message]');
  if (!form || form.dataset.confirmed === '1') return;
  e.preventDefault();
  openAdminConfirm(form);
});

function openAdminConfirm(form) {
  pendingConfirmForm = form;
  if (confirmTitle) confirmTitle.textContent = form.dataset.confirmTitle || 'Confirmar acción';
  if (confirmMessage) confirmMessage.textContent = form.dataset.confirmMessage || 'Esta acción no se puede deshacer.';
  if (!confirmModal) return;
  confirmModal.hidden = false;
  confirmModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  confirmOk?.focus();
}

function closeAdminConfirm() {
  pendingConfirmForm = null;
  if (!confirmModal) return;
  confirmModal.hidden = true;
  confirmModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.body.classList.remove('menu-open');
    closeAdminConfirm();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (DEBUG_PERFORMANCE) console.log(`[BIANTI perf] DOMContentLoaded admin: ${Math.round((performance.now() - adminPerfStart) * 100) / 100} ms`);
}, { once: true });

document.querySelectorAll('[data-offer-form]').forEach((form) => {
  const input = form.querySelector('[data-discount]');
  const output = form.querySelector('[data-final]');
  if (!input || !output) return;
  const base = Number(output.dataset.base || 0);
  const format = (n) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  input.addEventListener('input', () => {
    const discount = Math.min(95, Math.max(0, Number(input.value || 0)));
    output.textContent = format(base * (1 - discount / 100));
  });
});
