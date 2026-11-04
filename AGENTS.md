# Repository Guide

HAI-HKUST is a bilingual, dependency-free static club site published through GitHub Pages.

**Every line of code should justify its existence. Define once. Reuse everywhere.**

## Responsibility boundaries

- Seven root HTML pages own their public URLs and semantic content.
- assets/css/site.css owns the common visual system, responsive styles and page-specific presentation.
- assets/js/site.js owns the shared header/footer, language switch and page interactions; do not duplicate layout templates.
- assets/js/i18n.js owns the bilingual UI dictionary. Keep Chinese and English keys aligned.
- assets/js/talks-data.js is the single Talks content source. Preserve ID, status, date, speakers, video links and talk.html?id=... URLs.
- assets/js/talks.js renders talks, replay and embedded details; util.js owns shared encoding/URL helpers.
- scripts/build_site.py validates source and generates only the public _site/ output.
- tests/ protects essential page, content and resource contracts.

## Compatibility and security

- Preserve localStorage language preference, language query override, Talk playback and iframe/embed behavior.
- Preserve existing pages, anchors, keyboard controls, mobile navigation and reduced-motion support.
- Maintain Content Security Policy and safe external links. Never introduce inline scripts, trackers or extra runtime dependencies casually.
- Load third-party video embeds on demand, not automatically.
- Preserve original facts and provenance in event and speaker content; do not invent or rewrite biographies.

## Engineering and change management

- Prefer coherent restructuring over speculative fallbacks and accumulated CSS or JavaScript patches.
- Introduce shared abstractions only where they reduce total maintenance; avoid ceremonial layers or artificial file splitting.
- Do not manually edit dated cache query tokens. The build fingerprints release assets once.
- Run: python3 -m unittest discover -s tests -p 'test_*.py' -v
- Run: python3 scripts/build_site.py --build
- Check browser behavior in both languages and mobile/desktop, including navigation and Talk dialogs.
- Major engineering changes belong in reviewed PRs; keep main deployable.
