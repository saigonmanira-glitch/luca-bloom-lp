// ブラウザ動作テスト：全ページの表示とエラー、3D・スライダー・購入導線・異常時の静止画
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { findBanned } from '../tools/claims.mjs';
import { MENU, INTL_PAGES, LOCALES, alternates } from '../tools/i18n/site.mjs';

// 海外向けページ（tools/build-i18n.mjs が生成）
const INTL = INTL_PAGES;
const pages = ['', 'privacy.html', 'jp/', 'jp/manual.html', ...INTL, 'column/'].concat(
  fs
    .readdirSync(new URL('../column/', import.meta.url))
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => `column/${f}`),
);

// ページ内のJavaScriptエラーとコンソールのエラーを集める
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

for (const p of pages) {
  test(`表示できてエラーがない：/${p}`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(p, { waitUntil: 'load' });
    expect(res.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('存在しないURLは404ページを返す', async ({ page }) => {
  const res = await page.goto('no-such-page');
  expect(res.status()).toBe(404);
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
});

test('3D：描画が始まると静止画が隠れ、スライダーで開き幅の表示が変わる', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('#fb')).toBeHidden();
  await expect(page.locator('#gapv')).toHaveText('全閉');
  await page.locator('#gap').fill('70');
  await expect(page.locator('#gapv')).toHaveText('70mm');
  await page.locator('#gap').fill('35');
  await expect(page.locator('#gapv')).toHaveText('35mm');
  expect(errors).toEqual([]);
});

test('3D：WebGLが強制終了したら静止画に戻る', async ({ page }) => {
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await page.evaluate(() => {
    const c = document.querySelector('#stage canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gl.getExtension('WEBGL_lose_context').loseContext();
  });
  await expect(page.locator('#stage canvas')).toHaveCount(0);
  await expect(page.locator('#fb')).toBeVisible();
});

test('3D：WebGLが使えない端末では静止画のまま', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : orig.call(this, type, ...rest);
    };
  });
  const errors = watchErrors(page);
  await page.goto('', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await expect(page.locator('#stage canvas')).toHaveCount(0);
  await expect(page.locator('#fb')).toBeVisible();
  expect(errors).toEqual([]);
});

test('化粧箱の3Dは、近づくまで作らない', async ({ page }) => {
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('#boxstage canvas')).toHaveCount(0);
  await page.locator('#boxstage').scrollIntoViewIfNeeded();
  await expect(page.locator('#boxstage canvas')).toHaveCount(1, { timeout: 30_000 });
});

test('購入ボタン：すべてAmazonの商品ページへ、別タブ・sponsored付き', async ({ page }) => {
  await page.goto('');
  const links = page.locator('a[href*="amazon.co.jp"]');
  expect(await links.count()).toBeGreaterThanOrEqual(3);
  for (const a of await links.all()) {
    await expect(a).toHaveAttribute('href', 'https://www.amazon.co.jp/dp/B0HHXQ1X4C');
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /noopener/);
    await expect(a).toHaveAttribute('rel', /sponsored/);
  }
});

test('画面下の購入バー：購入ボタンが見えている間は隠れる', async ({ page }) => {
  await page.goto('');
  await page.locator('.js-buy').first().scrollIntoViewIfNeeded();
  await expect(page.locator('#bar')).toHaveClass(/hide/);
  await page.locator('#houkei').scrollIntoViewIfNeeded();
  await expect(page.locator('#bar')).not.toHaveClass(/hide/);
});

// ---------- 海外向けページ（英国・豪州／米国／メキシコ／フランス） ----------
const LOCALE_TESTS = [
  { dir: 'en/', lang: 'en-GB', claims: 'en', closed: 'Closed', v45: 'Opening width 45 millimetres', hosts: ['www.amazon.co.uk', 'www.amazon.com.au'] },
  { dir: 'us/', lang: 'en-US', claims: 'en', closed: 'Closed', v45: 'Opening width 45 millimeters', hosts: ['www.amazon.com'] },
  { dir: 'mx/', lang: 'es-MX', claims: 'es', closed: 'Cerrado', v45: 'Apertura de 45 milímetros', hosts: ['www.amazon.com.mx'] },
  { dir: 'ca/', lang: 'en-CA', claims: 'en', closed: 'Closed', v45: 'Opening width 45 millimetres', hosts: ['www.amazon.ca'] },
  { dir: 'ca/fr/', lang: 'fr-CA', claims: 'fr', closed: 'Fermé', v45: 'Écartement de 45 millimètres', hosts: ['www.amazon.ca'] },
];

for (const L of LOCALE_TESTS) {
  test(`${L.lang}：言語の指定・スライダーの表示がその言語になる`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(L.dir, { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute('lang', L.lang);
    await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
    await expect(page.locator('#gapv')).toHaveText(L.closed);
    await page.locator('#gap').fill('55');
    await expect(page.locator('#gapv')).toHaveText('55mm');
    await page.locator('#gap').fill('45');
    await expect(page.locator('#gap')).toHaveAttribute('aria-valuetext', L.v45);
    expect(errors).toEqual([]);
  });

  test(`${L.lang}：購入ボタンはその国の Amazon へ、別タブ・sponsored付き`, async ({ page }) => {
    await page.goto(L.dir);
    const links = page.locator('a[href*="www.amazon."]');
    const hosts = await links.evaluateAll((as) => as.map((a) => new URL(a.href).hostname));
    expect(new Set(hosts)).toEqual(new Set(L.hosts));
    expect(hosts.length).toBeGreaterThanOrEqual(3); // ヒーロー・最後・下部バー
    for (const a of await links.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
      await expect(a).toHaveAttribute('rel', /sponsored/);
    }
  });

  // 各国の規制（英国 MHRA・ASA、豪州 TGA、米国 FDA・FTC、メキシコ COFEPRIS、フランス ANSM）を踏まえ、
  // 病名・治療・効果・比較をうたう語を商品ページに入れない（一覧は tools/claims.mjs）
  test(`${L.lang}：病名・治療・効果をうたう語を使っていない`, async ({ page }) => {
    await page.goto(L.dir);
    const text = [
      await page.locator('body').innerText(),
      await page.title(),
      await page.locator('meta[name="description"]').getAttribute('content'),
      ...(await page.locator('script[type="application/ld+json"]').allTextContents()),
    ].join('\n');
    const hit = findBanned(text, L.claims);
    expect(hit, `/${L.dir} に「${hit}」`).toBeNull();
  });

  test(`${L.lang}：言語メニューから全言語のページへ移動できる`, async ({ page, request }) => {
    await page.goto(L.dir);
    const menu = page.locator('header details.langs');
    await menu.locator('summary').click();
    const links = menu.locator('a');
    await expect(links).toHaveCount(MENU.length);
    await expect(menu.locator('a[aria-current="page"]')).toHaveAttribute('lang', L.lang);
    for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
      expect((await request.get(href.replace(/^\//, ''))).status(), href).toBe(200);
    }
  });
}

test('多言語：全言語のページが hreflang で同じ組を相互に指し合っている', async ({ page }) => {
  const groups = { lp: ['', ...LOCALES.map((L) => L.dir)], privacy: ['privacy.html', ...LOCALES.map((L) => `${L.dir}privacy.html`)] };
  for (const [kind, list] of Object.entries(groups)) {
    const expected = Object.fromEntries(alternates(kind));
    for (const p of list) {
      await page.goto(p);
      const alt = Object.fromEntries(
        await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => [l.hreflang, l.href])),
      );
      expect(alt, `/${p}`).toEqual(expected);
      expect(Object.values(alt), `/${p} が自分自身を含まない`).toContain(await page.locator('link[rel="canonical"]').getAttribute('href'));
    }
  }
});
