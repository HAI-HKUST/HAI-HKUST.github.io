/* Browser-only regression: no runtime dependencies are shipped with the site. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../_site');
const pages = ['index.html', 'talks.html', 'events.html', 'talk.html',
  'handbook.html', 'collaboration.html', 'links.html'];
const mime = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.json':'application/json', '.webmanifest':'application/manifest+json'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('Not found'); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    for (const width of [390, 1280]) {
      for (const filename of pages) {
        const page = await browser.newPage({viewport:{width,height:844}});
        await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const route = filename === 'talk.html' ? 'talk.html?id=uniwam' : filename;
        const response = await page.goto(origin + '/' + route, {waitUntil:'load'});
        assert.equal(response.status(), 200, route);
        await page.locator('.site-header .nav-links').waitFor({state:'attached'});
        assert.equal(await page.locator('.site-header').count(), 1, filename);
        assert.equal(await page.locator('.site-footer').count(), 1, filename);
        assert.ok((await page.title()).length > 4, 'Missing document title: ' + filename);
        assert.equal(await page.locator('#langToggle').count(), 1, filename);
        await page.locator('#langToggle').click();
        assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN', filename);
        assert.equal((await page.locator('.nav-links a').first().textContent()).trim(), '首页', filename);
        if (width === 390) {
          await page.locator('#menuToggle').click();
          assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'), 'true', filename);
          await page.locator('#menuToggle').click();
          assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'), 'false', filename);
        }
        if (filename === 'talk.html') {
          assert.match(await page.locator('[data-talk-title]').textContent(), /UniWAM/);
        }
        if (filename === 'talks.html') {
          assert.ok(await page.locator('[data-talks-list="past"] article').count() >= 2);
          assert.equal(await page.locator('.talk-window iframe').count(), 0,
            'Video iframe must be created only on user request');
          await page.locator('[data-open-talk]').first().click();
          assert.equal(await page.locator('[role="dialog"]').isVisible(), true,
            'Replay dialog opens on explicit request');
          assert.equal(await page.locator('.talk-window iframe').count(), 1,
            'Playback loads only inside open replay dialog');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('[role="dialog"]').isVisible(), false,
            'Escape closes replay dialog');
          assert.equal(await page.locator('.talk-window iframe').count(), 0,
            'Closing dialog removes the embedded third-party player');
        }
        assert.deepEqual(errors, [], filename + ' @ ' + width + 'px');
        await page.close();
      }
    }
    const restricted = await browser.newContext();
    await restricted.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('Storage blocked', 'SecurityError'); }
      });
    });
    const blocked = await restricted.newPage();
    const blockedErrors = [];
    blocked.on('pageerror', error => blockedErrors.push(error.message));
    await blocked.goto(origin + '/talks.html?lang=zh', {waitUntil:'load'});
    await blocked.locator('.site-header').waitFor();
    assert.equal(await blocked.locator('html').getAttribute('lang'), 'zh-CN');
    assert.ok(await blocked.locator('[data-talks-list="past"] article').count() >= 2,
      'Talks must render when browser storage is unavailable');
    await blocked.locator('#langToggle').click();
    assert.equal(await blocked.locator('html').getAttribute('lang'), 'en');
    assert.deepEqual(blockedErrors, [], 'Unavailable localStorage must not break page initialization');
    await restricted.close();
    console.log('Browser smoke passed: 7 routes × 2 widths, i18n, navigation, Talks and restricted storage');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
