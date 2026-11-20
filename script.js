/*
 * Interacciones: tema, navegación, categorías de habilidades,
 * acordeón, copiar correo y conexión de los enlaces desde config.js.
 * Sin dependencias externas.
 */
(() => {
  'use strict';

  document.body.classList.add('js-enhanced');
  const config = window.PORTFOLIO_CONFIG || {};
  const root = document.documentElement;
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const backToTop = document.getElementById('backToTop');
  const progress = document.getElementById('pageProgress');
  const toast = document.getElementById('toast');
  const themeToggle = document.getElementById('themeToggle');
  const emailValue = typeof config.email === 'string' ? config.email.trim() : '';
  let toastTimeout;

  // Tema (con preferencia del sistema y selección guardada).
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  let savedTheme;
  try { savedTheme = localStorage.getItem('mv-theme'); } catch (_) { savedTheme = null; }
  const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : (systemPrefersLight ? 'light' : 'dark');
  applyTheme(theme);

  function applyTheme(nextTheme) {
    root.dataset.theme = nextTheme;
    themeToggle?.setAttribute('aria-label', nextTheme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro');
    themeToggle?.setAttribute('title', nextTheme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', nextTheme === 'dark' ? '#090f1a' : '#f7f8f8');
  }
  themeToggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('mv-theme', next); } catch (_) { /* private mode */ }
  });

  // Enlaces editables y comprobación básica de protocolos seguros.
  const safeUrl = (raw) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      const url = new URL(raw.trim());
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  };
  const linkedinUrl = safeUrl(config.linkedin);
  const githubUrl = safeUrl(config.github);
  const githubRepoUrl = safeUrl(config.githubRepo);
  const digitsPhone = typeof config.phone === 'string' ? config.phone.replace(/[^\d+]/g, '') : '';

  document.querySelectorAll('[data-link="linkedin"]').forEach((el) => {
    if (linkedinUrl) el.href = linkedinUrl;
  });
  if (emailValue) {
    document.querySelectorAll('[data-link="email"]').forEach((el) => { el.href = `mailto:${emailValue}`; });
    const text = document.getElementById('contactEmail');
    if (text) text.textContent = emailValue;
  }
  if (/^\+?\d{8,15}$/.test(digitsPhone)) {
    document.querySelectorAll('[data-link="phone"]').forEach((el) => { el.href = `tel:${digitsPhone}`; });
    const text = document.getElementById('contactPhone');
    if (text) text.textContent = config.phoneDisplay || digitsPhone;
  }
  if (typeof config.cv === 'string' && config.cv.trim() && !/^javascript:/i.test(config.cv.trim())) {
    document.querySelectorAll('a[download]').forEach((el) => { el.href = config.cv.trim(); });
  }
  if (githubUrl) {
    document.querySelectorAll('[data-link="github"]').forEach((el) => {
      el.href = githubUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.removeAttribute('aria-disabled');
      el.removeAttribute('tabindex');
    });
  }
  if (githubRepoUrl) {
    document.querySelectorAll('[data-link="github-repo"]').forEach((el) => {
      el.href = githubRepoUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
  }

  // Malla interactiva: abrir/cerrar todos los semestres.
  const semesterCards = [...document.querySelectorAll('.semester-card')];
  const curriculumToggle = document.getElementById('curriculumToggle');
  function syncCurriculumToggle() {
    if (!curriculumToggle || !semesterCards.length) return;
    const allOpen = semesterCards.every((card) => card.open);
    curriculumToggle.setAttribute('aria-expanded', String(allOpen));
    curriculumToggle.innerHTML = `${allOpen ? 'Contraer todos' : 'Expandir todos'} <svg class="icon"><use href="#i-chev"/></svg>`;
  }
  curriculumToggle?.addEventListener('click', () => {
    const expand = !semesterCards.every((card) => card.open);
    semesterCards.forEach((card) => { card.open = expand; });
    syncCurriculumToggle();
  });
  semesterCards.forEach((card) => card.addEventListener('toggle', syncCurriculumToggle));

  // Menú móvil accesible.
  function setMenu(open) {
    menuToggle?.setAttribute('aria-expanded', String(open));
    menuToggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mobileNav?.classList.toggle('open', open);
    if (mobileNav) mobileNav.inert = !open;
  }
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 980) setMenu(false); }, { passive:true });

  // Pestañas: navegación con teclado + contenido visible solo en pestaña elegida.
  const tabButtons = [...document.querySelectorAll('[role="tab"]')];
  const activateTab = (current, focus = false) => {
    tabButtons.forEach((button) => {
      const selected = button === current;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (focus) current.focus();
  };
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button));
    button.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabButtons[nextIndex], true);
    });
  });

  // Acordeón de experiencia.
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const trigger = accordion.querySelector('.accordion-trigger');
    const panel = accordion.querySelector('.accordion-panel');
    trigger?.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
      trigger.firstChild.textContent = open ? 'Ocultar responsabilidades ' : 'Ver responsabilidades ';
    });
  });

  // Copiar dirección: funciona en HTTPS y tiene alternativa para HTTP/local.
  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }
  document.getElementById('copyEmail')?.addEventListener('click', async () => {
    if (!emailValue) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(emailValue);
      showToast('¡Correo copiado!');
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = emailValue;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.focus(); field.select();
      const copied = document.execCommand('copy');
      field.remove();
      showToast(copied ? '¡Correo copiado!' : 'Puedes seleccionar el correo para copiarlo.');
    }
  });

  // Scroll progress, link activo y acceso rápido al inicio.
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  const targets = ['inicio','sobre-mi','trayectoria','formacion','malla','habilidades','proyectos','contacto'];
  const onScroll = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${total > 0 ? Math.min(100, Math.max(0, window.scrollY / total * 100)) : 0}%`;
    backToTop?.classList.toggle('is-visible', window.scrollY > 500);
    let activeId = 'inicio';
    targets.forEach((id) => {
      const target = document.getElementById(id);
      if (target && target.getBoundingClientRect().top <= 170) activeId = id;
    });
    navLinks.forEach((link) => {
      const matches = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('active', matches);
      if (matches) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  backToTop?.addEventListener('click', () => window.scrollTo({ top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

  // Animaciones discretas con fallback para navegadores antiguos.
  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin:'0px 0px -35px 0px', threshold:.08 });
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in-view'));
  }
  const currentYear = document.getElementById('currentYear');
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
})();
