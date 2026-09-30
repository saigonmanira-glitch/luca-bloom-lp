// ブラウザ動作テスト：全ページの表示とエラー、3D・スライダー・購入導線・異常時の静止画
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const pages = ['', 'privacy.html', 'jp/', 'jp/manual.html', 'column/'].concat(
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
  await expect(page.locator('.tour-space')).toBeHidden(); // 固定表示の空き領域も消える
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
  await expect(page.locator('.tour-space')).toBeHidden();
  expect(errors).toEqual([]);
});

test('3D：スクロールで場面が 01全景→02内部構造→03開き幅 と切り替わり、引き出し線が出る', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('.tour-cap li.on')).toContainText('全景', { timeout: 15_000 });
  const at = (f) =>
    page.evaluate((f) => {
      const root = document.getElementById('tour');
      const top = parseFloat(root.querySelector('.tour-sticky').style.top) || 0;
      const y = root.getBoundingClientRect().top + scrollY - top + f * root.querySelector('.tour-space').offsetHeight;
      scrollTo(0, y);
    }, f);
  await at(0.5);
  await expect(page.locator('.tour-cap li.on')).toContainText('内部構造', { timeout: 15_000 });
  await expect.poll(() => page.locator('.co[data-k="screw"]').evaluate((e) => +e.style.opacity), { timeout: 15_000 }).toBeGreaterThan(0.9);
  await at(0.95);
  await expect(page.locator('.tour-cap li.on')).toContainText('開き幅', { timeout: 15_000 });
  await expect.poll(() => page.locator('.co[data-k="arm"]').evaluate((e) => +e.style.opacity), { timeout: 15_000 }).toBeGreaterThan(0.9);
  expect(errors).toEqual([]);
});

test('3D：「動きを減らす」設定ではスクロール連動を使わない', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('', { waitUntil: 'load' });
  await expect(page.locator('#stage canvas')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('.tour-space')).toBeHidden();
  await expect(page.locator('.tour-cap')).toBeHidden();
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
