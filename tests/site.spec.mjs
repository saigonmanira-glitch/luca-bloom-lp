// ブラウザ動作テスト：全ページの表示とエラー、3D・スライダー・購入導線・異常時の静止画
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const pages = ['', 'privacy.html', 'jp/', 'jp/manual.html', 'en/', 'en/privacy.html', 'column/'].concat(
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

// ---------- 英語版（/en/）：英国・豪州向け ----------
test('英語版：スライダーの表示が英語になる', async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('en/', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('#gapv')).toHaveText('Closed');
  await page.locator('#gap').fill('45');
  await expect(page.locator('#gapv')).toHaveText('45mm');
  await expect(page.locator('#gap')).toHaveAttribute('aria-valuetext', 'Opening width 45 millimetres');
  expect(errors).toEqual([]);
});

test('英語版：購入ボタンは Amazon UK と Amazon Australia へ、別タブ・sponsored付き', async ({ page }) => {
  await page.goto('en/');
  const links = page.locator('a[href*="www.amazon."]');
  const hrefs = await links.evaluateAll((as) => as.map((a) => new URL(a.href).hostname));
  expect(new Set(hrefs)).toEqual(new Set(['www.amazon.co.uk', 'www.amazon.com.au']));
  expect(await page.locator('a[href*="amazon.co.jp"]').count()).toBe(0);
  for (const a of await links.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /noopener/);
    await expect(a).toHaveAttribute('rel', /sponsored/);
  }
});

test('英語版：日本語版と英語版が hreflang で相互に指し合っている', async ({ page }) => {
  const pairs = [['', 'en/'], ['privacy.html', 'en/privacy.html']];
  const site = 'https://luca-bloom.com/';
  for (const [ja, en] of pairs) {
    for (const p of [ja, en]) {
      await page.goto(p);
      const alt = Object.fromEntries(
        await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => [l.hreflang, l.href])),
      );
      expect(alt).toEqual({ ja: site + ja, 'en-GB': site + en, 'en-AU': site + en, 'x-default': site + en });
    }
  }
});

// 英国（MHRA・ASA）・豪州（TGA）の規制を踏まえ、病名・治療・効果をうたう語を英語版に入れない
test('英語版：病名・治療・効果をうたう語を使っていない', async ({ page }) => {
  const banned = /\b(phimosis|paraphimosis|circumcision|treat(s|ment)?|cure[sd]?|heal|correct(s|ion)?|improve[sd]?|prevent(s|ion)?|clinically|doctor[- ]recommended|guarantee[sd]?|best|no\.? ?1|number one|industry[- ]leading|widest|largest)\b/i;
  const allowed = /not intended to diagnose, treat or prevent|receiving treatment for the area/gi; // 否定・注意書きとしての使用は可
  for (const p of ['en/']) { // 商品を紹介するページが対象（プライバシーポリシーの「訂正の請求」などは対象外）
    await page.goto(p);
    const text = (await page.locator('body').innerText()) + (await page.title()) + (await page.locator('meta[name="description"]').getAttribute('content'));
    const hit = text.replace(allowed, '').match(banned);
    expect(hit, `/${p} に「${hit && hit[0]}」`).toBeNull();
  }
});
