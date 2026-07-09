document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-menu]');
  if (btn) document.body.classList.toggle('menu-open');
  if (e.target.matches('.admin-sidebar a')) document.body.classList.remove('menu-open');
});
