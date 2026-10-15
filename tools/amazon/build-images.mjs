// Amazon の商品画像（2000×2000・JPEG）を作る。出力は amazon/global/*.jpg
//   node tools/amazon/build-images.mjs          → 全部
//   node tools/amazon/build-images.mjs 03 05    → ファイル名の先頭が一致するものだけ
// 同じ ASIN（商品番号）で全世界に出品するため、画像は全世界共通の1組。説明は動画で行うので、
// 画像は文字をできる限り使わず、3Dモデル・図・記号・数字（mm など）だけで機能を伝える。
// 見た目は LP に合わせる（淡いグレーの光、本体の後ろに青みのグレーの光、紺と金のアクセント）。
// 本体と化粧箱の絵は LP と同じ 3Dモデル（src/scene/）を tools/amazon/shots.js で描く。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'amazon/global');
const FONTS = path.join(ROOT, '.cache/fonts');
const FONT_FILES = {
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
const MUTED = '#5E6373';

// ---------- 記号（線の絵。viewBox 0 0 100 100） ----------
const svg = (body, size, color = NAVY, sw = 6) =>
  `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  turn: '<path d="M74 30A32 32 0 1 0 82 56"/><path d="M62 28L76 29L77 15"/>',
  width: '<path d="M16 18V82M84 18V82"/><path d="M28 50H72M38 40L28 50L38 60M62 40L72 50L62 60"/>',
  lock: '<rect x="24" y="44" width="52" height="42" rx="9"/><path d="M35 44V32A15 15 0 0 1 65 32V44"/><path d="M50 60V70"/>',
  release:
    '<path d="M30 58V34a5 5 0 0 1 10 0V52M40 50V26a5 5 0 0 1 10 0V50M50 50V28a5 5 0 0 1 10 0V52M60 52V36a5 5 0 0 1 10 0V64c0 14-9 24-22 24c-10 0-15-5-20-12L18 60a5 5 0 0 1 8-6l4 4"/><path d="M14 22L22 30M50 10V18M86 22L78 30"/>',
  stepless: '<path d="M12 50H88" stroke-width="10"/><circle cx="58" cy="50" r="14" fill="#fff"/>',
  taper: '<path d="M42 10V46C42 54 30 64 30 78C30 88 38 92 50 92C62 92 70 88 70 78C70 64 58 54 58 46V10"/>',
  eyeOff: '<path d="M8 50C20 30 34 22 50 22S80 30 92 50C80 70 66 78 50 78S20 70 8 50Z"/><circle cx="50" cy="50" r="13"/><path d="M16 84L84 16"/>',
  clock: '<circle cx="50" cy="50" r="38"/><path d="M50 26V50L66 60"/>',
  moon: '<path d="M62 18A32 32 0 1 0 82 62A26 26 0 0 1 62 18Z"/>',
  no: '<circle cx="50" cy="50" r="44"/><path d="M19 19L81 81"/>',
  check: '<path d="M22 52L42 72L80 30"/>',
  cross: '<path d="M26 26L74 74M74 26L26 74"/>',
  arrowR: '<path d="M14 50H84M64 30L84 50L64 70"/>',
  carton:
    '<path d="M12 36L50 22L88 36V76L50 90L12 76Z"/><path d="M12 36L50 50L88 36M50 50V90"/><path d="M31 29L69 43V56"/>',
};

// ---------- 共通の見た目 ----------
const CSS = `
@font-face{font-family:QS;font-weight:300 700;src:url(/fonts/qs.ttf)}
@font-face{font-family:MS;font-weight:100 900;src:url(/fonts/ms.ttf)}
*{margin:0;box-sizing:border-box}
html,body{width:2000px;height:2000px;overflow:hidden;background:#fff}
#gl{position:absolute;left:-99999px;top:0}
#art{position:absolute;inset:0;overflow:hidden;font-family:QS,sans-serif;color:${NAVY}}
.bg{background:radial-gradient(120% 90% at 50% 40%,#F6F7FA 0%,#E4E7EE 55%,#D3D8E2 100%)}
.glow{position:absolute;pointer-events:none;background:radial-gradient(closest-side,rgba(112,126,158,.5) 0%,rgba(115,129,160,.45) 25%,rgba(122,135,165,.34) 45%,rgba(133,145,172,.2) 64%,rgba(147,158,184,.08) 82%,rgba(160,170,194,0) 100%)}
.a{position:absolute}
.mark{position:absolute;left:120px;top:104px;font-family:MS;font-weight:200;font-size:58px;letter-spacing:.04em;color:${NAVY}}
.num{font-weight:700;letter-spacing:.01em;line-height:1;white-space:nowrap}
.num small{font-size:.5em;margin-left:.12em;font-weight:600}
.card{position:absolute;background:rgba(255,255,255,.78);border-radius:44px;box-shadow:0 24px 60px -30px rgba(22,26,41,.35)}
.badge{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;background:${NAVY};color:${GOLD}}
.c{transform:translate(-50%,-50%)}
`;
const img = (r, x, y, extra = '') => `<img class="a" src="${r.url}" style="left:${x}px;top:${y}px;${extra}">`;
const glow = (cx, cy, w, h) => `<div class="glow" style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px"></div>`;
const mark = '<p class="mark">Luca Bloom</p>';
const num = (x, y, v, unit, size, color = NAVY, extra = '') =>
  `<p class="a num c" style="left:${x}px;top:${y}px;font-size:${size}px;color:${color};${extra}">${v}${unit ? `<small>${unit}</small>` : ''}</p>`;
// 寸法線（矢印つき）。x1,y1 → x2,y2
const dim = (x1, y1, x2, y2, color = NAVY, sw = 5, head = 22) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hd = (x, y, s) =>
    `M${x + Math.cos(a + s * 2.6) * head} ${y + Math.sin(a + s * 2.6) * head}L${x} ${y}L${x + Math.cos(a - s * 2.6) * head} ${y + Math.sin(a - s * 2.6) * head}`;
  return `<path d="M${x1} ${y1}L${x2} ${y2}${hd(x1, y1, -1).replace('M', 'M')}${hd(x2, y2, 1)}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const layer = (body) => `<svg class="a" style="left:0;top:0" width="2000" height="2000" viewBox="0 0 2000 2000">${body}</svg>`;

// ---------- 画像の組み立て（S：3Dの描画。shot(設定) → { url, pts, arms }） ----------
const IMAGES = [
  // 1枚目（メイン画像）：Amazon の決まりどおり、白い背景（RGB 255）に製品だけ。文字・記号なし
  {
    file: '01-main',
    bg: '#fff',
    async html(S) {
      const r = await S({ w: 2000, h: 2000, travel: 22, dist: 300, look: [-10, -16, 0], shadow: true });
      return img(r, 0, 0);
    },
  },
  // 2枚目：全体と特長の記号（開き幅70mm・無段階・手を離しても止まる・先端が太いアーム）
  {
    file: '02-overview',
    async html(S) {
      const r = await S({ w: 2000, h: 1400, travel: 30, dist: 255, look: [-9, -16, 0] });
      const items = [
        [svg(ICON.width, 150, GOLD, 6), num(0, 0, '70', 'mm', 64, NAVY, 'position:static;transform:none;margin-top:18px')],
        [svg(ICON.stepless, 150, GOLD, 6), ''],
        [svg(ICON.lock, 150, GOLD, 6), ''],
        [svg(ICON.taper, 150, GOLD, 6), ''],
      ];
      return `${glow(1000, 760, 2600, 1100)}${mark}${img(r, 0, 120)}
${items.map(([ic, n], i) => `<div class="card" style="left:${130 + i * 445}px;top:1530px;width:405px;height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center">${ic}${n}</div>`).join('')}`;
    },
  },
  // 3枚目：ハンドルを回すと、2本のアームが平行に開く（全閉を薄く重ね、最大70mmを実線で）
  {
    file: '03-open',
    async html(S) {
      const o = { w: 2000, h: 1500, view: 'front', scale: 16, look: [-4, -12, 0], shadow: false };
      const a = await S({ ...o, travel: 0 });
      const b = await S({ ...o, travel: 60, points: [[-54, 10, 0], [-24, -22, 0], [21, -22, 0]] });
      const [hx, hy] = b.pts[0];
      const [m1, m2] = [b.pts[1], b.pts[2]];
      const top = 300;
      const y = top + b.arms.left[1] + 90;
      return `${glow(1000, 1000, 2600, 1300)}${mark}
${img(a, 0, top, 'opacity:.4')}${img(b, 0, top)}
${layer(`${dim(m1[0], top + m1[1], m2[0], top + m2[1], GOLD, 10, 36)}<g transform="translate(${hx - 20} ${top + hy - 230}) scale(2.4)">${ICON.turn.replace(/<path/g, `<path stroke="${GOLD}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"`)}</g>
${dim(b.arms.left[0], y, b.arms.right[0], y, GOLD_INK, 6, 26)}
<path d="M${b.arms.left[0]} ${y - 40}V${y + 40}M${b.arms.right[0]} ${y - 40}V${y + 40}" stroke="${GOLD_INK}" stroke-width="5" stroke-linecap="round"/>`)}
${num((b.arms.left[0] + b.arms.right[0]) / 2, y + 110, '70', 'mm', 120, NAVY)}`;
    },
  },
  // 4枚目：無段階に調整でき、手を離してもその幅で止まる（内部の送りねじを透かして見せる）
  {
    file: '04-lock',
    async html(S) {
      const r = await S({ w: 2000, h: 1300, view: 'front', scale: 17, look: [-4, -12, 0], travel: 32, see: true, shadow: false });
      const top = 380;
      const y = top + r.arms.left[1] + 70;
      const x1 = r.arms.left[0];
      const x2 = r.arms.right[0];
      // 下：目盛りのない連続した帯（無段階）と、いまの位置
      const bx = 330;
      const bw = 1340;
      const by = 1830;
      const k = 0.45;
      return `${glow(1000, 1000, 2600, 1300)}${mark}
<div class="card" style="left:1340px;top:90px;width:540px;height:230px;display:flex;align-items:center;justify-content:center;gap:30px">${svg(ICON.release, 150, NAVY, 6)}${svg(ICON.arrowR, 80, MUTED, 7)}${svg(ICON.lock, 150, GOLD_INK, 7)}</div>
${img(r, 0, top)}
${layer(`${dim(x1, y, x2, y, GOLD_INK, 6, 24)}<path d="M${x1} ${y - 36}V${y + 36}M${x2} ${y - 36}V${y + 36}" stroke="${GOLD_INK}" stroke-width="5" stroke-linecap="round"/>
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#C4CAD6"/><stop offset="1" stop-color="${GOLD}"/></linearGradient></defs>
<rect x="${bx}" y="${by - 14}" width="${bw}" height="28" rx="14" fill="url(#g)"/>
<circle cx="${bx + bw * k}" cy="${by}" r="36" fill="#fff" stroke="${GOLD_INK}" stroke-width="8"/>`)}
<div class="badge c" style="left:${(x1 + x2) / 2}px;top:${y}px;width:120px;height:120px">${svg(ICON.lock, 76, GOLD, 8)}</div>
${num(bx - 90, by, '0', '', 64, MUTED)}${num(bx + bw + 130, by, '70', 'mm', 64, MUTED)}`;
    },
  },
  // 5枚目：先端が太い「逆テーパー」のアーム。くびれ部に皮膚（ピンクの膜）がおさまり、外れにくい
  {
    file: '05-taper',
    async html(S) {
      // 左：本体（ピンクの膜＝狭い穴のイメージ）。右：アームの形（根元が細く、先端が太い）を拡大し、
      // くびれ部におさまった皮膚（ピンクの輪）が、太い先端で止まる様子
      const r = await S({ w: 1160, h: 1500, view: 'front', scale: 10.5, look: [-4, -14, 0], travel: 25, sleeve: true, shadow: false });
      const ARM = 'M0 0V39A1 1 0 0 0 1 40H1.394A2 2 0 0 0 2.504 39.664L3.664 38.891L4.387 38.211A3 3 0 0 0 5 36.394V35.475A20 20 0 0 0 4.784 32.541L2.522 17.293A2 2 0 0 1 4.5 15H7A1 1 0 0 0 8 14V0Z';
      const k = 30; // 1mmあたりのpx
      const ox = 1370; // アームの左端
      const oy = 330; // アームの上端
      const X = (v) => ox + v * k;
      const Y = (v) => oy + v * k;
      return `${glow(800, 1050, 2000, 1400)}${mark}${img(r, 20, 300)}
<div class="card" style="left:1160px;top:250px;width:740px;height:1560px"></div>
${layer(`<path d="${ARM}" transform="translate(${ox} ${oy}) scale(${k})" fill="#fff" stroke="${NAVY}" stroke-width="${3 / k}" stroke-linejoin="round"/>
<ellipse cx="${X(2.1)}" cy="${Y(21.5)}" rx="${3.4 * k}" ry="${0.9 * k}" fill="none" stroke="${PINK}" stroke-width="30" opacity=".9"/>
${dim(X(2.1), Y(23.5), X(2.1), Y(31.2), GOLD, 10, 34)}
<path d="M${X(-0.6)} ${Y(32.4)}H${X(5.6)}" stroke="${GOLD}" stroke-width="12" stroke-linecap="round"/>
`)}`;
    },
  },
  // 6枚目：アームの外側は幅6mmの平らな面（角R2）。線ではなく面で当たり、力が分散する
  {
    file: '06-flat',
    async html() {
      // 断面図：左＝丸い棒（線で当たる）、右＝Luca Bloom（幅6mm・角R2の平らな面で当たる）
      const arrows = (cx, y0, xs, len, color) =>
        xs.map((dx) => `<path d="M${cx + dx} ${y0 - len}V${y0 - 18}M${cx + dx - 16} ${y0 - 36}L${cx + dx} ${y0 - 18}L${cx + dx + 16} ${y0 - 36}" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      const L = 560;
      const R = 1360;
      const Y = 1060;
      const skin = (cx, w, sag) => `<path d="M${cx - w} ${Y - 40 - sag}Q${cx} ${Y - 40 + sag * 0.2} ${cx + w} ${Y - 40 - sag}" stroke="${PINK}" stroke-width="34" fill="none" stroke-linecap="round" opacity=".85"/>`;
      return `${glow(1000, 1060, 2600, 1400)}${mark}
${layer(`${skin(L, 300, 120)}${skin(R, 330, 30)}
<circle cx="${L}" cy="${Y + 150}" r="190" fill="#fff" stroke="#9AA2B5" stroke-width="10"/>
<rect x="${R - 285}" y="${Y - 40}" width="570" height="380" rx="95" fill="#fff" stroke="${NAVY}" stroke-width="10"/>
${arrows(L, Y - 70, [0], 300, '#9AA2B5')}
${arrows(R, Y - 70, [-240, -160, -80, 0, 80, 160, 240], 200, GOLD)}
${dim(R - 285, Y + 450, R + 285, Y + 450, NAVY, 6, 24)}`)}
<div class="badge c" style="left:${L}px;top:${Y + 560}px;width:110px;height:110px;background:#9AA2B5;color:#fff">${svg(ICON.cross, 64, '#fff', 11)}</div>
<div class="badge c" style="left:${R}px;top:${Y + 640}px;width:130px;height:130px">${svg(ICON.check, 84, GOLD, 11)}</div>
${num(R, Y + 530, '6', 'mm', 76, NAVY)}
${num(R + 380, Y + 20, 'R2', '', 60, MUTED)}<svg class="a" style="left:0;top:0" width="2000" height="2000"><path d="M${R + 330} ${Y + 20}L${R + 262} ${Y - 18}" stroke="${MUTED}" stroke-width="5" stroke-linecap="round"/></svg>`;
    },
  },
  // 7枚目：寸法（全長100.75・本体85×20・アーム40・最大の開き70）と素材・製造国
  {
    file: '07-size',
    async html(S) {
      const o = { w: 2000, h: 1500, view: 'front', scale: 14, look: [-4, -12, 0], shadow: false };
      const P = [[-54, 20, 0], [46.75, 20, 0], [-42.5, 20, 0], [42.5, 20, 0], [42.5, 0, 0], [-34.5, 0, 0], [-34.5, -40, 0]];
      const a = await S({ ...o, travel: 60 });
      const b = await S({ ...o, travel: 0, points: P });
      const top = 330;
      const p = b.pts.map(([x, y]) => [x, y + top]);
      const yA = p[0][1] - 190;
      const yB = p[0][1] - 90;
      const xR = p[3][0] + 170;
      const xL = p[5][0] - 150;
      const yO = top + a.arms.left[1] + 110;
      const ext = (x, y1, y2) => `<path d="M${x} ${y1}V${y2}" stroke="${MUTED}" stroke-width="3" stroke-dasharray="10 10"/>`;
      return `${glow(1000, 1000, 2600, 1300)}${mark}
${img(a, 0, top, 'opacity:.25')}${img(b, 0, top)}
${layer(`${ext(p[0][0], yA - 30, p[0][1])}${ext(p[1][0], yA - 30, p[1][1])}${ext(p[2][0], yB - 30, p[2][1])}${ext(p[3][0], yB - 30, p[3][1])}
${dim(p[0][0], yA, p[1][0], yA)}${dim(p[2][0], yB, p[3][0], yB, MUTED)}
<path d="M${p[3][0] + 40} ${p[3][1]}H${xR + 30}M${p[4][0] + 40} ${p[4][1]}H${xR + 30}" stroke="${MUTED}" stroke-width="3" stroke-dasharray="10 10"/>${dim(xR, p[3][1], xR, p[4][1])}
<path d="M${p[5][0] - 30} ${p[5][1]}H${xL - 30}M${p[6][0] - 30} ${p[6][1]}H${xL - 30}" stroke="${MUTED}" stroke-width="3" stroke-dasharray="10 10"/>${dim(xL, p[5][1], xL, p[6][1])}
${dim(a.arms.left[0], yO, a.arms.right[0], yO, GOLD_INK, 6, 24)}`)}
${num((p[0][0] + p[1][0]) / 2, yA - 60, '100.75', 'mm', 58)}${num((p[2][0] + p[3][0]) / 2, yB - 50, '85', 'mm', 46, MUTED)}
${num(xR + 120, (p[3][1] + p[4][1]) / 2, '20', 'mm', 52)}${num(xL - 120, (p[5][1] + p[6][1]) / 2, '40', 'mm', 52)}
${num((a.arms.left[0] + a.arms.right[0]) / 2, yO + 80, '70', 'mm', 76, GOLD_INK)}
<p class="a num" style="left:0;right:0;top:1850px;text-align:center;font-size:40px;font-weight:600;color:${MUTED};letter-spacing:.06em">POM&nbsp;&nbsp;·&nbsp;&nbsp;Made in China&nbsp;&nbsp;·&nbsp;&nbsp;Inspected &amp; assembled in Japan</p>`;
    },
  },
  // 8枚目：化粧箱は背面に「Luca Bloom」だけ。さらに外箱に入れて届く（中身がわからない）
  {
    file: '08-package',
    async html(S) {
      const r = await S({ kind: 'box', w: 1300, h: 1100, yaw: 180, lid: 0, dist: 380, look: [0, 22, 0], dir: [-0.35, 0.5, 1] });
      return `${glow(1000, 1000, 2600, 1300)}${mark}${img(r, 40, 420)}
${layer(`<g transform="translate(1360 820) scale(5.2)" stroke="#8C6A3E" stroke-width="2.4" fill="#D9B98C" stroke-linejoin="round"><path d="M12 36L50 22L88 36V76L50 90L12 76Z"/><path d="M12 36L50 50L88 36M50 50V90" fill="none"/><path d="M42 47L42 87" stroke="#B8935E" stroke-width="7"/></g>
<g transform="translate(1180 1010) scale(1.6)">${ICON.arrowR.replace(/<path/g, `<path stroke="${MUTED}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"`)}</g>`)}
<div class="badge c" style="left:1640px;top:560px;width:220px;height:220px">${svg(ICON.eyeOff, 140, GOLD, 7)}</div>`;
    },
  },
  // 9枚目：安全のための使用の上限（1回30分・24時間で合計1時間・就寝中は使わない・18歳以上）
  {
    file: '09-safety',
    async html() {
      const cell = (x, y, icon, label) =>
        `<div class="card" style="left:${x}px;top:${y}px;width:820px;height:760px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">${icon}${label}</div>`;
      const t = (v, u, c = NAVY) => `<p class="num" style="font-size:120px;color:${c}">${v}<small>${u}</small></p>`;
      const noSleep = `<div style="position:relative;width:300px;height:300px">${svg(ICON.moon, 300, NAVY, 6)}<div style="position:absolute;inset:0">${svg(ICON.no, 300, '#C0453C', 7)}</div></div>`;
      return `${glow(1000, 1060, 2600, 1700)}${mark}
${cell(140, 300, svg(ICON.clock, 300, NAVY, 6), t('≤30', 'min'))}
${cell(1040, 300, svg(ICON.clock, 300, NAVY, 6).replace('<path d="M50 26V50L66 60"/>', '<path d="M50 26V50L66 60"/><path d="M14 30A40 40 0 0 1 30 14" stroke-width="9"/>'), t('≤1', 'h / 24 h'))}
${cell(140, 1140, noSleep, '')}
${cell(1040, 1140, '', `<p class="num" style="font-size:300px;color:${NAVY}">18<span style="color:${GOLD_INK}">+</span></p>`)}`;
    },
  },
];

// ---------- 書き出し ----------
const bundle = await esbuild.build({
  entryPoints: [path.join(import.meta.dirname, 'shots.js')],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
});
const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div id="gl"></div><div id="art"></div></body></html>`;
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
  Promise.all(['700 10px Quicksand', '200 10px Montserrat', '700 10px QS', '200 10px MS'].map((f) => document.fonts.load(f))),
);
await page.addScriptTag({ url: '/shots.js' });
await page.waitForFunction(() => window.ready === true, null, { timeout: 120_000 });

const S = (o) => page.evaluate((x) => window.shot(x), o);
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
for (const im of IMAGES.filter((i) => !only.length || only.some((p) => i.file.startsWith(p)))) {
  const html = await im.html(S);
  await page.evaluate(
    ([h, bg]) => {
      const art = document.getElementById('art');
      art.className = bg ? '' : 'bg';
      art.style.background = bg || '';
      art.innerHTML = h;
      return Promise.all([...art.querySelectorAll('img')].map((i) => i.decode()));
    },
    [html, im.bg || ''],
  );
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(OUT, `${im.file}.jpg`);
  fs.writeFileSync(file, await page.screenshot({ type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 2000, height: 2000 } }));
  console.log(`amazon/global/${im.file}.jpg ${Math.round(fs.statSync(file).size / 1024)}KB`);
}
await browser.close();
server.close();
