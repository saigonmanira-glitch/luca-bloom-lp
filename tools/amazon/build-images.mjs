// Amazon の商品画像（2000×2000）の海外版を作る。
//   node tools/amazon/build-images.mjs      → 全言語
//   node tools/amazon/build-images.mjs us   → 指定した版だけ
// 版：global（全世界共通。同じ ASIN で各国に出品するため1組だけ）。出力は amazon/global/*.jpg
// 下地は日本語版から文字だけを消したもの（amazon/base/。tools/amazon/clean_bases.py で作る）。
// その上に英語の文字を、日本語版と同じ位置・同じ書体で重ねる。
// 表現は海外LPと同じ決まり（病名・効果・比較・最上級・価格・「限定」を入れない）。日本語版の「業界最大の開き幅」は比較の表現のため載せない。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { findBanned } from '../claims.mjs';
import { TEXT } from './text.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FONTS = path.join(ROOT, '.cache/fonts');
const font = (f) => {
  const p = path.join(FONTS, f);
  if (!fs.existsSync(p)) {
    console.error(`フォントの元ファイルがありません（${f}）。先に npm run build:fonts を実行してください。`);
    process.exit(1);
  }
  return `data:font/ttf;base64,${fs.readFileSync(p).toString('base64')}`;
};
const CSS = `
@font-face{font-family:ZK;font-weight:400;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Regular.ttf')})}
@font-face{font-family:ZK;font-weight:700;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Bold.ttf')})}
@font-face{font-family:ZK;font-weight:900;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Black.ttf')})}
@font-face{font-family:QS;font-weight:300 700;src:url(${font('quicksand__Quicksand[wght].ttf')})}
*{margin:0;box-sizing:border-box}
body{width:2000px;height:2000px;overflow:hidden;position:relative;font-family:ZK;color:#EEF0F6;background-size:2000px 2000px}
.a{position:absolute;white-space:nowrap}
.kicker{left:132px;top:268px;font-weight:900;font-size:44px;letter-spacing:.08em;color:#E3B34E}
.h{left:128px;top:352px;font-weight:900;font-size:112px;line-height:1.36;letter-spacing:.005em}
.h em{font-style:normal;color:#E3B34E}
.foot{left:132px;top:1880px;width:1740px;white-space:normal;font-size:28px;line-height:1.6;color:#A3AAC0}
.pill{right:132px;top:122px;height:68px;border:2px solid #2E3550;border-radius:99px;padding:0 30px;display:flex;align-items:center;font-size:30px;color:#C3CADB;letter-spacing:.02em}
.ink{color:#1A1E2C}.gray{color:#6B7080}.gold{color:#9A6A12}
`;

// 4枚の画像の組み立て（T：版ごとの文言。tools/amazon/text.mjs）
const IMAGES = [
  {
    file: '01-main',
    html: (T) => `
<p class="a pill">${T.main.pill}</p>
<p class="a kicker">${T.main.kicker}</p>
<h1 class="a h" style="${T.main.hStyle || ''}">${T.main.h}</h1>
${[[285, 1268], [1168, 1268], [285, 1550], [1168, 1550]].map(([x, y], i) => {
  const [t, d] = T.main.cards[i];
  return `<div class="a" style="left:${x + 12}px;top:${y}px"><p style="font-weight:900;font-size:${T.main.cardSize || 50}px;line-height:1.3">${t}</p><p style="margin-top:12px;font-size:34px;line-height:1.5;color:#A3AAC0">${d}</p></div>`;
}).join('')}
<p class="a foot">${T.main.foot}</p>`,
  },
  {
    file: '02-size-spec',
    html: (T) => `
<p class="a pill">${T.spec.pill}</p>
<p class="a kicker">${T.spec.kicker}</p>
<h1 class="a h" style="${T.spec.hStyle || ''}">${T.spec.h}</h1>
<p class="a ink" style="left:960px;top:596px;transform:translateX(-50%);font-weight:700;font-size:36px;letter-spacing:.04em">${T.spec.total}</p>
<p class="a gray" style="left:993px;top:644px;transform:translateX(-50%);font-weight:700;font-size:30px;letter-spacing:.04em">${T.spec.body}</p>
<p class="a gold" style="left:953px;top:1284px;transform:translateX(-50%);font-weight:700;font-size:38px;letter-spacing:.04em">${T.spec.open}</p>
${T.spec.rows.map(([k, v], i) => {
  const [x, y] = i < 5 ? [132, 1428 + i * 67] : [1030, 1428 + (i - 5) * 67];
  return `<p class="a" style="left:${x}px;top:${y}px;font-size:${T.spec.rowSize || 36}px"><span style="color:#A3AAC0;margin-right:28px">${k}</span><span style="font-weight:700">${v}</span></p>`;
}).join('')}
<p class="a foot" style="top:1840px">${T.spec.foot}</p>`,
  },
  {
    file: '03-arm-design',
    html: (T) => `
<p class="a pill">${T.arm.pill}</p>
<p class="a kicker">${T.arm.kicker}</p>
<h1 class="a h" style="font-size:100px;top:362px;${T.arm.hStyle || ''}">${T.arm.h}</h1>
<div class="a ink" style="left:171px;top:592px;width:760px;white-space:normal"><p style="font-weight:900;font-size:48px">${T.arm.lTitle}</p><p class="gray" style="margin-top:14px;font-size:32px;line-height:1.55">${T.arm.lText}</p></div>
<div class="a ink" style="left:1057px;top:592px;width:760px;white-space:normal"><p style="font-weight:900;font-size:48px">${T.arm.rTitle}</p><p class="gray" style="margin-top:14px;font-size:32px;line-height:1.55">${T.arm.rText}</p></div>
<div class="a ink" style="left:640px;top:1290px;font-weight:900;font-size:34px;line-height:1.5">${T.arm.base}<p class="gray" style="font-weight:400;font-size:26px">${T.arm.baseW}</p></div>
<div class="a ink" style="left:640px;top:1562px;font-weight:900;font-size:34px;line-height:1.5">${T.arm.tip}</div>
<p class="a gray" style="left:1393px;top:1452px;transform:translateX(-50%);font-size:36px">${T.arm.w6}</p>
<p class="a ink" style="left:1440px;top:1560px;transform:translateX(-50%);font-weight:900;font-size:${T.arm.capSize || 44}px">${T.arm.cap}</p>
<p class="a foot">${T.arm.foot}</p>`,
  },
  {
    file: '04-stepless',
    html: (T) => `
<p class="a pill">${T.step.pill}</p>
<p class="a kicker">${T.step.kicker}</p>
<h1 class="a h" style="${T.step.hStyle || ''}">${T.step.h}</h1>
<p class="a" style="left:553px;top:1306px;transform:translateX(-50%);font-size:40px;color:#A3AAC0">${T.step.closed}</p>
<p class="a" style="left:553px;top:1368px;transform:translateX(-50%);font-family:QS;font-weight:700;font-size:150px;line-height:1">5<span style="font-size:60px;margin-left:6px">mm</span></p>
<p class="a" style="left:1445px;top:1306px;transform:translateX(-50%);font-size:40px;color:#A3AAC0">${T.step.max}</p>
<p class="a" style="left:1445px;top:1368px;transform:translateX(-50%);font-family:QS;font-weight:700;font-size:150px;line-height:1;color:#E3B34E">70<span style="font-size:60px;margin-left:6px">mm</span></p>
${[178, 766, 1355].map((x, i) => {
  const [k, v] = T.step.cards[i];
  const st = i === 0 ? 'font-family:QS;font-weight:700;font-size:84px' : `font-weight:900;font-size:${T.step.cardSize || 64}px`;
  const val = i === 0 ? '2<span style="font-family:QS;font-size:44px;margin-left:4px">mm</span>' : v;
  return `<div class="a" style="left:${x}px;top:1566px"><p style="font-size:34px;color:#A3AAC0">${k}</p><p style="margin-top:18px;line-height:1;${st}">${val}</p></div>`;
}).join('')}
<p class="a foot">${T.step.foot}</p>`,
  },
];

const only = process.argv[2];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
for (const [ver, T] of Object.entries(TEXT).filter(([v]) => !only || v === only)) {
  const OUT = path.join(ROOT, 'amazon', ver);
  fs.mkdirSync(OUT, { recursive: true });
  for (const img of IMAGES) {
    const base = fs.readFileSync(path.join(ROOT, 'amazon/base', `${img.file}.png`)).toString('base64');
    await page.setContent(`<!doctype html><html lang="${T.lang}"><head><meta charset="utf-8"><style>${CSS}body{background-image:url(data:image/png;base64,${base})}</style></head><body>${img.html(T)}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    // 規制上使わない語が入っていないか（tools/claims.mjs）
    const text = await page.evaluate(() => document.body.innerText);
    const hit = findBanned(text, T.claims);
    if (hit) throw new Error(`${ver}/${img.file} に使わない語「${hit}」があります`);
    // 文字が画像の端（左右100px）や、隣の要素にはみ出していないか
    const over = await page.evaluate(() => [...document.querySelectorAll('.a')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < 100 || r.right > 1900; }).map((e) => e.textContent.slice(0, 40)));
    if (over.length) throw new Error(`${ver}/${img.file}：端にはみ出す文字 ${over.join(' / ')}`);
    await page.screenshot({ path: path.join(OUT, `${img.file}.jpg`), type: 'jpeg', quality: 92 });
    console.log(`amazon/${ver}/${img.file}.jpg`);
  }
}
await browser.close();
