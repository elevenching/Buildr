export function createRouter({ routes, onRoute }) {
  function resolve(pathname) {
    return routes[pathname] || routes['/'];
  }

  async function render() {
    const route = resolve(window.location.pathname);
    await onRoute(route, window.location.pathname);
  }

  function navigate(destination) {
    const current = `${window.location.pathname}${window.location.hash}`;
    if (current !== destination) window.history.pushState({}, '', destination);
    return render();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-route]');
    if (!link || link.origin !== window.location.origin || event.defaultPrevented) return;
    event.preventDefault();
    navigate(`${link.pathname}${link.hash}`);
  });
  window.addEventListener('popstate', render);

  return { navigate, start: render };
}
