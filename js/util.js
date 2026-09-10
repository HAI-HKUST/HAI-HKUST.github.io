const DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;
const TALK_ID_PATTERN = /^[a-z0-9-]+$/;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setText(el, value) {
  if (el) el.textContent = value ?? '';
}

export function isTalkId(value) {
  return TALK_ID_PATTERN.test(String(value || ''));
}

export function extractDriveId(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';
  if (DRIVE_ID_PATTERN.test(trimmed) && !trimmed.includes('/')) return trimmed;
  const fileMatch = trimmed.match(/\/(?:file|open)\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && DRIVE_ID_PATTERN.test(fileMatch[1])) return fileMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && DRIVE_ID_PATTERN.test(idMatch[1])) return idMatch[1];
  return '';
}

export function drivePreviewUrl(input) {
  const id = extractDriveId(input);
  return id ? `https://drive.google.com/file/d/${id}/preview` : '';
}

export function talkPageUrl(id, embed = false) {
  if (!isTalkId(id)) return '';
  const params = new URLSearchParams({ id });
  if (embed) params.set('embed', '1');
  return `talk.html?${params.toString()}`;
}

export function localized(entry, lang, fallback = '') {
  if (!entry || typeof entry !== 'object') return fallback;
  return entry[lang] || entry.en || entry.zh || fallback;
}

export function isEmbedded() {
  if (new URLSearchParams(location.search).get('embed') === '1') return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function hardenExternalLinks(root = document) {
  root.querySelectorAll('a[target="_blank"]').forEach((anchor) => {
    const rel = new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    anchor.setAttribute('rel', Array.from(rel).join(' '));
  });
}
