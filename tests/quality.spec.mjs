// 品質テスト：アクセシビリティ（WCAG 2.1 AA・推奨事項）・フォントの抜け字・表示の軽さ・構造化データ・セキュリティ設定
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { INTL_PAGES, LOCALES } from '../tools/i18n/site.mjs';
import zlib from 'node:zlib';
import * as fontkit from 'fontkit';

const ROOT = new URL('../', import.meta.url);
const INTL = INTL_PAGES;
const LP = ['', ...LOCALES.map((L) => L.dir)]; // 3D のある商品ページ
const pages = ['', 'privacy.html', 'jp/', 'jp/manual.html', ...INTL, 'column/'].concat(
  fs
    .readdirSync(new URL('column/', ROOT))
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => `column/${f}`),
);

// ---------- アクセシビリティ：axe-core で WCAG 2.1 A/AA と推奨事項（best-practice）の違反がないこと ----------
for (const p of [...pages, 'no-such-page']) {
  test(`アクセシビリティ（WCAG 2.1 AA・推奨事項）：/${p}`, async ({ page }) => {
    await page.goto(p, { waitUntil: 'load' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
    const found = r.violations.map((v) => `${v.id}: ${v.help}（${v.nodes.map((n) => n.target.join(' ')).join(' / ')}）`);
    expect(found).toEqual([]);
  });
}

// ---------- フォント：表示される文字が、その太さのフォントに全て入っていること ----------
// 文章を変えて npm run build:fonts を忘れると、ここで失敗する
const fonts = Object.fromEntries(
  [400, 700, 900].map((w) => [w, fontkit.openSync(new URL(`assets/fonts/zenkaku-${w}.woff2`, ROOT).pathname)]),
);
const NOT_IN_SOURCE = new Set(['φ']); // 元フォント自体に無い文字（端末の標準書体で表示される）

test('フォント：全ページの表示文字が、それぞれの太さのフォントに収録されている', async ({ page }) => {
  const missing = [];
  for (const p of pages) {
    await page.goto(p, { waitUntil: 'load' });
    const byWeight = await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => (d.open = true));
      const out = { 400: '', 700: '', 900: '' };
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const el = n.parentElement;
        if (!el || el.closest('script,style,noscript')) continue;
        const cs = getComputedStyle(el);
        if (!cs.fontFamily.includes('Zen Kaku Gothic New')) continue;
        const w = +cs.fontWeight;
        out[w <= 550 ? 400 : w <= 800 ? 700 : 900] += n.textContent;
      }
      return out;
    });
    for (const [w, text] of Object.entries(byWeight)) {
      for (const ch of new Set(text)) {
        if (/\s/.test(ch) || NOT_IN_SOURCE.has(ch)) continue;
        if (!fonts[w].hasGlyphForCodePoint(ch.codePointAt(0))) missing.push(`/${p} ${w}：${ch}`);
      }
    }
  }
  expect(missing).toEqual([]);
});

// ---------- 表示の軽さ：トップページの通信量・外部サーバーへの接続・レイアウトのずれ ----------
test('軽さ：トップページは3D表示まで含めて500KB以内（圧縮後）、外部サーバーに接続しない、レイアウトのずれ0.05未満', async ({ page }) => {
  const external = [];
  let bytes = 0;
  page.on('request', (req) => {
    if (!req.url().startsWith('http://localhost')) external.push(req.url());
  });
  // 本番（GitHub Pages）は文字系のファイルを gzip 圧縮して送るため、同じ条件で数える
  const pending = [];
  page.on('response', (res) =>
    pending.push(
      res
        .body()
        .then((b) => {
          const text = /text|javascript|json|svg|xml/.test(res.headers()['content-type'] || '');
          bytes += text ? zlib.gzipSync(b).length : b.length;
        })
        .catch(() => {}),
    ),
  );
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1000);
  await Promise.all(pending);
  expect(external).toEqual([]);
  expect(bytes).toBeLessThan(500 * 1024);
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.05);
});

// ---------- 構造化データ：全ページの JSON-LD が正しく、商品情報と FAQ が画面と一致 ----------
test('構造化データ：JSON-LD が読み込めて、価格と FAQ が画面の表示と一致する', async ({ page }) => {
  test.setTimeout(180_000); // 全25ページを順に開くため
  // 構造化データと FAQ は HTML に直接書かれているため、3D などのスクリプトは読み込まない（CI での時間切れ防止）
  await page.route('**/assets/js/**', (r) => r.abort());
  for (const p of pages) {
    await page.goto(p, { waitUntil: 'domcontentloaded' }); // 構造化データは HTML に直接書かれているため、画像や3Dの読み込みは待たない
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, `/${p} に構造化データがありません`).toBeGreaterThan(0);
    for (const b of blocks) expect(() => JSON.parse(b), `/${p} の JSON-LD が壊れています`).not.toThrow();
  }
  await page.goto('', { waitUntil: 'domcontentloaded' });
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
  const product = ld.find((x) => x['@type'] === 'Product');
  expect(product.offers).toMatchObject({ price: '5800', priceCurrency: 'JPY' });
  await expect(page.locator('.price').first()).toContainText('5,800円');
  const faq = ld.find((x) => x['@type'] === 'FAQPage');
  const shown = await page.locator('.faq details summary').allTextContents();
  expect(faq.mainEntity.map((q) => q.name)).toEqual(shown.map((s) => s.trim()));
  // 海外向けページも FAQ が画面と一致すること（言語メニューの details は除く）
  for (const p of LP.slice(1)) {
    await page.goto(p, { waitUntil: 'domcontentloaded' });
    const ldL = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
    const faqL = ldL.find((x) => x['@type'] === 'FAQPage');
    const shownL = await page.locator('.faq details summary').allTextContents();
    expect(faqL.mainEntity.map((q) => q.name), `/${p}`).toEqual(shownL.map((s) => s.trim()));
  }
});

// ---------- セキュリティ：CSP（読み込みを自サイトに限定）に違反する読み込み・実行がないこと ----------
for (const p of [...pages, 'no-such-page']) {
  test(`セキュリティ：CSP 違反がない：/${p}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto(p, { waitUntil: 'load' });
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
    if (LP.includes(p)) {
      await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
      await page.locator('#boxstage').scrollIntoViewIfNeeded();
      await expect(page.locator('#boxstage canvas')).toHaveCount(1, { timeout: 30_000 });
    }
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

// ---------- セキュリティ：CSP の中身（危険な許可がないこと）と、脆弱性の連絡先（security.txt） ----------
test('セキュリティ：全ページの CSP に unsafe-inline・unsafe-eval・外部ドメインの許可がない', async () => {
  const bad = [];
  for (const f of [...pages.map((p) => (p === '' || p.endsWith('/') ? `${p}index.html` : p)), '404.html']) {
    const html = fs.readFileSync(new URL(f, ROOT), 'utf8');
    const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
    if (!csp.startsWith("default-src 'none'")) bad.push(`${f}：default-src 'none' ではない`);
    if (/unsafe-|https?:|\*|data:|blob:/.test(csp)) bad.push(`${f}：危険な許可 ${csp.match(/unsafe-[a-z-]+|https?:\S*|\*|data:|blob:/)[0]}`);
    if (!csp.includes("require-trusted-types-for 'script'")) bad.push(`${f}：Trusted Types なし`);
  }
  expect(bad).toEqual([]);
});

test('セキュリティ：security.txt（脆弱性の連絡先）が有効期限内で公開されている', async ({ request }) => {
  const res = await request.get('.well-known/security.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/^Contact: mailto:\S+@\S+$/m);
  const exp = new Date(body.match(/^Expires: (.+)$/m)[1]);
  expect(exp.getTime()).toBeGreaterThan(Date.now() + 30 * 24 * 3600 * 1000); // 期限切れの30日前に失敗して更新を促す
});
