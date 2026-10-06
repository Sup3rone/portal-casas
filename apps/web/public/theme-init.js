// Bootstrap local: claro por defecto; la preferencia guardada tiene prioridad.
(() => {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('portal-casas-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {}
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
})();
