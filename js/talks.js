import { translations } from './i18n.js';
import { talksByStatus, getTalkById } from './talks-data.js';
import {
  drivePreviewUrl,
  escapeHtml,
  hardenExternalLinks,
  isEmbedded,
  isTalkId,
  localized,
  setText,
  talkPageUrl
} from './util.js';

const PLAYER_MODE_KEY = 'hkustgz-talk-player-mode-v1';
const PLAYER_MODES = new Set(['window', 'pip']);

function currentLang() {
  return document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
}

function dict() {
  return translations[currentLang()] || translations.en;
}

function copy(talk, field, fallback = '') {
  const lang = currentLang();
  const pack = talk[lang] || talk.en || talk.zh || {};
  const value = pack[field];
  if (Array.isArray(value)) return value;
  return value || localized(talk[field], lang, fallback);
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return currentLang() === 'zh'
    ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPlayerMode() {
  const stored = localStorage.getItem(PLAYER_MODE_KEY);
  return PLAYER_MODES.has(stored) ? stored : 'window';
}

function setPlayerMode(mode) {
  const next = PLAYER_MODES.has(mode) ? mode : 'window';
  localStorage.setItem(PLAYER_MODE_KEY, next);
  document.querySelectorAll('[data-player-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.playerMode === next);
    button.setAttribute('aria-pressed', button.dataset.playerMode === next ? 'true' : 'false');
  });
  return next;
}

function createDriveFrame(talk, title) {
  const src = drivePreviewUrl(talk.video?.driveUrl || talk.video?.fileId || '');
  const frame = document.createElement('iframe');
  frame.className = 'talk-video-frame';
  frame.title = title || dict().talkVideoTitle;
  frame.allow = 'fullscreen; encrypted-media; picture-in-picture';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('loading', 'lazy');
  if (src) frame.src = src;
  return frame;
}

function renderTags(tags = []) {
  return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function renderTalkCard(talk) {
  const title = copy(talk, 'title');
  const presenter = copy(talk, 'presenter');
  const affiliation = copy(talk, 'affiliation');
  const abstract = copy(talk, 'abstract');
  const bio = copy(talk, 'bio');
  const tags = copy(talk, 'tags', []);
  const canOpen = Boolean(drivePreviewUrl(talk.video?.driveUrl || talk.video?.fileId || '') || talk.id);
  return `
    <article class="event-card featured talk-card" data-talk-id="${escapeHtml(talk.id)}">
      <div class="event-date">
        <strong>${escapeHtml(talk.sequence || '01')}</strong>
        <span>${escapeHtml(copy(talk, 'slot'))}</span>
      </div>
      <div class="event-body">
        <div class="event-type">${escapeHtml(copy(talk, 'type'))}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(abstract)}</p>
        <div class="event-meta">
          <span class="speaker-name">${escapeHtml(presenter)}</span>
          <span>${escapeHtml(affiliation)}</span>
          <span>${escapeHtml(formatDate(talk.date))}</span>
          <span>${escapeHtml(copy(talk, 'open'))}</span>
        </div>
        <div class="tag-list light-tags speaker-tags">${renderTags(tags)}</div>
        ${bio ? `<div class="speaker-bio"><div class="bio-label">${escapeHtml(dict().speakerBioLabel)}</div><p>${escapeHtml(bio)}</p></div>` : ''}
        <div class="talk-card-actions">
          <button type="button" class="btn btn-primary" data-open-talk="${escapeHtml(talk.id)}">${escapeHtml(dict().watchReplay)}</button>
        </div>
      </div>
      <div class="event-arrow" aria-hidden="true">${canOpen ? '▶' : '↗'}</div>
    </article>
  `;
}

function renderList(container, items, emptyKey) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<p class="empty-note">${escapeHtml(dict()[emptyKey] || '')}</p>`;
    return;
  }
  container.innerHTML = items.map(renderTalkCard).join('');
}

function ensureChrome() {
  if (document.querySelector('.talk-window')) return;
  const windowWrap = document.createElement('div');
  windowWrap.className = 'talk-window';
  windowWrap.hidden = true;
  windowWrap.innerHTML = `
    <div class="talk-window-backdrop" data-close-talk></div>
    <div class="talk-window-chrome" role="dialog" aria-modal="true" aria-labelledby="talk-window-title">
      <header class="talk-window-bar">
        <div>
          <p class="talk-window-kicker"></p>
          <h2 id="talk-window-title"></h2>
        </div>
        <div class="talk-window-actions">
          <button type="button" class="ghost-btn" data-talk-dock></button>
          <a class="ghost-btn" data-talk-standalone target="_blank" rel="noopener noreferrer"></a>
          <button type="button" class="ghost-btn talk-close" data-close-talk aria-label="Close">×</button>
        </div>
      </header>
      <iframe class="talk-window-frame" title="" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>
  `;
  const pip = document.createElement('aside');
  pip.className = 'talk-pip';
  pip.hidden = true;
  pip.innerHTML = `
    <div class="talk-pip-bar">
      <strong class="talk-pip-title"></strong>
      <div>
        <button type="button" class="ghost-btn" data-pip-expand></button>
        <button type="button" class="ghost-btn talk-close" data-pip-close aria-label="Close">×</button>
      </div>
    </div>
    <div class="talk-pip-stage"></div>
  `;
  document.body.append(windowWrap, pip);
  hardenExternalLinks(windowWrap);
}

function closeTalkWindow() {
  const wrap = document.querySelector('.talk-window');
  const frame = wrap?.querySelector('.talk-window-frame');
  if (frame) frame.src = 'about:blank';
  if (wrap) {
    wrap.hidden = true;
    wrap.dataset.talkId = '';
  }
  document.body.classList.remove('talk-window-open');
}

function closePip() {
  const pip = document.querySelector('.talk-pip');
  const stage = pip?.querySelector('.talk-pip-stage');
  if (stage) stage.replaceChildren();
  if (pip) {
    pip.hidden = true;
    pip.dataset.talkId = '';
  }
  if (pageName() === 'talk') {
    const talk = getTalkById(new URLSearchParams(location.search).get('id'));
    if (talk) fillTalkPage(talk);
  }
}

function openTalkWindow(talk) {
  ensureChrome();
  closePip();
  const wrap = document.querySelector('.talk-window');
  const frame = wrap.querySelector('.talk-window-frame');
  const url = talkPageUrl(talk.id, true);
  wrap.hidden = false;
  wrap.dataset.talkId = talk.id;
  setText(wrap.querySelector('.talk-window-kicker'), `${copy(talk, 'type')} · ${copy(talk, 'presenter')}`);
  setText(wrap.querySelector('#talk-window-title'), copy(talk, 'title'));
  setText(wrap.querySelector('[data-talk-dock]'), dict().dockVideo);
  const standalone = wrap.querySelector('[data-talk-standalone]');
  standalone.href = talkPageUrl(talk.id);
  setText(standalone, dict().openStandalone);
  frame.title = copy(talk, 'title');
  frame.allow = 'fullscreen; encrypted-media; picture-in-picture';
  frame.src = url;
  document.body.classList.add('talk-window-open');
}

function openTalkPip(talk) {
  ensureChrome();
  closeTalkWindow();
  const pip = document.querySelector('.talk-pip');
  const stage = pip.querySelector('.talk-pip-stage');
  pip.hidden = false;
  pip.dataset.talkId = talk.id;
  setText(pip.querySelector('.talk-pip-title'), copy(talk, 'presenter') || copy(talk, 'title'));
  setText(pip.querySelector('[data-pip-expand]'), dict().expandTalk);
  stage.replaceChildren(createDriveFrame(talk, copy(talk, 'title')));
  const pageStage = document.querySelector('[data-talk-video]');
  if (pageStage) pageStage.replaceChildren();
}

function openTalk(id, mode = getPlayerMode()) {
  if (!isTalkId(id)) return;
  const talk = getTalkById(id);
  if (!talk) return;
  if (pageName() === 'talk') {
    if (mode === 'pip') openTalkPip(talk);
    else {
      closePip();
      fillTalkPage(talk);
    }
    return;
  }
  if (mode === 'pip') openTalkPip(talk);
  else openTalkWindow(talk);
}

function bindList(container) {
  container?.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open-talk], [data-talk-id]');
    if (!opener || !container.contains(opener)) return;
    const id = opener.dataset.openTalk || opener.dataset.talkId;
    if (id) openTalk(id);
  });
}

function fillTalkPage(talk) {
  const langPack = talk[currentLang()] || talk.en;
  const title = copy(talk, 'title');
  document.title = `${title} | HKUST(GZ) Frontier AI Club`;
  setText(document.querySelector('[data-talk-kicker]'), copy(talk, 'type'));
  setText(document.querySelector('[data-talk-title]'), title);
  setText(document.querySelector('[data-talk-abstract]'), copy(talk, 'abstract'));
  setText(document.querySelector('[data-talk-presenter]'), copy(talk, 'presenter'));
  setText(document.querySelector('[data-talk-affiliation]'), copy(talk, 'affiliation'));
  setText(document.querySelector('[data-talk-bio]'), copy(talk, 'bio'));
  setText(document.querySelector('[data-talk-date]'), formatDate(talk.date));
  setText(document.querySelector('[data-talk-open]'), copy(talk, 'open'));
  const tags = document.querySelector('[data-talk-tags]');
  if (tags) tags.innerHTML = renderTags(langPack.tags || []);
  const stage = document.querySelector('[data-talk-video]');
  if (stage) {
    stage.replaceChildren(createDriveFrame(talk, title));
    if (!drivePreviewUrl(talk.video?.driveUrl || talk.video?.fileId || '')) {
      setText(stage, dict().upcomingEmpty);
    }
  }
}

function initTalkPage() {
  const params = new URLSearchParams(location.search);
  const embed = isEmbedded();
  const id = params.get('id');
  const talk = getTalkById(id);
  document.body.classList.toggle('talk-embed', embed);
  if (!talk) {
    setText(document.querySelector('[data-talk-title]'), dict().upcomingEmpty);
    return;
  }
  fillTalkPage(talk);
  document.querySelector('[data-talk-dock-page]')?.addEventListener('click', () => {
    if (isEmbedded()) {
      window.parent.postMessage({ type: 'hkustgz-talk-dock', id: talk.id }, location.origin);
      return;
    }
    setPlayerMode('pip');
    openTalkPip(talk);
    document.querySelector('[data-talk-page-video]')?.classList.add('is-docked');
  });
}

function initMessageBridge() {
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    const data = event.data || {};
    if (data.type === 'hkustgz-talk-dock' && isTalkId(data.id)) {
      setPlayerMode('pip');
      openTalk(data.id, 'pip');
    }
  });
}

function pageName() {
  const path = location.pathname.split('/').pop() || 'index.html';
  return path.replace('.html', '') || 'index';
}

function bindPlayerControls() {
  document.querySelectorAll('[data-player-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = setPlayerMode(button.dataset.playerMode);
      const openId = document.querySelector('.talk-window:not([hidden])')?.dataset.talkId
        || document.querySelector('.talk-pip:not([hidden])')?.dataset.talkId;
      if (openId) openTalk(openId, next);
    });
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-talk]')) closeTalkWindow();
    if (event.target.closest('[data-talk-dock]')) {
      const id = document.querySelector('.talk-window')?.dataset.talkId;
      if (id) {
        setPlayerMode('pip');
        openTalk(id, 'pip');
      }
    }
    if (event.target.closest('[data-pip-expand]')) {
      const id = document.querySelector('.talk-pip')?.dataset.talkId;
      if (id) {
        setPlayerMode('window');
        openTalk(id, 'window');
      }
    }
    if (event.target.closest('[data-pip-close]')) closePip();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTalkWindow();
      closePip();
    }
  });
}

export function refreshTalks() {
  renderList(document.querySelector('[data-talks-list="past"]'), talksByStatus('past'), 'upcomingEmpty');
  renderList(document.querySelector('[data-talks-list="upcoming"]'), talksByStatus('upcoming'), 'upcomingEmpty');
  setPlayerMode(getPlayerMode());
  if (pageName() === 'talk') {
    const talk = getTalkById(new URLSearchParams(location.search).get('id'));
    if (talk) fillTalkPage(talk);
  }
}

export function initTalks() {
  const page = pageName();
  if (page === 'talk') {
    initTalkPage();
    initMessageBridge();
    if (document.body.classList.contains('talk-embed')) return;
    ensureChrome();
    bindPlayerControls();
    return;
  }
  if (page !== 'talks') return;
  ensureChrome();
  refreshTalks();
  bindList(document.querySelector('[data-talks-list="past"]'));
  bindList(document.querySelector('[data-talks-list="upcoming"]'));
  bindPlayerControls();
  initMessageBridge();
  const hashId = location.hash.replace('#talk=', '');
  if (isTalkId(hashId) && getTalkById(hashId)) openTalk(hashId);
}
