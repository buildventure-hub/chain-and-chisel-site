(() => {
  const root = document.documentElement;
  const sidebar = document.getElementById('siteSidebar');
  const inner = document.getElementById('sidebarInner');
  const hero = document.querySelector('.masterpiece');

  // Keep this in sync with CSS
  const mq = window.matchMedia('(max-width: 860px)');

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const setPx = (name, px) => {
    root.style.setProperty(name, `${Math.max(0, Math.round(px))}px`);
  };

  const setNum = (name, num) => {
    root.style.setProperty(name, String(num));
  };

  function measureExpandedHeight() {
    // On mobile, we only show the logo area (nav is hidden by CSS).
    // Measure the natural height of inner content while sidebar is "auto".
    const prevH = sidebar.style.height;
    sidebar.style.height = 'auto';
    // Force layout
    const expanded = inner.getBoundingClientRect().height;
    sidebar.style.height = prevH;

    setPx('--mhead-expanded', expanded);
    return expanded;
  }

  function updateMobileHeader() {
    if (!mq.matches) {
      document.body.classList.remove('is-mobile');
      // Clear mobile vars so desktop isn't affected
      root.style.removeProperty('--mhead-h');
      root.style.removeProperty('--mhead-scale');
      root.style.removeProperty('--mhead-opacity');
      return;
    }

    document.body.classList.add('is-mobile');

    const expanded =
      parseFloat(getComputedStyle(root).getPropertyValue('--mhead-expanded')) ||
      measureExpandedHeight();

    // Shrink smoothly as you scroll down through the hero.
    const heroH = hero ? hero.getBoundingClientRect().height : 0;
    const range = Math.max(1, heroH || expanded);

    const y = window.scrollY || window.pageYOffset || 0;
    const t = clamp01(y / range);

    const h = expanded * (1 - t);

    setPx('--mhead-h', h);
    setNum('--mhead-scale', 1 - t);
    setNum('--mhead-opacity', 1 - t);
  }

  function refresh() {
    if (mq.matches) {
      measureExpandedHeight();
    }
    updateMobileHeader();
  }

  // Init
  refresh();

  // After images load (logo + hero)
  window.addEventListener('load', refresh, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('scroll', updateMobileHeader, { passive: true });

  mq.addEventListener?.('change', refresh);
})();
