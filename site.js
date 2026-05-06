(function(){
  const MOBILE_MAX = 860;
  const GUILD_URL = 'https://ccaguild.com';

  function ensureGuildButton(){
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    if (sidebarNav.querySelector('.ccag-link')) return;

    const link = document.createElement('a');
    link.className = 'side-plank ccag-link';
    link.href = GUILD_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = `
      <img alt="" class="side-plank-img" src="assets/buttons/plank-button-3.png?v=3"/>
      <span class="side-plank-text">Visit the Guild</span>
    `;
    sidebarNav.appendChild(link);
  }

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
    const sidebarSocial = document.querySelector('.sidebar-social .social-links');
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

    const links = Array.from(sidebarNav.querySelectorAll('a'))
      .filter(a => !a.classList.contains('ccag-link'))
      .map(a => a.cloneNode(true));

    const galleryImgSrc = links[0]?.querySelector('.side-plank-img')?.getAttribute('src') || null;
    if (galleryImgSrc) {
      links.forEach((link) => {
        const text = (link.querySelector('.side-plank-text')?.textContent || '').trim().toLowerCase();
        if (text === 'faq') {
          const img = link.querySelector('.side-plank-img');
          if (img) img.setAttribute('src', galleryImgSrc);
        }
      });
    }

    links.forEach(a => nav.appendChild(a));
    nav.style.setProperty('--mobile-nav-cols', links.length > 3 ? '2' : String(Math.max(links.length, 1)));

    header.appendChild(logoWrap);
    header.appendChild(nav);

    if (sidebarSocial) {
      const utility = document.createElement('div');
      utility.className = 'mobile-utility';

      const social = document.createElement('div');
      social.className = 'mobile-social-links';
      Array.from(sidebarSocial.querySelectorAll('a')).forEach(a => social.appendChild(a.cloneNode(true)));

      const guildLink = document.createElement('a');
      guildLink.className = 'mobile-guild-link';
      guildLink.href = GUILD_URL;
      guildLink.target = '_blank';
      guildLink.rel = 'noopener';
      guildLink.textContent = 'Visit ccaguild.com';

      utility.appendChild(social);
      utility.appendChild(guildLink);
      header.appendChild(utility);
    }

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
    ensureGuildButton();
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
