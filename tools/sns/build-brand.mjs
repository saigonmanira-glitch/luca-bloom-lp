// 海外向け SNS のブランド画像（ヘッダー・カバー・バナー・投票の告知画像）を作る。
//   node tools/sns/build-brand.mjs        → sns/en/brand/ に書き出す
// 文言は海外LPの言語ファイル（tools/i18n/locales/*.mjs の og）と同じで、各国の規制に合わせた表現だけを使う
// （病名・効果・比較・価格・「限定」を入れない）。製品画像は LP と同じ3Dモデルから描く（tools/sns/product.js）。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）、フォントの元ファイル（npm run build:fonts で .cache/fonts に取得）
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { chromium } from '@playwright/test';
import { LOCALES } from '../i18n/site.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'sns/en/brand');
const FONTS = path.join(ROOT, '.cache/fonts');
const font = (f) => {
  const p = path.join(FONTS, f);
  if (!fs.existsSync(p)) {
    console.error(`フォントの元ファイルがありません（${f}）。先に npm run build:fonts を実行してください。`);
    process.exit(1);
  }
  return `data:font/ttf;base64,${fs.readFileSync(p).toString('base64')}`;
};
const FACES = `
@font-face{font-family:ZK;font-weight:400;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Regular.ttf')})}
@font-face{font-family:ZK;font-weight:700;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Bold.ttf')})}
@font-face{font-family:ZK;font-weight:900;src:url(${font('zenkakugothicnew__ZenKakuGothicNew-Black.ttf')})}
@font-face{font-family:QS;font-weight:300 700;src:url(${font('quicksand__Quicksand[wght].ttf')})}
@font-face{font-family:MS;font-weight:100 900;src:url(${font('montserrat__Montserrat[wght].ttf')})}`;

const L = Object.fromEntries(LOCALES.map((x) => [x.code, x]));

// 5か国（英国・オーストラリア・米国・カナダ・メキシコ）共通の英語版。広報は英語1本で行う。
// og は LP の共有画像と同じ見出し・特長。market：販売先と、発売前の国（投票中）の案内
// リンク先の英語LPには国の切り替え（Language）があり、米国・カナダ・メキシコの投票ページへ移れる
const COMMON = { og: L['en-GB'].og, url: 'luca-bloom.com/en', market: 'On Amazon UK &amp; Australia · Coming to the US, Canada &amp; Mexico' };

// 投票の告知画像の文言（LP の発売前の表示と同じ内容）。投票は国ごとの LP から
const VOTE = { goal: 'Our goal: launch in 2026', h: ['Help bring Luca Bloom', 'to the US, Canada and Mexico'], p: 'Sales start once 30 people vote by email.<br>One email per person · No payment or commitment', cta: 'Vote at', url: 'luca-bloom.com/us · /ca · /mx' };

const FLOWER = (size) => `<svg width="${size}" height="${size}" viewBox="-360 -360 720 720"><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDAE4C"/><stop offset="1" stop-color="#B9862A"/></linearGradient><path id="p" d="M0,-92 C 88,-150 96,-262 0,-350 C -100,-276 -88,-150 0,-92Z"/></defs><g fill="url(#gd)">${[0, 60, 120, 180, 240, 300].map((r) => `<use href="#p" transform="rotate(${r})"/>`).join('')}<circle r="34" fill="#161A29"/></g></svg>`;

const BASE = `*{margin:0;box-sizing:border-box}
body{overflow:hidden;font-family:ZK;color:#161A29;background:radial-gradient(55% 95% at 76% 55%,#E7EAF3 0%,#F4F5F9 45%,#FFFFFF 78%)}
.logo{display:flex;align-items:center;gap:.42em;font-family:MS;font-weight:200;letter-spacing:.02em;line-height:1}
.for{font-family:QS;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#9A6A12}
h1{font-weight:900;line-height:1.3;letter-spacing:.005em}
.chips{display:flex;flex-wrap:wrap;gap:.6em}
.chips span{border:1.5px solid #D5D8E0;border-radius:99px;padding:.35em .9em;font-weight:700;background:#fff;white-space:nowrap}
.chips b{font-family:QS;color:#9A6A12}
.market{display:inline-block;background:#161A29;color:#F1EEE6;border-radius:99px;padding:.4em 1em;font-weight:700}
.url{font-family:QS;font-weight:600;letter-spacing:.06em;color:#4A5068}
.prod{position:absolute}`;

const chips = (og) => `<div class="chips">${og.chips.map((c) => `<span>${c}</span>`).join('')}</div>`;

// 各画像のレイアウト（大きさと、隠れる部分を避けた配置）
const LAYOUTS = {
  // X のヘッダー 1500×500。左下（0〜380×330〜500）はアイコンで隠れ、スマホでは上下が少し切れる
  'x-header': { w: 1500, h: 500, html: (m) => `
<style>.l{position:absolute;left:110px;top:56px;width:720px}.logo{font-size:64px}.for{margin-top:22px;font-size:19px}h1{margin-top:8px;font-size:40px}.chips{margin-top:20px;font-size:17px}.market{position:absolute;right:56px;top:40px;font-size:16px}.url{position:absolute;right:60px;bottom:34px;font-size:22px}.prod{right:70px;top:112px;height:320px}</style>
<div class="l"><div class="logo">${FLOWER(52)}Luca Bloom</div><p class="for">${m.og.for}</p><h1>${m.og.lines.join('<br>')}</h1>${chips(m.og)}</div>
<img class="prod" src="{{PROD}}"><p class="market">${m.market}</p><p class="url">${m.url}</p>` },
  // Facebook のカバー 1640×624。スマホでは左右が切れて中央の幅1110px前後だけが見えるため、中央に寄せる
  'facebook-cover': { w: 1640, h: 624, html: (m) => `
<style>.l{position:absolute;left:300px;top:110px;width:640px}.logo{font-size:62px}.for{margin-top:24px;font-size:19px}h1{margin-top:8px;font-size:42px}.chips{margin-top:22px;font-size:18px}.market{margin-top:24px;font-size:17px}.url{position:absolute;left:300px;bottom:44px;font-size:22px}.prod{left:940px;top:180px;height:270px}</style>
<div class="l"><div class="logo">${FLOWER(50)}Luca Bloom</div><p class="for">${m.og.for}</p><h1>${m.og.lines.join('<br>')}</h1>${chips(m.og)}<p class="market">${m.market}</p></div>
<img class="prod" src="{{PROD}}"><p class="url">${m.url}</p>` },
  // YouTube のバナー 2560×1440。すべての画面で見えるのは中央の 1546×423（横507〜2053・縦508〜931）
  'youtube-banner': { w: 2560, h: 1440, html: (m) => `
<style>.l{position:absolute;left:560px;top:530px;width:920px}.logo{font-size:80px}.for{margin-top:18px;font-size:22px}h1{margin-top:6px;font-size:44px}.chips{margin-top:14px;font-size:20px}.row{margin-top:18px;display:flex;align-items:center;gap:24px}.market{font-size:19px}.url{font-size:24px}.prod{left:1560px;top:545px;height:330px}</style>
<div class="l"><div class="logo">${FLOWER(64)}Luca Bloom</div><p class="for">${m.og.for}</p><h1>${m.og.lines.join(' ')}</h1>${chips(m.og)}<div class="row"><p class="market">${m.market}</p><p class="url">${m.url}</p></div></div>
<img class="prod" src="{{PROD}}">` },
};

// 発売前の国（米国・カナダ・メキシコ）の投票の告知画像（Instagram の縦長 1080×1350、X・Facebook の横長 1600×900）
const VOTE_LAYOUTS = {
  'vote-portrait': { w: 1080, h: 1350, html: (m, v) => `
<style>.c{position:absolute;left:90px;right:90px;top:90px;text-align:center}.logo{justify-content:center;font-size:58px}.goal{display:inline-block;margin-top:46px;background:#E3B34E;color:#161A29;border-radius:99px;padding:.35em 1.1em;font-size:30px;font-weight:900}h1{margin-top:30px;font-size:56px}.p{margin-top:24px;font-size:25px;line-height:1.7;color:#3E4352}.prod{left:50%;transform:translateX(-50%);top:720px;height:400px}.cta{position:absolute;left:90px;right:90px;bottom:84px;text-align:center;background:#161A29;color:#F1EEE6;border-radius:24px;padding:26px 20px;font-size:30px;font-weight:700}.cta b{font-family:QS;color:#E3B34E}</style>
<div class="c"><div class="logo">${FLOWER(48)}Luca Bloom</div><p class="goal">${v.goal}</p><h1>${v.h.join('<br>')}</h1><p class="p">${v.p}</p></div>
<img class="prod" src="{{PROD}}"><p class="cta">${v.cta} <b>${v.url}</b></p>` },
  'vote-landscape': { w: 1600, h: 900, html: (m, v) => `
<style>.l{position:absolute;left:100px;top:90px;width:860px}.logo{font-size:56px}.goal{display:inline-block;margin-top:40px;background:#E3B34E;color:#161A29;border-radius:99px;padding:.35em 1.1em;font-size:28px;font-weight:900}h1{margin-top:26px;font-size:44px}.p{margin-top:22px;font-size:23px;line-height:1.7;color:#3E4352}.prod{right:70px;top:250px;height:360px}.cta{position:absolute;left:100px;bottom:80px;background:#161A29;color:#F1EEE6;border-radius:22px;padding:22px 34px;font-size:28px;font-weight:700}.cta b{font-family:QS;color:#E3B34E}</style>
<div class="l"><div class="logo">${FLOWER(46)}Luca Bloom</div><p class="goal">${v.goal}</p><h1>${v.h.join('<br>')}</h1><p class="p">${v.p}</p></div>
<img class="prod" src="{{PROD}}"><p class="cta">${v.cta} <b>${v.url}</b></p>` },
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

// 製品画像：3Dモデルを描いて、透明な余白を切り落とす
const js = (await esbuild.build({ entryPoints: [path.join(import.meta.dirname, 'product.js')], bundle: true, write: false, format: 'iife', target: 'es2020' })).outputFiles[0].text;
const gl = await browser.newPage();
await gl.setContent('<!doctype html><body style="margin:0"></body>');
await gl.addScriptTag({ content: js });
await gl.evaluate(() => window.ready);
const PROD = await gl.evaluate(async () => {
  const src = window.renderProduct({ w: 2400, h: 1800, spin: 340, gap: 22, elev: 0.32 });
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const { data } = g.getImageData(0, 0, c.width, c.height);
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 6) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const o = document.createElement('canvas');
  o.width = x1 - x0 + 1;
  o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, -x0, -y0);
  return o.toDataURL('image/png');
});
await gl.close();
fs.writeFileSync(path.join(OUT, 'product.png'), Buffer.from(PROD.split(',')[1], 'base64'));

const page = await browser.newPage();
async function shot(name, { w, h, html }, ...args) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${FACES}${BASE}body{width:${w}px;height:${h}px}</style></head><body>${html(...args).replace('{{PROD}}', PROD)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`sns/en/brand/${name}.png ${w}×${h}`);
}
for (const [kind, layout] of Object.entries(LAYOUTS)) await shot(kind, layout, COMMON);
for (const [kind, layout] of Object.entries(VOTE_LAYOUTS)) await shot(kind, layout, COMMON, VOTE);
await browser.close();
