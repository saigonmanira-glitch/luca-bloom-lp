// 海外向けページの共有画像（og.png・1200×630）と、3D が出るまでの静止画（hero-fallback.webp・-800.webp）を
// 言語ファイルの og（見出し・特長）から作る。文言を変えたら実行してコミットする。
//   node tools/build-og.mjs            … 全言語
//   node tools/build-og.mjs fr-FR      … 指定した言語だけ
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { LOCALES } from './i18n/site.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FONTS = path.join(ROOT, '.cache/fonts');
const font = (f) => {
  const p = path.join(FONTS, f);
  if (!fs.existsSync(p)) {
    console.error(`フォントの元ファイルがありません（${f}）。先に npm run build:fonts を実行してください。`);
    process.exit(1);
  }
  return fs.readFileSync(p).toString('base64');
};
const ZK700 = font('zenkakugothicnew__ZenKakuGothicNew-Bold.ttf');
const ZK900 = font('zenkakugothicnew__ZenKakuGothicNew-Black.ttf');
const QS = font('quicksand__Quicksand[wght].ttf');

const html = (og) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:ZK;font-weight:700;src:url(data:font/ttf;base64,${ZK700})}
@font-face{font-family:ZK;font-weight:900;src:url(data:font/ttf;base64,${ZK900})}
@font-face{font-family:QS;font-weight:300 700;src:url(data:font/ttf;base64,${QS})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:radial-gradient(70% 90% at 62% 45%,#262C47 0%,#161A29 70%);color:#EEF0F6;font-family:ZK}
.l{position:absolute;left:74px;top:150px;width:660px}
.logo{font-family:QS;font-weight:500;font-size:34px;letter-spacing:.06em;color:#C3CADB}
.for{margin-top:34px;font-family:QS;font-weight:700;font-size:21px;letter-spacing:.18em;text-transform:uppercase;color:#E3B34E}
h1{margin-top:16px;font-weight:900;font-size:50px;line-height:1.28;letter-spacing:.01em}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.chips span{border:1px solid #2E3550;border-radius:99px;padding:9px 18px;font-weight:700;font-size:17px;white-space:nowrap}
.chips b{font-family:QS;color:#E3B34E}
svg{position:absolute;right:62px;top:168px;width:420px}
</style></head><body>
<div class="l"><p class="logo">Luca Bloom</p><p class="for">${og.for}</p>
<h1>${og.lines.join('<br>')}</h1>
<div class="chips">${og.chips.map((c) => `<span>${c}</span>`).join('')}</div></div>
<svg viewBox="-13 -1 104 63"><defs>
<path id="a" d="M0 0V39A1 1 0 0 0 1 40H1.394A2 2 0 0 0 2.504 39.664L3.664 38.891L4.387 38.211A3 3 0 0 0 5 36.394V35.475A20 20 0 0 0 4.784 32.541L2.522 17.293A2 2 0 0 1 4.5 15H7A1 1 0 0 0 8 14V0Z"/>
<g id="b"><rect x="-11.5" y="1" width="10" height="18"/><path d="M-6.5 1L-11.5 6M-6.5 19L-11.5 14" fill="none"/><rect x="-1.5" y="5" width="1.5" height="10"/><rect x="0" y="0" width="85" height="20"/><path d="M0 2L2 0M83 0L85 2M85 18L83 20M2 20L0 18" fill="none"/><path d="M85 6H86.75V20.25H85Z"/><path d="M86.75 7H88.25L89.25 8V12L88.25 13H86.75Z"/><path d="M5 2V12H3.5L6 18L8.5 12H7V2Z" fill="none" stroke-width=".3"/><text transform="translate(9.95 1.3) rotate(90)" font-family="QS" font-size="5.6" font-weight="700" fill="none" stroke-width=".28" textLength="17.4" lengthAdjust="spacingAndGlyphs">CLOSE</text></g></defs>
<g fill="#F1EEE6" stroke="#8990A6" stroke-width=".35" stroke-linejoin="round"><use href="#a" transform="translate(8 20) scale(-1 1)"/><use href="#a" transform="translate(30 20)"/><use href="#b"/></g></svg>
</body></html>`;

let chromium;
const req = createRequire(import.meta.url);
for (const mod of ['playwright', '@playwright/test']) {
  try {
    ({ chromium } = req(mod));
    break;
  } catch {
    /* 次の候補を試す */
  }
}
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const only = process.argv[2];
for (const L of LOCALES.filter((l) => !only || l.code === only)) {
  await page.setContent(html(L.og));
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  // ブラウザの画像変換で WebP（1200px・800px）を作る
  /* global document, Image */
  const webp = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const out = [];
    for (const [w, h, q] of [[1200, 630, 0.82], [800, 420, 0.8]]) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, w, h);
      out.push(c.toDataURL('image/webp', q).split(',')[1]);
    }
    return out;
  }, png.toString('base64'));
  const dir = path.join(ROOT, L.dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'og.png'), png);
  fs.writeFileSync(path.join(dir, 'hero-fallback.webp'), Buffer.from(webp[0], 'base64'));
  fs.writeFileSync(path.join(dir, 'hero-fallback-800.webp'), Buffer.from(webp[1], 'base64'));
  console.log(`${L.dir}og.png ${Math.round(png.length / 1024)}KB / hero-fallback.webp ${Math.round((webp[0].length * 3) / 4 / 1024)}KB`);
}
await browser.close();
