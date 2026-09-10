import { translations } from './i18n.js';
import { initTalks, refreshTalks } from './talks.js';
import { hardenExternalLinks, isEmbedded } from './util.js';

function getPage() {
  const path = location.pathname.split('/').pop() || 'index.html';
  const page = path.replace('.html', '') || 'index';
  return page === 'talk' ? 'talks' : page;
}

function navLink(file, key, page) {
  const active = (file === 'index.html' && (page === 'index' || page === '')) || page === file.replace('.html', '');
  return `<a href="${file}" class="${active ? 'active' : ''}" data-i18n="${key}"></a>`;
}

function injectLayout() {
  if (isEmbedded()) {
    document.body.classList.add('talk-embed');
    return;
  }
  const page = getPage();
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  if (header) header.innerHTML = `
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="index.html" aria-label="HKUST(GZ) Frontier AI Club">
          <span class="brand-mark">FAI</span>
          <span class="brand-name"><span data-i18n="brand"></span><small data-i18n="brandSub"></small></span>
        </a>
        <nav class="nav-links" id="navLinks" aria-label="Main navigation">
          ${navLink('index.html','navHome',page)}
          ${navLink('talks.html','navTalks',page)}
          ${navLink('handbook.html','navHandbook',page)}
          ${navLink('collaboration.html','navCollab',page)}
          ${navLink('links.html','navLinks',page)}
        </nav>
        <div class="nav-actions">
          <button class="lang-toggle" id="langToggle" aria-label="Switch language">EN</button>
          <button class="menu-toggle" id="menuToggle" aria-label="Open navigation"><span></span></button>
        </div>
      </div>
    </header>`;
  if (footer) footer.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand" href="index.html"><span class="brand-mark">FAI</span><span class="brand-name"><span data-i18n="brand"></span><small data-i18n="brandSub"></small></span></a>
            <p data-i18n="footerIntro"></p>
          </div>
          <div><div class="footer-title" data-i18n="footerExplore"></div><div class="footer-links"><a href="talks.html" data-i18n="navTalks"></a><a href="handbook.html" data-i18n="navHandbook"></a><a href="collaboration.html" data-i18n="navCollab"></a><a href="links.html" data-i18n="navLinks"></a></div></div>
        </div>
        <div class="footer-bottom"><span data-i18n="copyright"></span><span data-i18n="footerNote"></span></div>
      </div>
    </footer>`;
}

function setLanguage(lang) {
  const dict = translations[lang] || translations.zh;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中文';
  localStorage.setItem('hkustgz-frontier-ai-lang-v2', lang);
  refreshTalks();
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  items.forEach((i) => observer.observe(i));
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const animate = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = 'true';
    const target = Number(el.dataset.counter || 0);
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)).padStart(target >= 10 ? 2 : 1, '0');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && animate(e.target)), { threshold: .5 });
  counters.forEach((c) => io.observe(c));
}

function initScrollUI() {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress span');
  const topBtn = document.querySelector('.back-to-top');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.width = `${Math.min(100, y / max * 100)}%`;
    header?.classList.toggle('scrolled', y > 18);
    if (y > 500 && y > lastY + 8) header?.classList.add('header-hidden');
    else if (y < lastY - 8 || y < 120) header?.classList.remove('header-hidden');
    topBtn?.classList.toggle('visible', y > 650);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
}

function initAccordion() {
  document.querySelectorAll('.accordion-item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const panel = item?.querySelector('.accordion-panel');
      const open = item?.classList.toggle('open');
      if (panel) panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });
}

function initProjectFilters() {
  const buttons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.project-card[data-category]');
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    buttons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const value = btn.dataset.filter;
    cards.forEach((card) => card.classList.toggle('hidden', value !== 'all' && card.dataset.category !== value));
  }));
}

function initCardEffects() {
  if (matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const max = Number(card.dataset.tiltMax || 6);
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateY(-3px)`;
      card.style.setProperty('--mx', `${(x + .5) * 100}%`);
      card.style.setProperty('--my', `${(y + .5) * 100}%`);
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .12}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
  const glow = document.querySelector('.cursor-glow');
  addEventListener('pointermove', (e) => {
    if (glow) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }
  }, { passive: true });
}

function initParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return;
  const items = document.querySelectorAll('[data-parallax]');
  addEventListener('mousemove', (e) => {
    const x = e.clientX - innerWidth / 2;
    const y = e.clientY - innerHeight / 2;
    items.forEach((el) => {
      const amount = Number(el.dataset.parallax || .02);
      el.style.transform = `translate3d(${x * amount}px,${y * amount}px,0)`;
    });
  }, { passive: true });
}

function initNetworkCanvas() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1, nodes = [], mouse = { x: -9999, y: -9999 };
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(28, Math.min(72, Math.round(width * height / 18000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.6 + .6
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, width, height);
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 125) {
          ctx.strokeStyle = `rgba(96,165,250,${(1 - d / 125) * .16})`;
          ctx.lineWidth = .7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 150) {
        ctx.strokeStyle = `rgba(244,200,75,${(1 - md / 150) * .25})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      ctx.fillStyle = i % 9 === 0 ? 'rgba(244,200,75,.75)' : 'rgba(147,197,253,.55)';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('pointerleave', () => { mouse = { x: -9999, y: -9999 }; });
  addEventListener('resize', resize);
  resize();
  frame();
}

function initMenu() {
  const menu = document.getElementById('menuToggle');
  const nav = document.getElementById('navLinks');
  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    menu.classList.toggle('active', !!open);
    document.body.classList.toggle('menu-open', !!open);
  });
  document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    nav?.classList.remove('open');
    menu?.classList.remove('active');
    document.body.classList.remove('menu-open');
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  let lang = localStorage.getItem('hkustgz-frontier-ai-lang-v2') || 'en';
  setLanguage(lang);
  document.getElementById('langToggle')?.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    setLanguage(lang);
  });
  initMenu();
  initReveal();
  initCounters();
  initScrollUI();
  initAccordion();
  initProjectFilters();
  initCardEffects();
  initParallax();
  initNetworkCanvas();
  hardenExternalLinks();
  initTalks();
});
