// Amazon の商品画像（2000×2000）の海外版を作る。
//   node tools/amazon/build-images.mjs      → amazon/en/*.jpg（英国・オーストラリア向け。英国式のつづり）
// 下地は日本語版から文字だけを消したもの（amazon/base/。tools/amazon/clean_bases.py で作る）。
// その上に英語の文字を、日本語版と同じ位置・同じ書体で重ねる。
// 表現は海外LPと同じ決まり（病名・効果・比較・最上級・価格・「限定」を入れない）。日本語版の「業界最大の開き幅」は比較の表現のため載せない。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { findBanned } from '../claims.mjs';

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

const MAIN = {
  file: '01-main',
  html: `
<p class="a pill">Japanese utility model application filed</p>
<p class="a kicker">FORESKIN CARE TOOL</p>
<h1 class="a h">A screw-driven<br><em>self-care tool</em></h1>
${[
  [285, 1268, 'Reverse-taper arms', 'Narrow at the base, wider at the tip,<br>shaped not to slip'],
  [1168, 1268, 'Flat-faced arms', 'A flat face with R2 corners<br>spreads the pressure'],
  [285, 1550, 'Stepless adjustment', 'Self-locking: stays put<br>when you let go'],
  [1168, 1550, 'Up to 70 mm', 'Two arms that open<br>in parallel'],
].map(([x, y, t, d]) => `<div class="a" style="left:${x + 12}px;top:${y}px"><p style="font-weight:900;font-size:50px;line-height:1.3">${t}</p><p style="margin-top:12px;font-size:34px;line-height:1.5;color:#A3AAC0">${d}</p></div>`).join('')}
<p class="a foot">Luca Bloom is not a medical device. For adults aged 18 and over.</p>`,
};

const SPEC = {
  file: '02-size-spec',
  html: `
<p class="a kicker">SIZE &amp; SPECIFICATIONS</p>
<h1 class="a h">100.75 mm long, <em>light resin</em></h1>
<p class="a ink" style="left:960px;top:596px;transform:translateX(-50%);font-weight:700;font-size:36px;letter-spacing:.04em">Overall length 100.75 mm</p>
<p class="a gray" style="left:993px;top:644px;transform:translateX(-50%);font-weight:700;font-size:30px;letter-spacing:.04em">Body 85 mm</p>
<p class="a gold" style="left:953px;top:1284px;transform:translateX(-50%);font-weight:700;font-size:38px;letter-spacing:.04em">Opening up to 70 mm</p>
${[
  [132, 1428, 'Body size', '85 × 20 × 20 mm'],
  [132, 1495, 'Opening', 'up to 70 mm (stepless)'],
  [132, 1562, 'Material', 'POM (polyacetal resin)'],
  [132, 1629, 'Made in', 'China (inspected, cleaned and assembled in Japan)'],
  [132, 1696, 'In the box', 'device ×1, information card (illustrated guide, QR code) ×1'],
  [1030, 1428, 'Arm length', '40 mm'],
  [1030, 1495, 'Neck width', '5 mm (when closed)'],
].map(([x, y, k, v]) => `<p class="a" style="left:${x}px;top:${y}px;font-size:36px"><span style="color:#A3AAC0;margin-right:28px">${k}</span><span style="font-weight:700">${v}</span></p>`).join('')}
<p class="a foot" style="top:1840px">The product box shows only “Luca Bloom”, and it ships inside an outer carton. Luca Bloom is not a medical device.</p>`,
};

const ARM = {
  file: '03-arm-design',
  html: `
<p class="a kicker">SHAPED NOT TO SLIP, FLAT WHERE IT TOUCHES</p>
<h1 class="a h" style="font-size:100px;top:362px">Arm <em>shape &amp; cross-section</em></h1>
<div class="a ink" style="left:171px;top:592px;width:760px;white-space:normal"><p style="font-weight:900;font-size:48px">Reverse-taper arms</p><p class="gray" style="margin-top:14px;font-size:32px;line-height:1.55">Narrow at the base and wider towards the tip, so the arms are less likely to slip once in place.</p></div>
<div class="a ink" style="left:1057px;top:592px;width:760px;white-space:normal"><p style="font-weight:900;font-size:48px">6 mm flat face</p><p class="gray" style="margin-top:14px;font-size:32px;line-height:1.55">The outer face is flat with R2 rounded corners, so it rests on a surface rather than a line like a round rod.</p></div>
<div class="a ink" style="left:640px;top:1290px;font-weight:900;font-size:34px;line-height:1.5">Base:<br>narrow neck<p class="gray" style="font-weight:400;font-size:26px">5 mm wide (closed)</p></div>
<div class="a ink" style="left:640px;top:1562px;font-weight:900;font-size:34px;line-height:1.5">Tip:<br>wide, rounded</div>
<p class="a gray" style="left:1393px;top:1452px;transform:translateX(-50%);font-size:36px">6 mm wide</p>
<p class="a ink" style="left:1440px;top:1560px;transform:translateX(-50%);font-weight:900;font-size:44px">Rests flat to spread the pressure</p>
<p class="a foot">Drawn to the actual dimensions of the DXF drawing (arm length 40 mm); the cross-section is the thickest part of the arm, to scale.</p>`,
};

const STEPLESS = {
  file: '04-stepless',
  html: `
<p class="a kicker">JUST TURN THE HANDLE</p>
<h1 class="a h">Stepless adjustment,<br><em>right where you want it.</em></h1>
<p class="a" style="left:553px;top:1306px;transform:translateX(-50%);font-size:40px;color:#A3AAC0">Neck width when closed</p>
<p class="a" style="left:553px;top:1368px;transform:translateX(-50%);font-family:QS;font-weight:700;font-size:150px;line-height:1">5<span style="font-size:60px;margin-left:6px">mm</span></p>
<p class="a" style="left:1445px;top:1306px;transform:translateX(-50%);font-size:40px;color:#A3AAC0">Maximum opening</p>
<p class="a" style="left:1445px;top:1368px;transform:translateX(-50%);font-family:QS;font-weight:700;font-size:150px;line-height:1;color:#E3B34E">70<span style="font-size:60px;margin-left:6px">mm</span></p>
${[
  [178, 'Per turn of the handle', '2<span style="font-family:QS;font-size:44px;margin-left:4px">mm</span>', 'font-family:QS;font-weight:700;font-size:84px'],
  [766, 'How it adjusts', 'Stepless', 'font-weight:900;font-size:64px'],
  [1355, 'When you let go', 'It stays put', 'font-weight:900;font-size:64px'],
].map(([x, k, v, st]) => `<div class="a" style="left:${x}px;top:1566px"><p style="font-size:34px;color:#A3AAC0">${k}</p><p style="margin-top:18px;line-height:1;${st}">${v}</p></div>`).join('')}
<p class="a foot">Self-locking: the screw holds the arms at that width. It is stepless, so you can stop wherever you like.</p>`,
};

const OUT = path.join(ROOT, 'amazon/en');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
for (const img of [MAIN, SPEC, ARM, STEPLESS]) {
  const base = fs.readFileSync(path.join(ROOT, 'amazon/base', `${img.file}.png`)).toString('base64');
  await page.setContent(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>${CSS}body{background-image:url(data:image/png;base64,${base})}</style></head><body>${img.html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  // 規制上使わない語が入っていないか（tools/claims.mjs）
  const text = await page.evaluate(() => document.body.innerText);
  const hit = findBanned(text, 'en');
  if (hit) throw new Error(`${img.file} に使わない語「${hit}」があります`);
  // 文字が画像の外にはみ出していないか
  const over = await page.evaluate(() => [...document.querySelectorAll('.a')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < 100 || r.right > 1900; }).map((e) => e.textContent.slice(0, 40)));
  if (over.length) console.warn(`${img.file}：端に近い文字 ${over.join(' / ')}`);
  await page.screenshot({ path: path.join(OUT, `${img.file}.jpg`), type: 'jpeg', quality: 92 });
  console.log(`amazon/en/${img.file}.jpg`);
}
await browser.close();
