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
.mark{position:absolute;right:120px;top:130px;font-family:MS;font-weight:200;font-size:54px;letter-spacing:.04em;color:${NAVY}}
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
  `<div class="a" style="left:${x}px;top:${y}px">${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h1 class="h" style="${kicker ? '' : 'margin-top:0'}">${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const mark = '<p class="mark">Luca Bloom</p>';
const layer = (body) => `<svg class="a" style="left:0;top:0;overflow:visible" width="2000" height="2000" viewBox="0 0 2000 2000">${body}</svg>`;
// 矢印つきの線（x1,y1 → x2,y2）。both=true で両端に矢印
const arrow = (x1, y1, x2, y2, color, sw, head, both = false) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hd = (x, y, s) =>
    `M${x + Math.cos(a + s * 2.55) * head} ${y + Math.sin(a + s * 2.55) * head}L${x} ${y}L${x + Math.cos(a - s * 2.55) * head} ${y + Math.sin(a - s * 2.55) * head}`;
  return `<path d="M${x1} ${y1}L${x2} ${y2}${hd(x2, y2, 1)}${both ? hd(x1, y1, -1) : ''}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};

// ---------- 4枚の組み立て（S：3Dの描画。shot(設定) → { url, w, h, pts, arms }） ----------
// アームの断面（図面どおり：幅6mm×厚さ5mm、肌に当たる外側の角R2・内側の角R1）。単位 mm、左上が原点、上の辺が肌に当たる面
const SECTION = 'M0 2A2 2 0 0 1 2 0H4A2 2 0 0 1 6 2V4A1 1 0 0 1 5 5H1A1 1 0 0 1 0 4Z';
// 背景の飾り：細かい点の格子（中央ほど薄い）と、金色の細い円弧
const deco = (cx, cy, rs = [620, 780]) =>
  layer(`<defs><pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="2.2" fill="rgba(22,26,41,.13)"/></pattern>
<radialGradient id="fade" cx="${cx / 2000}" cy="${cy / 2000}" r=".75"><stop offset=".25" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
<mask id="dm"><rect width="2000" height="2000" fill="url(#fade)"/></mask></defs>
<rect width="2000" height="2000" fill="url(#dots)" mask="url(#dm)"/>
${rs.map((r, n) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(227,179,78,${n ? 0.28 : 0.4})" stroke-width="${n ? 2 : 3}" stroke-dasharray="${n ? '2 16' : `${r * 2.2} ${r * 4}`}" stroke-linecap="round" transform="rotate(${n ? 0 : 200} ${cx} ${cy})"/>`).join('')}`);
// 寸法線：両端の目盛りと、外から内向き（inside=false）または内から外向きの矢印
const extLine = (x, y1, y2) => `<path d="M${x} ${y1}V${y2}" stroke="${MUTED}" stroke-width="3" stroke-dasharray="6 9"/>`;
// アームの先端（最も太い所）とくぼみ部の高さ（本体の座標、mm）
const Y_TIP = -35.475;
const Y_NECK = -17.3;
const IMAGES = [
  // 1枚目：回して、開いて、止まる。後ろに「Luca Bloom」の文字だけの化粧箱。特長は4語
  {
    file: '01-hero',
    text: ['Turn. Open. Stays put.', '70 mm', 'Stepless', 'Self-lock', 'Discreet', 'Made in China · Inspected & assembled in Japan · 18+'],
    async html(S) {
      const box = await S({ kind: 'box', w: 900, h: 720, yaw: 205, lid: 0, dist: 470, fov: 26, look: [0, 18, 0], dir: [0.15, 0.4, 1] });
      const v = { w: 1600, h: 1200, dist: 235, look: [-12, -13, 0], dir: [-0.5, 0.3, 0.82] };
      const g0 = await S({ ...v, travel: 0, shadow: false });
      const g1 = await S({ ...v, travel: 22, shadow: false });
      const r = await S({ ...v, travel: 44, turnArrow: true, moveArrow: true });
      const badges = [
        ['width', '70 mm'],
        ['slider', 'Stepless'],
        ['lock', 'Self-lock'],
        ['eyeOff', 'Discreet'],
      ];
      return `${glow(900, 1100, 3000, 1500)}${deco(760, 1050)}${mark}
${head('', 'Turn. Open.<br><em>Stays put.</em>', '', 130, 110)}
${img(box, 1060, 880)}
${img(g0, 0, 470, 'opacity:.16')}${img(g1, 0, 470, 'opacity:.3')}${img(r, 0, 470)}
<div class="a" style="left:0;right:0;top:1712px;display:flex;justify-content:center;gap:46px">
${badges.map(([ic, t]) => `<div class="glass" style="position:static;display:flex;align-items:center;gap:22px;height:132px;padding:0 40px 0 22px;border-radius:99px"><div class="disc" style="width:96px;height:96px">${icon(ic, 58, GOLD, 8)}</div><p class="t1" style="font-size:46px">${t}</p></div>`).join('')}</div>
<p class="foot" style="bottom:44px">Made in China · Inspected &amp; assembled in Japan · 18+</p>`;
    },
  },
  // 2枚目：閉じた時（先端の外側10mm・くぼみ部5mm）→ 最大70mm。寸法線は 3D の点から求めるので、製品の位置と一致する。
  // 右：ハンドルの拡大（立体の回転の矢印）、1回転で2mm
  {
    file: '02-size',
    text: ['10 → 70 mm', '1 turn = 2 mm', '5 mm', '10 mm', '70 mm'],
    async html(S) {
      const o = { w: 1300, h: 720, view: 'front', scale: 11.5, look: [-3.6, -10.5, 0], shadow: false };
      const pa = [[-39.5, Y_TIP, 0], [-29.5, Y_TIP, 0], [-34.5 - 2.522, Y_NECK, 0], [-34.5 + 2.522, Y_NECK, 0], [0, -40, 0]];
      const pb = [[-39.5, Y_TIP, 0], [30.5, Y_TIP, 0], [0, -40, 0]];
      const a = await S({ ...o, travel: 0, points: pa });
      const b = await S({ ...o, travel: 60, moveArrow: true, points: pb });
      const hz = await S({ w: 560, h: 560, travel: 0, turnArrow: true, dist: 92, fov: 26, look: [-49, 8, 0], dir: [-0.78, 0.32, 0.55], shadow: false });
      const X0 = 60;
      const ya = 300;
      const yb = 1090;
      const A = a.pts.map(([x, y]) => [X0 + x, ya + y]);
      const B = b.pts.map(([x, y]) => [X0 + x, yb + y]);
      const la = A[4][1] + 48; // 閉じた時の寸法線（先端の下）
      const lb = B[2][1] + 52; // 開いた時の寸法線
      const ny = A[2][1];
      const col = 1420; // 右の列（数値）
      return `${glow(800, 1150, 2800, 1800)}${deco(700, 1050, [])}${mark}
<p class="a h" style="left:130px;top:110px;margin:0;font-size:150px">10<span style="font-family:QS;color:${GOLD};margin:0 .18em">→</span><em>70</em><span style="font-size:.5em"> mm</span></p>
${img(a, X0, ya)}${img(b, X0, yb)}
${layer(`${extLine(A[0][0], A[0][1], la + 20)}${extLine(A[1][0], A[1][1], la + 20)}
${arrow(A[0][0] - 110, la, A[0][0], la, NAVY, 5, 20)}${arrow(A[1][0] + 110, la, A[1][0], la, NAVY, 5, 20)}
${arrow(A[2][0] - 120, ny, A[2][0] - 4, ny, GOLD_INK, 5, 20)}${arrow(A[3][0] + 120, ny, A[3][0] + 4, ny, GOLD_INK, 5, 20)}
<path d="M${A[1][0] + 130} ${la}H${col - 24}M${A[3][0] + 140} ${ny}H${col - 24}" stroke="${GOLD}" stroke-width="3" stroke-dasharray="3 12" stroke-linecap="round"/>
${extLine(B[0][0], B[0][1], lb + 20)}${extLine(B[1][0], B[1][1], lb + 20)}${arrow(B[0][0], lb, B[1][0], lb, GOLD_INK, 6, 26, true)}
<circle cx="1660" cy="1390" r="236" fill="rgba(255,255,255,.9)" stroke="${GOLD}" stroke-width="8"/>`)}
<p class="a t1" style="left:${col}px;top:${ny - 40}px;font-size:72px;color:${GOLD_INK}">5<span style="font-size:.5em"> mm</span></p>
<p class="a t1" style="left:${col}px;top:${la - 40}px;font-size:72px">10<span style="font-size:.5em"> mm</span></p>
<div class="a c" style="left:${(B[0][0] + B[1][0]) / 2}px;top:${lb}px"><span class="pill" style="background:${GOLD};color:${NAVY};font-size:50px;height:92px">70 mm</span></div>
<img class="a" src="${hz.url}" width="460" height="460" style="left:1430px;top:1160px;border-radius:50%">
<p class="a c t1" style="left:1660px;top:1690px;font-size:50px">1 turn <span style="color:${GOLD_INK}">= 2 mm</span></p>`;
    },
  },
  // 3枚目：2本のアームが膜（ピンク）を内側から押し広げ、膜の口はくびれ部に収まる。先端が太いので抜けにくい。
  // 右上：全体のどこを拡大したか。右下：アームの断面（図面どおり）
  {
    file: '03-hold',
    text: ['Wide tips. Stays in place.', '6 mm', 'R2'],
    async html(S) {
      const r = await S({ w: 1300, h: 1400, view: 'front', scale: 19.5, look: [-19, -27, 0], travel: 26, sleeve: true, pushArrows: true, pushY: -22, shadow: false, points: [[-34.5 + 26 + 4.6, -30, 0]] });
      const top = 560;
      const ctx = await S({ w: 520, h: 400, travel: 26, sleeve: true, view: 'front', scale: 4.2, look: [-4, -12, 0], shadow: false, points: [[-46, -13, 0], [-1, -42, 0]] });
      const k = 50; // 断面図：1mmあたりのpx
      const cx = 1580;
      const cy = 1330;
      const sx = cx + 2.5 * k - 30;
      const sy = cy - 3 * k;
      const rot = `translate(${sx} ${sy}) rotate(90) scale(${k})`;
      const X = sx - 5 * k;
      const skin = `M${X + 3.8 * k} ${sy - 1.7 * k}L${X + 5.15 * k} ${sy + 0.15 * k}A${2.15 * k} ${2.15 * k} 0 0 1 ${X + 7.15 * k} ${sy + 2 * k}V${sy + 4 * k}A${2.15 * k} ${2.15 * k} 0 0 1 ${X + 5.15 * k} ${sy + 6.15 * k}L${X + 3.8 * k} ${sy + 7.7 * k}`;
      const [lx, ly] = [90 + r.pts[0][0], top + r.pts[0][1]];
      const [q1, q2] = ctx.pts;
      const cX = 1400;
      const cY = 290;
      return `${glow(800, 1250, 2600, 1500)}${deco(760, 1250, [600, 760])}${mark}
${head('', 'Wide tips.<br><em>Stays in place.</em>', '', 130, 110)}
${img(r, 90, top, '-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 14%)')}
<div class="glass" style="left:${cX - 20}px;top:${cY - 20}px;width:560px;height:440px;border-radius:40px"></div>${img(ctx, cX, cY)}
${layer(`<rect x="${cX + q1[0]}" y="${cY + q1[1]}" width="${q2[0] - q1[0]}" height="${q2[1] - q1[1]}" rx="10" fill="none" stroke="${GOLD}" stroke-width="5"/>
<path d="M${cX + q1[0]} ${cY + q2[1]}L${520} ${top + 260}" stroke="${GOLD}" stroke-width="3" stroke-dasharray="3 12" stroke-linecap="round"/>
<path d="M${lx + 10} ${ly}C${lx + 160} ${ly} ${cx - 420} ${cy} ${cx - 330} ${cy}" stroke="${GOLD}" stroke-width="5" fill="none" stroke-dasharray="4 14" stroke-linecap="round"/><circle cx="${lx}" cy="${ly}" r="14" fill="${GOLD}"/>
<circle cx="${cx}" cy="${cy}" r="320" fill="rgba(255,255,255,.9)" stroke="${GOLD}" stroke-width="8"/>
<path d="${skin}" stroke="${PINK}" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
${[0.8, 1.9, 3, 4.1, 5.2].map((y) => arrow(X + 9.4 * k, sy + y * k, X + 7.5 * k, sy + y * k, GOLD_INK, 9, 24)).join('')}
<path d="${SECTION}" transform="${rot}" fill="#F4F2EC" stroke="${NAVY}" stroke-width="${4 / k}"/>
<path d="M${X - 30} ${sy}H${X - 54}V${sy + 6 * k}H${X - 30}" stroke="${NAVY}" stroke-width="4" fill="none"/>
<path d="M${X + 5 * k + 14} ${sy - 14}L${X + 5 * k + 70} ${sy - 70}" stroke="${MUTED}" stroke-width="4" stroke-linecap="round"/>`)}
<p class="a c t1" style="left:${X - 130}px;top:${sy + 3 * k}px;font-size:56px">6<span style="font-size:.55em"> mm</span></p>
<p class="a c t1" style="left:${X + 5 * k + 105}px;top:${sy - 100}px;font-size:52px;color:${MUTED}">R2</p>`;
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
