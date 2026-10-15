// Amazon の商品画像（2000×2000・JPEG・4枚）を作る。出力は amazon/global/*.jpg
//   node tools/amazon/build-images.mjs          → 全部
//   node tools/amazon/build-images.mjs 02 04    → ファイル名の先頭が一致するものだけ
// 同じ ASIN（商品番号）で全世界に出品するため、画像は全世界共通の1組。細かい説明は動画で行うので、
// 画像は「見て欲しくなる」ことを優先し、大きな 3D の製品・短い英単語の見出し・記号・数字で特長を伝える。
// 見た目は LP に合わせる（淡いグレーの光、本体の後ろに青みのグレーの光、紺と金のアクセント、Zen Kaku Gothic と Quicksand）。
// 表現は海外LPと同じ決まり（病名・効果・比較・最上級・価格・「限定」を入れない。tools/claims.mjs で検査）。
// 本体と化粧箱の絵は LP と同じ 3Dモデル（src/scene/）を tools/amazon/shots.js で描く。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { chromium } from '@playwright/test';
import { findBanned } from '../claims.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'amazon/global');
const FONTS = path.join(ROOT, '.cache/fonts');
const FONT_FILES = {
  'zk-400.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Regular.ttf',
  'zk-700.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Bold.ttf',
  'zk-900.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Black.ttf',
  'qs.ttf': 'quicksand__Quicksand[wght].ttf',
  'ms.ttf': 'montserrat__Montserrat[wght].ttf',
};
for (const f of Object.values(FONT_FILES)) {
  if (!fs.existsSync(path.join(FONTS, f))) {
    console.error(`フォントの元ファイルがありません（${f}）。先に npm run build:fonts を実行してください。`);
    process.exit(1);
  }
}

// ---------- 色（LP と同じ） ----------
const NAVY = '#161A29';
const GOLD = '#E3B34E';
const GOLD_INK = '#8A6010';
const PINK = '#E58E9E';
const MUTED = '#4C5263';

// ---------- 記号（線の絵。viewBox 0 0 100 100、色は currentColor） ----------
const ICON = {
  width: '<path d="M14 16V84M86 16V84"/><path d="M28 50H72M40 38L28 50L40 62M60 38L72 50L60 62"/>',
  slider: '<path d="M10 50H90"/><circle cx="60" cy="50" r="14" fill="currentColor"/>',
  lock: '<rect x="24" y="44" width="52" height="42" rx="9"/><path d="M35 44V32A15 15 0 0 1 65 32V44"/><path d="M50 60V70"/>',
  eyeOff: '<path d="M8 50C20 30 34 22 50 22S80 30 92 50C80 70 66 78 50 78S20 70 8 50Z"/><circle cx="50" cy="50" r="13"/><path d="M16 84L84 16"/>',
  carton: '<path d="M14 34L50 20L86 34V74L50 88L14 74Z"/><path d="M14 34L50 48L86 34M50 48V88"/><path d="M32 27L68 41V54"/>',
  japan: '<circle cx="50" cy="50" r="38"/><path d="M33 51L45 63L68 38"/>',
};
const icon = (name, size, color, sw = 7) =>
  `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="color:${color};flex:none">${ICON[name]}</svg>`;

// ---------- 共通の見た目 ----------
const CSS = `
@font-face{font-family:ZK;font-weight:400;src:url(/fonts/zk-400.ttf)}
@font-face{font-family:ZK;font-weight:700;src:url(/fonts/zk-700.ttf)}
@font-face{font-family:ZK;font-weight:900;src:url(/fonts/zk-900.ttf)}
@font-face{font-family:QS;font-weight:300 700;src:url(/fonts/qs.ttf)}
@font-face{font-family:MS;font-weight:100 900;src:url(/fonts/ms.ttf)}
*{margin:0;box-sizing:border-box}
html,body{width:2000px;height:2000px;overflow:hidden;background:#fff}
#gl{position:absolute;left:-99999px;top:0}
#art{position:absolute;inset:0;overflow:hidden;font-family:QS,sans-serif;color:${NAVY};
  background:radial-gradient(110% 80% at 50% 42%,#F7F8FB 0%,#E6E9F0 52%,#D2D7E2 100%)}
.glow{position:absolute;pointer-events:none;background:radial-gradient(closest-side,rgba(112,126,158,.55) 0%,rgba(114,128,160,.5) 22%,rgba(120,133,164,.4) 40%,rgba(130,142,170,.27) 58%,rgba(143,154,180,.14) 75%,rgba(156,166,190,.05) 90%,rgba(160,170,194,0) 100%)}
.a{position:absolute}
.c{transform:translate(-50%,-50%)}
.kicker{font-family:QS;font-weight:700;font-size:38px;letter-spacing:.24em;color:${GOLD_INK};display:flex;align-items:center;gap:22px}
.kicker::before{content:"";width:64px;height:4px;background:${GOLD};border-radius:2px}
.h{font-family:ZK;font-weight:900;font-size:156px;line-height:1.08;letter-spacing:-.005em;color:${NAVY};margin-top:30px}
.h em{font-style:normal;background:linear-gradient(180deg,#E9BC57 0%,#C08A25 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{font-family:QS;font-weight:600;font-size:46px;line-height:1.4;color:${MUTED};margin-top:30px}
.mark{position:absolute;right:120px;top:118px;font-family:MS;font-weight:200;font-size:54px;letter-spacing:.04em;color:${NAVY}}
.glass{position:absolute;background:rgba(255,255,255,.72);border:1.5px solid rgba(255,255,255,.9);border-radius:48px;box-shadow:0 30px 70px -36px rgba(22,26,41,.45)}
.disc{display:flex;align-items:center;justify-content:center;border-radius:50%;background:${NAVY};flex:none;box-shadow:0 14px 30px -14px rgba(22,26,41,.7)}
.t1{font-family:QS;font-weight:700;font-size:56px;line-height:1.1;color:${NAVY};white-space:nowrap}
.t2{font-family:QS;font-weight:600;font-size:34px;line-height:1.3;color:${MUTED};margin-top:10px;white-space:nowrap}
.big{font-family:QS;font-weight:700;line-height:1;letter-spacing:-.01em;white-space:nowrap;background:linear-gradient(180deg,#E9BC57 0%,#B9821F 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.big small{font-size:.42em;margin-left:.1em}
.pill{display:inline-flex;align-items:center;gap:14px;height:76px;padding:0 34px;border-radius:99px;background:${NAVY};color:#fff;font-family:QS;font-weight:700;font-size:36px;letter-spacing:.02em;white-space:nowrap;box-shadow:0 14px 30px -16px rgba(22,26,41,.8)}
.chip{display:inline-flex;align-items:center;height:80px;padding:0 36px;border-radius:99px;background:rgba(255,255,255,.75);border:1.5px solid #C4CAD6;font-family:QS;font-weight:700;font-size:36px;color:${NAVY};white-space:nowrap}
.foot{position:absolute;left:0;right:0;bottom:56px;text-align:center;font-family:QS;font-weight:600;font-size:28px;letter-spacing:.06em;color:#6B7080}
`;
const img = (r, x, y, extra = '') => `<img class="a" src="${r.url}" width="${r.w}" height="${r.h}" style="left:${x}px;top:${y}px;${extra}">`;
const glow = (cx, cy, w, h) => `<div class="glow" style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px"></div>`;
const head = (kicker, h, sub = '', x = 130, y = 150) =>
  `<div class="a" style="left:${x}px;top:${y}px"><p class="kicker">${kicker}</p><h1 class="h">${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const mark = '<p class="mark">Luca Bloom</p>';
const layer = (body) => `<svg class="a" style="left:0;top:0;overflow:visible" width="2000" height="2000" viewBox="0 0 2000 2000">${body}</svg>`;
// 矢印つきの線（x1,y1 → x2,y2）。both=true で両端に矢印
const arrow = (x1, y1, x2, y2, color, sw, head, both = false) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hd = (x, y, s) =>
    `M${x + Math.cos(a + s * 2.55) * head} ${y + Math.sin(a + s * 2.55) * head}L${x} ${y}L${x + Math.cos(a - s * 2.55) * head} ${y + Math.sin(a - s * 2.55) * head}`;
  return `<path d="M${x1} ${y1}L${x2} ${y2}${hd(x2, y2, 1)}${both ? hd(x1, y1, -1) : ''}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};

// 回転の矢印（中心 cx,cy・半径 r。左上から時計回りに約3/4周して、先端に矢じり）
const turnArc = (cx, cy, r, color, sw) => {
  const a0 = (200 * Math.PI) / 180;
  const a1 = (470 * Math.PI) / 180;
  const P = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = P(a0);
  const [x1, y1] = P(a1);
  const t = a1 + Math.PI / 2; // 先端の進む向き
  const h = sw * 4;
  const hd = (s) => [x1 - Math.cos(t + s * 0.6) * h, y1 - Math.sin(t + s * 0.6) * h];
  const [ha, hb] = [hd(1), hd(-1)];
  return `<path d="M${x0} ${y0}A${r} ${r} 0 1 1 ${x1} ${y1}M${ha[0]} ${ha[1]}L${x1} ${y1}L${hb[0]} ${hb[1]}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};

// ---------- 4枚の組み立て（S：3Dの描画。shot(設定) → { url, w, h, pts, arms }） ----------
const IMAGES = [
  // 1枚目：製品の魅力をひと目で（大きな製品・見出し・3つの特長）
  {
    file: '01-hero',
    text: ['FORESKIN CARE TOOL', 'Turn. Open. Stays put.', '70 mm', 'Max opening', 'Stepless', 'Fine control', 'Self-lock', 'Holds when you let go', 'Not a medical device · 18+', 'Utility model filed · JP'],
    async html(S) {
      const r = await S({ w: 2000, h: 1300, travel: 34, dist: 215, look: [-6, -15, 0], dir: [-0.42, 0.34, 0.86] });
      const tiles = [
        ['width', '70<small style="font-size:.6em"> mm</small>', 'Max opening'],
        ['slider', 'Stepless', 'Fine control'],
        ['lock', 'Self-lock', 'Holds when you let go'],
      ];
      return `${glow(1080, 1080, 2900, 1250)}${mark}
${head('FORESKIN CARE TOOL', 'Turn. Open.<br><em>Stays put.</em>')}
<div class="a" style="right:120px;top:210px"><span class="pill" style="background:rgba(255,255,255,.75);color:${NAVY};border:1.5px solid #C4CAD6;box-shadow:none">Utility model filed · JP</span></div>
${img(r, 0, 470)}
${tiles
  .map(
    ([ic, t, d], i) => `<div class="glass" style="left:${120 + i * 595}px;top:1590px;width:570px;height:270px;display:flex;align-items:center;gap:30px;padding:0 36px">
<div class="disc" style="width:136px;height:136px">${icon(ic, 82, GOLD, 8)}</div><div><p class="t1">${t}</p><p class="t2" style="${d.length > 14 ? 'font-size:28px;white-space:normal;width:300px' : ''}">${d}</p></div></div>`,
  )
  .join('')}
<p class="foot">Not a medical device · 18+</p>`;
    },
  },
  // 2枚目：ハンドルを回すと、2本のアームが平行に最大70mmまで開く。無段階で、手を離すとその幅で止まる
  {
    file: '02-open',
    text: ['TURN THE HANDLE', 'Opens up to 70 mm.', 'Two arms open in parallel.', 'Stop anywhere — no steps.', 'Turn', '1 turn = 2 mm', '70 mm', 'Closed', 'Let go. It holds.'],
    async html(S) {
      const o = { w: 2000, h: 1100, view: 'front', scale: 13, look: [-9, -12, 0], shadow: false };
      const a = await S({ ...o, travel: 0 });
      const b = await S({ ...o, travel: 60, points: [[-54, 10, 0], [-24, -24, 0], [20, -24, 0]] });
      const top = 560;
      const [hx, hy] = [b.pts[0][0], top + b.pts[0][1]];
      const [m1, m2] = [b.pts[1], b.pts[2]];
      const L = b.arms.left[0];
      const R = b.arms.right[0];
      const y = top + b.arms.left[1] + 70;
      return `${glow(1000, 1200, 2900, 1200)}${mark}
${head('TURN THE HANDLE', 'Opens up to <em>70 mm.</em>', 'Two arms open in parallel.<br>Stop anywhere — no steps.')}
${img(a, 0, top, 'opacity:.32')}${img(b, 0, top)}
${layer(`${turnArc(hx, hy, 150, GOLD, 10)}
${arrow(m1[0], top + m1[1], m2[0], top + m2[1], GOLD, 12, 46)}
${arrow(L, y, R, y, GOLD_INK, 6, 28, true)}<path d="M${L} ${y - 44}V${y + 44}M${R} ${y - 44}V${y + 44}" stroke="${GOLD_INK}" stroke-width="6" stroke-linecap="round"/>`)}
<div class="a c" style="left:${hx}px;top:${hy + 250}px"><span class="pill">Turn</span></div>
<p class="a c t2" style="left:${hx}px;top:${hy + 330}px;margin:0;font-size:30px">1 turn = 2 mm</p>
<div class="a c" style="left:${(L + R) / 2}px;top:${y}px"><span class="pill" style="background:${GOLD};color:${NAVY};font-size:44px;height:84px">70 mm</span></div>
<div class="glass" style="left:120px;top:1700px;width:1760px;height:200px;display:flex;align-items:center;gap:40px;padding:0 60px">
  <p class="t2" style="margin:0;font-size:36px">Closed</p>
  <svg width="760" height="60" viewBox="0 0 760 60"><defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#C9CFDB"/><stop offset="1" stop-color="${GOLD}"/></linearGradient></defs><rect x="0" y="20" width="760" height="20" rx="10" fill="url(#sg)"/><circle cx="470" cy="30" r="27" fill="#fff" stroke="${GOLD_INK}" stroke-width="7"/></svg>
  <p class="t2" style="margin:0;font-size:36px;color:${NAVY};font-weight:700">70 mm</p>
  <div style="width:2px;height:110px;background:#C4CAD6;margin:0 10px"></div>
  <div class="disc" style="width:110px;height:110px">${icon('lock', 64, GOLD, 9)}</div>
  <p class="t1" style="font-size:50px">Let go.<br>It holds.</p>
</div>`;
    },
  },
  // 3枚目：アームの形（根元が細く先端が太い「逆テーパー」、外側は幅6mmの平らな面）
  {
    file: '03-arms',
    text: ['ARM DESIGN', 'Wide tips. Stays in place.', 'Reverse taper', 'Narrow neck, wide tip', 'Flat face', '6 mm wide · R2 corners'],
    async html(S) {
      const r = await S({ w: 1250, h: 1300, travel: 26, sleeve: true, shadow: false, dist: 175, fov: 24, look: [-20, -27, 0], dir: [-0.5, 0.18, 0.85], points: [[-34.5, -21, 0], [-6.5, -34, 4]] });
      const top = 640;
      const ARM = 'M0 0V39A1 1 0 0 0 1 40H1.394A2 2 0 0 0 2.504 39.664L3.664 38.891L4.387 38.211A3 3 0 0 0 5 36.394V35.475A20 20 0 0 0 4.784 32.541L2.522 17.293A2 2 0 0 1 4.5 15H7A1 1 0 0 0 8 14V0Z';
      // 右上の丸：アームの形（y=12〜40mmの部分）を拡大。くびれに皮膚（ピンクの輪）、太い先端で止まる
      const c1 = [1560, 840];
      const k = 15;
      const ax = c1[0] - 3 * k;
      const ay = c1[1] - 26 * k;
      // 右下の丸：アームの断面（幅6mm・角R2）。面全体で当たる
      const c2 = [1560, 1520];
      const p1 = [r.pts[0][0], top + r.pts[0][1]];
      const p2 = [r.pts[1][0], top + r.pts[1][1]];
      return `${glow(800, 1200, 2400, 1400)}${mark}
${head('ARM DESIGN', 'Wide tips.<br><em>Stays in place.</em>')}
${img(r, 20, top, '-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 24%),linear-gradient(to right,transparent 0,#000 16%);-webkit-mask-composite:source-in;mask-composite:intersect')}
${layer(`<defs><clipPath id="k1"><circle cx="${c1[0]}" cy="${c1[1]}" r="250"/></clipPath><clipPath id="k2"><circle cx="${c2[0]}" cy="${c2[1]}" r="250"/></clipPath></defs>
<path d="M${p1[0]} ${p1[1]}C${p1[0] + 300} ${p1[1] - 60} ${c1[0] - 420} ${c1[1]} ${c1[0] - 262} ${c1[1]}" stroke="${GOLD}" stroke-width="5" fill="none" stroke-dasharray="4 14" stroke-linecap="round"/><circle cx="${p1[0]}" cy="${p1[1]}" r="16" fill="${GOLD}"/>
<path d="M${p2[0]} ${p2[1]}C${p2[0] + 260} ${p2[1] + 40} ${c2[0] - 420} ${c2[1]} ${c2[0] - 262} ${c2[1]}" stroke="${GOLD}" stroke-width="5" fill="none" stroke-dasharray="4 14" stroke-linecap="round"/><circle cx="${p2[0]}" cy="${p2[1]}" r="16" fill="${GOLD}"/>
<circle cx="${c1[0]}" cy="${c1[1]}" r="256" fill="rgba(255,255,255,.85)" stroke="${GOLD}" stroke-width="8"/>
<g clip-path="url(#k1)"><path d="${ARM}" transform="translate(${ax} ${ay}) scale(${k})" fill="#F4F2EC" stroke="#8990A6" stroke-width="${2.5 / k}" stroke-linejoin="round"/>
<ellipse cx="${ax + 2.0 * k}" cy="${ay + 22.5 * k}" rx="${3.6 * k}" ry="${0.95 * k}" fill="none" stroke="${PINK}" stroke-width="22"/>
${arrow(ax + 2.0 * k, ay + 25 * k, ax + 2.0 * k, ay + 31 * k, GOLD_INK, 9, 30)}
<path d="M${ax - 1 * k} ${ay + 32.6 * k}H${ax + 6 * k}" stroke="${GOLD_INK}" stroke-width="10" stroke-linecap="round"/></g>
<circle cx="${c2[0]}" cy="${c2[1]}" r="256" fill="rgba(255,255,255,.85)" stroke="${GOLD}" stroke-width="8"/>
<g clip-path="url(#k2)"><path d="M${c2[0] - 190} ${c2[1] - 40}Q${c2[0]} ${c2[1] - 52} ${c2[0] + 190} ${c2[1] - 40}" stroke="${PINK}" stroke-width="30" fill="none" stroke-linecap="round" opacity=".9"/>
<rect x="${c2[0] - 150}" y="${c2[1] - 22}" width="300" height="200" rx="50" fill="#F4F2EC" stroke="#8990A6" stroke-width="6"/>
${[-120, -60, 0, 60, 120].map((d) => arrow(c2[0] + d, c2[1] - 190, c2[0] + d, c2[1] - 80, GOLD_INK, 8, 22)).join('')}
</g>`)}
<div class="a" style="left:1300px;top:1100px;width:520px;text-align:center"><p class="t1" style="font-size:52px">Reverse taper</p><p class="t2" style="margin-top:6px">Narrow neck, wide tip</p></div>
<div class="a" style="left:1300px;top:1790px;width:520px;text-align:center"><p class="t1" style="font-size:52px">Flat face</p><p class="t2" style="margin-top:6px">6 mm wide · R2 corners</p></div>`;
    },
  },
  // 4枚目：届いても中身がわからない（化粧箱は背面に「Luca Bloom」だけ・外箱に入れて発送）、日本で検品・組立、仕様
  {
    file: '04-privacy',
    text: ['PRIVACY', 'Discreet by design.', 'Only “Luca Bloom” on the box', 'Ships in a plain outer box', 'Inspected & assembled in Japan', '85 × 20 × 20 mm', 'POM resin', 'Made in China', '18+'],
    async html(S) {
      const r = await S({ kind: 'box', w: 1350, h: 1100, yaw: 0, lid: 1.85, dist: 470, fov: 26, look: [0, 42, 10], dir: [-0.3, 0.75, 1] });
      const rows = [
        ['eyeOff', 'Only “Luca Bloom”<br>on the box'],
        ['carton', 'Ships in a plain<br>outer box'],
        ['japan', 'Inspected &amp; assembled<br>in Japan'],
      ];
      return `${glow(760, 1150, 2400, 1400)}${mark}
${head('PRIVACY', 'Discreet<br><em>by design.</em>')}
${img(r, -20, 620)}
${rows
  .map(
    ([ic, t], i) => `<div class="glass" style="left:1290px;top:${640 + i * 330}px;width:600px;height:290px;display:flex;align-items:center;gap:30px;padding:0 36px">
<div class="disc" style="width:120px;height:120px">${icon(ic, 72, GOLD, 7)}</div><p class="t1" style="font-size:40px;line-height:1.25;white-space:normal">${t}</p></div>`,
  )
  .join('')}
<div class="a" style="left:0;right:0;top:1740px;display:flex;justify-content:center;gap:22px">
${['85 × 20 × 20 mm', 'POM resin', 'Made in China', '18+'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
    },
  },
];

// 表現の検査（病名・効果・比較・最上級・価格・「限定」）
for (const im of IMAGES) {
  const bad = findBanned(im.text.join('\n'), 'en');
  if (bad) {
    console.error(`${im.file}：海外で使わない語があります（${bad}）`);
    process.exit(1);
  }
}

// ---------- 書き出し ----------
const bundle = await esbuild.build({
  entryPoints: [path.join(import.meta.dirname, 'shots.js')],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
});
const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div id="gl"></div><div id="art"></div></body></html>`;
const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(HTML);
  if (p === '/shots.js') return res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(bundle.outputFiles[0].contents);
  const f = FONT_FILES[p.replace('/fonts/', '')];
  if (f) return res.writeHead(200, { 'Content-Type': 'font/ttf' }).end(fs.readFileSync(path.join(FONTS, f)));
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, r));

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 2000, height: 2000 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('ページのエラー:', e.message));
await page.goto(`http://localhost:${server.address().port}/`);
// 本体の刻印（CLOSE）と化粧箱の文字はフォントで描くため、フォントを読み込んでから 3D を作る
await page.addStyleTag({
  content: '@font-face{font-family:Quicksand;font-weight:300 700;src:url(/fonts/qs.ttf)}@font-face{font-family:Montserrat;font-weight:100 900;src:url(/fonts/ms.ttf)}',
});
await page.evaluate(() =>
  Promise.all(
    ['700 10px Quicksand', '200 10px Montserrat', '700 10px QS', '600 10px QS', '200 10px MS', '900 10px ZK'].map((f) => document.fonts.load(f)),
  ),
);
await page.addScriptTag({ url: '/shots.js' });
await page.waitForFunction(() => window.ready === true, null, { timeout: 120_000 });

const S = async (o) => ({ ...(await page.evaluate((x) => window.shot(x), o)), w: o.w, h: o.h });
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
for (const im of IMAGES.filter((i) => !only.length || only.some((p) => i.file.startsWith(p)))) {
  const html = await im.html(S);
  await page.evaluate((h) => {
    const art = document.getElementById('art');
    art.innerHTML = h;
    return Promise.all([...art.querySelectorAll('img')].map((i) => i.decode()));
  }, html);
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(OUT, `${im.file}.jpg`);
  fs.writeFileSync(file, await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 2000, height: 2000 } }));
  console.log(`amazon/global/${im.file}.jpg ${Math.round(fs.statSync(file).size / 1024)}KB`);
}
await browser.close();
server.close();
