// ブラウザ動作テスト：全ページの表示とエラー、3D・スライダー・購入導線・異常時の静止画
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { findBanned } from '../tools/claims.mjs';
import { MENU, INTL_PAGES, LOCALES, alternates } from '../tools/i18n/site.mjs';
import { WAITLIST } from '../tools/i18n/waitlist.mjs';
import { COUNTRIES, supportAlternates } from '../tools/i18n/support.mjs';
import { COLUMN_SETS, COLUMN_PAGES, columnAlternates } from '../tools/i18n/columns.mjs';

// 海外向けページ（tools/build-i18n.mjs が生成）
const INTL = [...INTL_PAGES, ...COLUMN_PAGES];
const pages = ['', 'privacy.html', 'jp/', 'jp/manual.html', ...INTL, 'column/'].concat(
  fs
    .readdirSync(new URL('../column/', import.meta.url))
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => `column/${f}`),
);

// HTML に直接書かれた内容（hreflang など）だけを確かめるテストでは、3D などのスクリプトを読み込まない
// （商品ページを何枚も続けて開くと、CI の遅い環境では3Dの描画だけで時間切れになるため）
async function noScripts(page) {
  await page.route('**/assets/js/**', (r) => r.abort());
}

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

// ---------- 海外向けページ（英国・豪州／米国／カナダ／メキシコ） ----------
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

  // 発売前の国（tools/i18n/waitlist.mjs）は、購入ボタンの代わりに発売通知のメールボタンと残り件数を出す
  const pre = LOCALES.find((x) => x.lang === L.lang).waitlist;
  if (pre) {
    test(`${L.lang}：発売前は、Amazon へのリンクがなく、発売通知のメールボタンと目標までの残り件数がある`, async ({ page }) => {
      await page.goto(L.dir, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('a[href*="www.amazon."]')).toHaveCount(0);
      const mail = page.locator('a.cta[href^="mailto:lucabloom65@gmail.com?subject="]');
      expect(await mail.count()).toBeGreaterThanOrEqual(3); // ヒーロー・最後・下部バー
      const href = await mail.first().getAttribute('href');
      expect(decodeURIComponent(new URL(href).searchParams.get('subject'))).toBe(pre.subject);
      await expect(page.locator('.wl-bar').first()).toHaveAttribute('max', String(WAITLIST.target));
      await expect(page.locator('.wl-bar').first()).toHaveAttribute('value', String(WAITLIST.count));
      await expect(page.locator('.wl-h b').first()).toHaveText(String(WAITLIST.target - WAITLIST.count));
    });
  }

  if (!pre) test(`${L.lang}：購入ボタンはその国の Amazon へ、別タブ・sponsored付き`, async ({ page }) => {
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

  // 日本語版と同じく、サポート欄からご使用マニュアルと免責事項（PDF）を直接開ける
  test(`${L.lang}：サポート欄にご使用マニュアルと免責事項のPDFがある`, async ({ page, request }) => {
    await page.goto(L.dir);
    const links = page.locator('#support .support-links a');
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    const pdfs = hrefs.filter((h) => h.endsWith('.pdf'));
    expect(hrefs.filter((h) => /\/manual\.html(#\w+)?$/.test(h)).length).toBeGreaterThanOrEqual(1);
    expect(pdfs.length).toBeGreaterThanOrEqual(1);
    for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200);
    for (const h of pdfs) expect((await request.get(h)).headers()['content-type'], h).toBe('application/pdf');
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
  await noScripts(page);
  const groups = { lp: ['', ...LOCALES.map((L) => L.dir)], privacy: ['privacy.html', ...LOCALES.map((L) => `${L.dir}privacy.html`)] };
  for (const [kind, list] of Object.entries(groups)) {
    const expected = Object.fromEntries(alternates(kind));
    for (const p of list) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      const alt = Object.fromEntries(
        await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => [l.hreflang, l.href])),
      );
      expect(alt, `/${p}`).toEqual(expected);
      expect(Object.values(alt), `/${p} が自分自身を含まない`).toContain(await page.locator('link[rel="canonical"]').getAttribute('href'));
    }
  }
});

// ---------- サポートページ（同梱カードの QR コード https://luca-bloom.com/intl の読み込み先） ----------
test('QRコードのURL（/intl）：国の選択ページが開き、全ての国と日本のページへ移動できる', async ({ page, request }) => {
  const res = await page.goto('intl');
  expect(res.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe('/intl/');
  const links = page.locator('.countries a');
  await expect(links).toHaveCount(COUNTRIES.length + 1); // 各国＋日本
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual([...COUNTRIES.map((c) => `/${c.dir}`), '/jp/']);
  for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
});

for (const c of COUNTRIES) {
  test(`サポート /${c.dir}：免責事項のPDFとマニュアルが開き、緊急時の案内がある`, async ({ page, request }) => {
    const errors = watchErrors(page);
    await page.goto(c.dir);
    await expect(page.locator('html')).toHaveAttribute('lang', c.langs[0].lang);
    // 免責事項の PDF は国ごとに1つ（カナダは英仏併記の1冊）
    await expect(page.locator('a.choice[href$=".pdf"]')).toHaveCount(1);

    const pdf = page.locator('a.choice[href$=".pdf"]');
    await expect(pdf).toHaveAttribute('target', '_blank');
    const r = await request.get(new URL(await pdf.getAttribute('href'), page.url()).pathname);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toBe('application/pdf');
    expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');

    await page.locator('a.choice[href^="manual.html"]').first().click();
    await expect(page).toHaveURL(new RegExp(`/${c.dir}manual\\.html(#\\w+)?$`));
    // カナダは PDF と同じく、フランス語→英語の順に1ページで両方を載せる
    await expect(page.locator('.step')).toHaveCount(7 * c.langs.length);
    const emergency = page.locator('.step[id^="emergency"]');
    await expect(emergency).toHaveCount(c.langs.length);
    for (const [i, v] of c.langs.entries()) {
      const sos = v.emergency.match(/\b(999|000|911)\b/)[1]; // その国の緊急通報の番号
      await expect(emergency.nth(i)).toContainText('CLOSE');
      await expect(emergency.nth(i)).toContainText(sos);
    }
    const broken = await page.locator('.step img').evaluateAll((imgs) =>
      Promise.all(imgs.map(async (i) => { i.loading = 'eager'; await i.decode().catch(() => {}); return i.naturalWidth ? null : i.src; })),
    );
    expect(broken.filter(Boolean)).toEqual([]);
    expect(errors).toEqual([]);
  });

  // 入口ページには、病名・治療・効果をうたう語を使わない（一覧は tools/claims.mjs）。
  // マニュアルは PDF の「使用してはいけない場合」（持病・服薬など）をそのまま載せるため対象外
  test(`サポート /${c.dir}：病名・治療・効果をうたう語を使っていない`, async ({ page }) => {
    await page.goto(c.dir);
    const text = [await page.locator('body').innerText(), await page.title(), await page.locator('meta[name="description"]').getAttribute('content')].join('\n');
    for (const v of c.langs) {
      const hit = findBanned(text, v.lang.slice(0, 2));
      expect(hit, `/${c.dir} に「${hit}」`).toBeNull();
    }
  });
}

test('サポート：入口・マニュアルの hreflang が日本語版を含めて相互に指し合っている', async ({ page }) => {
  await noScripts(page);
  const groups = {
    hub: ['jp/', 'intl/', ...COUNTRIES.map((c) => c.dir)],
    manual: ['jp/manual.html', ...COUNTRIES.map((c) => `${c.dir}manual.html`)],
  };
  for (const [kind, list] of Object.entries(groups)) {
    const expected = Object.fromEntries(supportAlternates(kind));
    for (const p of list) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      const alt = Object.fromEntries(
        await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => [l.hreflang, l.href])),
      );
      expect(alt, `/${p}`).toEqual(expected);
      expect(Object.values(alt), `/${p} が自分自身を含まない`).toContain(await page.locator('link[rel="canonical"]').getAttribute('href'));
    }
  }
});

// ---------- コラム（日本語版と同じ構成。海外の規制に合わせて病名を使わない） ----------
for (const { L, articles } of COLUMN_SETS) {
  test(`コラム /${L.dir}column/：商品ページから開け、全記事に図と要点があり、病名・治療・効果をうたう語を使っていない`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    await page.goto(L.dir, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#column a.col-link')).toHaveAttribute('href', `/${L.dir}column/`);
    await page.goto(`${L.dir}column/`);
    await expect(page.locator('html')).toHaveAttribute('lang', L.lang);
    await expect(page.locator('main .list a')).toHaveCount(articles.length);
    const overflowAll = [];
    for (const a of articles) {
      await page.goto(`${L.dir}column/${a.slug}.html`);
      await expect(page.locator('.points li')).toHaveCount(3);
      expect(await page.locator('figure.fig svg').count(), a.slug).toBeGreaterThanOrEqual(1);
      // 図の文字が、図の外や囲み（四角）からはみ出していない（文字幅はウェブフォントの読み込み後に測る）
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.locator('figure.fig svg').evaluateAll((svgs) =>
        svgs.flatMap((svg) => {
          const vb = svg.viewBox.baseVal;
          const boxes = [...svg.querySelectorAll('rect')].map((r) => r.getBBox()).filter((r) => r.width > 40 && r.height > 20);
          return [...svg.querySelectorAll('text')].filter((t) => {
            const b = t.getBBox();
            if (b.x < vb.x - 1 || b.x + b.width > vb.x + vb.width + 1) return true;
            const cx = b.x + b.width / 2;
            const cy = b.y + b.height / 2;
            // 文字の中心を含むいちばん小さい囲み
            const box = boxes.filter((r) => cx > r.x && cx < r.x + r.width && cy > r.y && cy < r.y + r.height).sort((p, q) => p.width * p.height - q.width * q.height)[0];
            return box ? b.x < box.x + 2 || b.x + b.width > box.x + box.width - 2 : false;
          }).map((t) => t.textContent);
        }),
      );
      overflowAll.push(...overflow.map((x) => `${a.slug}: ${x}`));
      const text = [await page.locator('body').innerText(), await page.title(), await page.locator('meta[name="description"]').getAttribute('content')].join('\n');
      const hit = findBanned(text, L.claims);
      expect(hit, `/${L.dir}column/${a.slug}.html に「${hit}」`).toBeNull();
      if (L.waitlist) await expect(page.locator('.product a[href^="mailto:"]')).toHaveCount(1);
      else for (const s of L.stores) await expect(page.locator(`.product a[href="${s.href}"]`)).toHaveAttribute('rel', /sponsored/);
    }
    expect(overflowAll).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('コラム：各記事の hreflang が日本語版を含めて相互に指し合っている', async ({ page }) => {
  await noScripts(page);
  const groups = [[null, null], ...COLUMN_SETS[0].articles.map((a) => [a.slug, a.jp])];
  for (const [slug, jp] of groups) {
    const expected = Object.fromEntries(columnAlternates(slug, jp));
    for (const url of new Set(Object.values(expected))) {
      const p = url.replace('https://luca-bloom.com/', '');
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      const alt = Object.fromEntries(
        await page.locator('link[rel="alternate"][hreflang]').evaluateAll((ls) => ls.map((l) => [l.hreflang, l.href])),
      );
      expect(alt, `/${p}`).toEqual(expected);
    }
  }
});
