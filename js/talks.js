import { translations } from './i18n.js?v=20261023-footer-alignment';
import { talksByStatus, getTalkById } from './talks-data.js?v=20261023-footer-alignment';
import {
  drivePreviewUrl,
  driveViewUrl,
  escapeHtml,
  hardenExternalLinks,
  isEmbedded,
  isTalkId,
  localized,
  setText,
  talkPageUrl
} from './util.js';

let dialogReturnFocus = null;
let inertedElements = [];

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

function videoSource(talk) {
  return talk.video?.driveUrl || talk.video?.fileId || '';
}

function recordingPreviewUrl(talk) {
  return talk.video?.tencentUrl || drivePreviewUrl(videoSource(talk));
}

function recordingViewUrl(talk) {
  return talk.video?.tencentUrl || driveViewUrl(videoSource(talk));
}

function recordingLinkLabel(talk) {
  return talk.video?.tencentUrl ? dict().openTencent : dict().openDrive;
}

function createRecordingFrame(talk, title) {
  const src = recordingPreviewUrl(talk);
  const frame = document.createElement('iframe');
  frame.className = 'talk-video-frame';
  frame.title = title || dict().talkVideoTitle;
  frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
  frame.setAttribute('allowfullscreen', '');
  if (src) frame.src = src;
  return frame;
}

function renderTags(tags = []) {
  return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function renderUpcomingTalk(talk) {
  return `
    <article class="upcoming-talk" aria-labelledby="upcoming-${escapeHtml(talk.id)}">
      <div class="upcoming-speaker">
        <img class="speaker-photo" src="${escapeHtml(talk.photo)}" alt="${escapeHtml(copy(talk, 'presenter'))}" width="1080" height="1440" loading="lazy">
        <div class="upcoming-speaker-caption"><strong>${escapeHtml(copy(talk, 'presenter'))}</strong><span>${escapeHtml(copy(talk, 'affiliation'))}</span></div>
      </div>
      <div class="upcoming-copy">
        <div class="event-type">${escapeHtml(copy(talk, 'type'))}</div>
        <h3 id="upcoming-${escapeHtml(talk.id)}">${escapeHtml(copy(talk, 'title'))}</h3>
        <p class="upcoming-time"><time datetime="${escapeHtml(talk.date)}T19:00:00+08:00">${escapeHtml(copy(talk, 'time'))}</time></p>
        <p class="upcoming-summary">${escapeHtml(copy(talk, 'abstract'))}</p>
        <div class="upcoming-topics"><h4>${escapeHtml(dict().discussionTopics)}</h4><ol>${copy(talk, 'topics', []).map((topic) => `<li>${escapeHtml(topic)}</li>`).join('')}</ol></div>
      </div>
      <div class="speaker-bio upcoming-bio"><div class="bio-label">${escapeHtml(dict().speakerBioLabel)}</div><p>${escapeHtml(copy(talk, 'bio'))}</p></div>
    </article>
  `;
}

function renderTalkCard(talk) {
  if (talk.status === 'upcoming') return renderUpcomingTalk(talk);
  const title = copy(talk, 'title');
  const presenter = copy(talk, 'presenter');
  const affiliation = copy(talk, 'affiliation');
  return `
    <article class="talk-entry">
      <a class="talk-entry-media" href="${escapeHtml(talkPageUrl(talk.id))}" aria-label="${escapeHtml(title)}">
        ${talk.cover ? `<img src="${escapeHtml(talk.cover)}" alt="" loading="lazy" width="640" height="360">` : ''}
        <span class="talk-entry-cover-title">${escapeHtml(title)}</span><span class="link-chevron" aria-hidden="true"></span>
      </a>
      <div class="talk-entry-copy">
        <p class="talk-entry-presenter">${escapeHtml(presenter)}</p>
        <p class="talk-entry-affiliation">${escapeHtml(affiliation)}</p>
        <div class="talk-entry-bottom"><time datetime="${escapeHtml(talk.date)}">${escapeHtml(formatDate(talk.date))}</time>
        ${recordingPreviewUrl(talk) ? `<button type="button" class="text-link" data-open-talk="${escapeHtml(talk.id)}">${escapeHtml(dict().replayShort)}</button>` : `<span class="talk-entry-pending">${escapeHtml(dict().replayPending)}</span>`}</div>
      </div>
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
      <span class="talk-focus-guard" tabindex="0" data-focus-guard="start"></span>
      <header class="talk-window-bar">
        <div>
          <p class="talk-window-kicker"></p>
          <h2 id="talk-window-title"></h2>
        </div>
        <div class="talk-window-actions">
          <a class="ghost-btn" data-talk-drive target="_blank" rel="noopener noreferrer" hidden></a>
          <button type="button" class="ghost-btn talk-close" data-close-talk aria-label="Close">×</button>
        </div>
      </header>
      <div class="talk-window-body">
        <div class="talk-window-video" data-talk-window-video></div>
      </div>
      <span class="talk-focus-guard" tabindex="0" data-focus-guard="end"></span>
    </div>
  `;
  // Focus guards also catch Tab leaving the cross-origin video iframe.
  windowWrap.querySelectorAll('[data-focus-guard]').forEach((guard) => {
    guard.addEventListener('focus', () => {
      const controls = [...windowWrap.querySelectorAll('button:not([disabled]), a[href], iframe')]
        .filter((element) => !element.hidden && element.getClientRects().length);
      const target = guard.dataset.focusGuard === 'start' ? controls.at(-1) : controls[0];
      target?.focus();
    });
  });
  document.body.append(windowWrap);
  hardenExternalLinks(windowWrap);
}

function closeTalkWindow(restoreFocus = true) {
  const wrap = document.querySelector('.talk-window');
  const wasOpen = wrap && !wrap.hidden;
  const id = wrap?.dataset.talkId;
  const stage = wrap?.querySelector('[data-talk-window-video]');
  if (stage) stage.replaceChildren();
  if (wrap) {
    wrap.hidden = true;
    wrap.classList.remove('is-open');
    wrap.dataset.talkId = '';
  }
  document.body.classList.remove('talk-window-open');
  inertedElements.forEach((element) => { element.inert = false; });
  inertedElements = [];
  if (wasOpen && restoreFocus) {
    const returnFocus = dialogReturnFocus?.isConnected ? dialogReturnFocus
      : isTalkId(id) ? document.querySelector(`[data-open-talk="${id}"]`) : null;
    returnFocus?.focus();
    dialogReturnFocus = null;
  }
}

function openTalkWindow(talk) {
  ensureChrome();
  const wrap = document.querySelector('.talk-window');
  const stage = wrap.querySelector('[data-talk-window-video]');
  const driveHref = recordingViewUrl(talk);
  wrap.hidden = false;
  wrap.classList.add('is-open');
  wrap.dataset.talkId = talk.id;
  setText(wrap.querySelector('.talk-window-kicker'), `${copy(talk, 'type')} · ${copy(talk, 'presenter')}`);
  setText(wrap.querySelector('#talk-window-title'), copy(talk, 'title'));
  const driveLink = wrap.querySelector('[data-talk-drive]');
  if (driveHref) {
    driveLink.hidden = false;
    driveLink.href = driveHref;
    setText(driveLink, recordingLinkLabel(talk));
  } else {
    driveLink.hidden = true;
    driveLink.removeAttribute('href');
  }
  stage.replaceChildren(createRecordingFrame(talk, copy(talk, 'title')));
  if (!recordingPreviewUrl(talk)) {
    setText(stage, dict().recordingPending);
  }
  document.body.classList.add('talk-window-open');
  inertedElements = [...document.body.children].filter((element) => element !== wrap && !element.inert);
  inertedElements.forEach((element) => { element.inert = true; });
  wrap.querySelector('[data-close-talk].talk-close').focus();
}

function openTalk(id) {
  if (!isTalkId(id)) return;
  const talk = getTalkById(id);
  if (talk) openTalkWindow(talk);
}

function bindList(container) {
  container?.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open-talk], [data-talk-id]');
    if (!opener || !container.contains(opener) || event.target.closest('a')) return;
    const id = opener.dataset.openTalk || opener.dataset.talkId;
    if (id) {
      dialogReturnFocus = opener.matches('[data-open-talk]') ? opener : opener.querySelector('[data-open-talk]');
      openTalk(id);
    }
  });
}

function fillTalkPage(talk) {
  const langPack = talk[currentLang()] || talk.en;
  const title = copy(talk, 'title');
  document.title = `${title} | HKUST Frontier AI Club`;
  setText(document.querySelector('[data-talk-kicker]'), copy(talk, 'type'));
  setText(document.querySelector('[data-talk-title]'), title);
  setText(document.querySelector('[data-talk-abstract]'), copy(talk, 'abstract'));
  setText(document.querySelector('[data-talk-presenter]'), copy(talk, 'presenter'));
  setText(document.querySelector('[data-talk-affiliation]'), copy(talk, 'affiliation'));
  setText(document.querySelector('[data-talk-bio]'), copy(talk, 'bio'));
  const portrait = document.querySelector('[data-talk-portrait]');
  if (portrait) {
    portrait.hidden = !talk.photo;
    if (talk.photo) {
      portrait.src = talk.photo;
      portrait.alt = copy(talk, 'presenter');
    } else portrait.removeAttribute('src');
  }
  setText(document.querySelector('[data-talk-date]'), formatDate(talk.date));
  setText(document.querySelector('[data-talk-open]'), copy(talk, 'open'));
  const tags = document.querySelector('[data-talk-tags]');
  if (tags) tags.innerHTML = renderTags(langPack.tags || []);
  const topics = copy(talk, 'topics', []);
  const topicsSection = document.querySelector('[data-talk-topics-section]');
  if (topicsSection) {
    topicsSection.hidden = !topics.length;
    topicsSection.querySelector('[data-talk-topics]').innerHTML = topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('');
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
}

function pageName() {
  const path = (location.pathname.replace(/\/+$/, '') || '/index.html').split('/').pop() || 'index.html';
  return path.replace(/\.html$/i, '') || 'index';
}

function bindPlayerControls() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-talk]')) closeTalkWindow();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTalkWindow();
  });
}

export function refreshTalks() {
  renderList(document.querySelector('[data-talks-list="past"]'), talksByStatus('past'), 'upcomingEmpty');
  renderList(document.querySelector('[data-talks-list="upcoming"]'), talksByStatus('upcoming'), 'upcomingEmpty');
  if (pageName() === 'talk') {
    const talk = getTalkById(new URLSearchParams(location.search).get('id'));
    if (talk) fillTalkPage(talk);
  }
}

export function initTalks() {
  const page = pageName();
  if (page === 'talk') {
    initTalkPage();
    if (document.body.classList.contains('talk-embed')) return;
    return;
  }
  if (page !== 'talks' && page !== 'events') return;
  ensureChrome();
  refreshTalks();
  bindList(document.querySelector('[data-talks-list="past"]'));
  bindList(document.querySelector('[data-talks-list="upcoming"]'));
  bindPlayerControls();
  const hashId = location.hash.replace('#talk=', '');
  if (isTalkId(hashId) && getTalkById(hashId)) openTalk(hashId);
}
