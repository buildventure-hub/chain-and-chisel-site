(function(){
  const MOBILE_MAX = 860;

  function isMobile(){
    return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
  }

  function setHeaderHeightVar(){
    const header = document.getElementById('mobileHeader');
    if (!header) return;
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--mobile-header-h', `${Math.ceil(h)}px`);
  }

  function buildHeader(){
    if (!isMobile()) return;
    if (document.getElementById('mobileHeader')) return;

    const sidebarLogoImg = document.querySelector('.sidebar-logo img');
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarLogoImg || !sidebarNav) return;

    const header = document.createElement('header');
    header.className = 'mobile-header';
    header.id = 'mobileHeader';

    const logoWrap = document.createElement('div');
    logoWrap.className = 'mobile-logo';
    const logoImg = sidebarLogoImg.cloneNode(true);
    logoImg.removeAttribute('style');
    logoWrap.appendChild(logoImg);

    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Primary');

    const links = Array.from(sidebarNav.querySelectorAll('a')).slice(0,3).map(a => a.cloneNode(true));
    links.forEach(a => nav.appendChild(a));

    header.appendChild(logoWrap);
    header.appendChild(nav);

    document.body.prepend(header);
    document.body.classList.add('has-mobile-header');

    requestAnimationFrame(() => setHeaderHeightVar());
  }

  let lastY = 0;
  let ticking = false;

  function onScroll(){
    if (!isMobile()) return;
    const header = document.getElementById('mobileHeader');
    if (!header) return;

    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const goingDown = y > lastY;
    const delta = Math.abs(y - lastY);

    if (y > 80) header.classList.add('is-collapsed');
    else header.classList.remove('is-collapsed');

    if (delta > 10){
      if (goingDown && y > 200){
        header.classList.add('is-hidden');
      } else if (!goingDown) {
        header.classList.remove('is-hidden');
      }
    }

    lastY = y;
    setHeaderHeightVar();
  }

  function onResize(){
    const header = document.getElementById('mobileHeader');
    if (isMobile()){
      if (!header) buildHeader();
      setHeaderHeightVar();
    } else {
      if (header) header.remove();
      document.body.classList.remove('has-mobile-header');
      document.documentElement.style.removeProperty('--mobile-header-h');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildHeader();
    lastY = window.scrollY || 0;

    window.addEventListener('scroll', () => {
      if (!ticking){
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', onResize);
  });
})();