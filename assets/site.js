const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navegacao');
const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
};
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});
const routeKey = path => path.replace(/\/+$/, '') || '/';
const pages = new Map([[routeKey(location.pathname), Promise.resolve(document.documentElement.outerHTML)]]);
const allowedRoutes = new Set(['/', '/sobre']);
const getPage = path => {
  const key = routeKey(path);
  if (!pages.has(key)) {
    const pending = fetch(key === '/' ? '/' : `${key}/`, {credentials:'same-origin'})
      .then(response => { if (!response.ok) throw new Error('Página indisponível'); return response.text(); })
      .catch(error => { pages.delete(key); throw error; });
    pages.set(key, pending);
  }
  return pages.get(key);
};
let navigationRequest = 0;
let renderedRoute = routeKey(location.pathname);
async function navigate(url, push = true) {
  const request = ++navigationRequest;
  try {
    const markup = await getPage(url.pathname);
    if (request !== navigationRequest) return;
    const next = new DOMParser().parseFromString(markup, 'text/html');
    const main = next.querySelector('main');
    if (!main) throw new Error('Página indisponível');
    if (push) {
      history.replaceState({...history.state, scrollY:window.scrollY}, '', location.href);
      history.pushState({scrollY:0}, '', url.pathname);
    }
    document.querySelector('main').replaceWith(main);
    startInsights();
    renderedRoute = routeKey(url.pathname);
    document.title = next.title;
    for (const selector of ['meta[name="description"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]', 'link[rel="canonical"]']) {
      document.head.querySelectorAll(selector).forEach(element => element.remove());
      next.head.querySelectorAll(selector).forEach(element => document.head.append(element.cloneNode(true)));
    }
    navigation.querySelectorAll('a').forEach(link => {
      if (routeKey(new URL(link.href).pathname) === routeKey(url.pathname)) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    closeMenu();
    main.setAttribute('tabindex','-1');
    main.focus({preventScroll:true});
    window.scrollTo({top:push ? 0 : (history.state?.scrollY ?? 0),behavior:'instant'});
  } catch {
    if (request === navigationRequest) location.assign(url.href);
  }
}
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === filter)));
    let visible = 0;
    document.querySelectorAll('.project').forEach(project => {
      project.hidden = filter.dataset.filter !== 'Todos' && project.dataset.category !== filter.dataset.filter;
      if (!project.hidden) visible++;
    });
    document.querySelector('#filter-status').textContent = `${visible} ${visible === 1 ? 'projeto exibido' : 'projetos exibidos'}`;
  }
  const view = event.target.closest('[data-view]');
  if (view) {
    document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === view)));
    document.querySelector('.projects').classList.toggle('is-list',view.dataset.view === 'list');
  }
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.hash || url.search || !allowedRoutes.has(routeKey(url.pathname))) return;
  event.preventDefault();
  if (routeKey(url.pathname) === renderedRoute) { navigationRequest++; closeMenu(); return; }
  navigate(url);
});
window.addEventListener('popstate', () => {
  if (routeKey(location.pathname) !== renderedRoute) navigate(new URL(location.href),false);
});
const warmPages = () => {
  if (navigator.connection?.saveData) return;
  for (const route of allowedRoutes) getPage(route).catch(() => {});
};
if ('requestIdleCallback' in window) requestIdleCallback(warmPages,{timeout:1000});
else setTimeout(warmPages,150);
navigation.addEventListener('pointerover', warmPages, {once:true});
navigation.addEventListener('focusin', warmPages, {once:true});

let insightCleanup = () => {};
function startInsights() {
  insightCleanup();
  const root = document.querySelector('.insight-rotator');
  if (!root) return;
  const slides = [...root.querySelectorAll('.insight')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let fitFrame;
  const fitMobile = () => {
    if (!root.isConnected) return;
    if (innerWidth > 600) { root.style.removeProperty('--insight-mobile-size'); return; }
    // Use one shared size, chosen for the longest of all three complete phrases.
    root.classList.add('is-sizing');
    let low = 9, high = 32;
    for (let step = 0; step < 12; step++) {
      const size = (low + high) / 2;
      root.style.setProperty('--insight-mobile-size', `${size}px`);
      const fits = slides.every(slide => slide.getBoundingClientRect().height <= parseFloat(getComputedStyle(slide).lineHeight) * 2 + 1);
      if (fits) low = size; else high = size;
    }
    root.style.setProperty('--insight-mobile-size', `${Math.floor(low * 10) / 10}px`);
    root.classList.remove('is-sizing');
  };
  const resize = () => { cancelAnimationFrame(fitFrame); fitFrame = requestAnimationFrame(fitMobile); };
  window.addEventListener('resize', resize);
  fitMobile();

  const desktopHover = matchMedia('(min-width:1001px) and (hover:hover) and (pointer:fine)');
  let index = 0, timer = null, transitionTimer = null, remaining = 6000, deadline = 0, paused = reduced.matches, hovered = false, focused = false;
  const render = () => slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);
    slide.classList.remove('is-leaving');
    slide.setAttribute('aria-hidden', String(i !== index));
    slide.inert = i !== index;
  });
  const schedule = () => {
    if (timer !== null) {
      remaining = Math.max(0, deadline - performance.now());
      clearTimeout(timer); timer = null;
    }
    if (transitionTimer !== null) {
      clearTimeout(transitionTimer); transitionTimer = null; remaining = 6000;
    }
    render();
    if (paused || hovered || focused || document.hidden) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      slides[index].classList.add('is-leaving');
      transitionTimer = setTimeout(() => {
        transitionTimer = null;
        index = (index + 1) % slides.length;
        remaining = 6000; schedule();
      }, reduced.matches ? 0 : 700);
    }, remaining);
  };
  root.addEventListener('mouseenter', () => { if (desktopHover.matches) { hovered = true; schedule(); } });
  root.addEventListener('mouseleave', () => { if (hovered) { hovered = false; schedule(); } });
  const hoverMode = () => { hovered = desktopHover.matches && root.matches(':hover'); schedule(); };
  desktopHover.addEventListener('change', hoverMode);
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) { focused = false; schedule(); } });
  const visibility = () => schedule();
  const motion = () => { paused = reduced.matches; schedule(); };
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motion);
  insightCleanup = () => { cancelAnimationFrame(fitFrame); window.removeEventListener('resize', resize); clearTimeout(timer); clearTimeout(transitionTimer); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', motion); desktopHover.removeEventListener('change', hoverMode); };
  render(); schedule();
}
startInsights();
