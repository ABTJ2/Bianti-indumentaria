const collapsedKey = 'bianti-sidebar-collapsed';

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
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.body.classList.remove('menu-open');
});

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
