// Amazon 商品動画（MP4・1920×1080・30fps・H.264）を作る。
//   npm run video                    → out/luca-bloom-amazon.mp4 と out/luca-bloom-thumbnail.jpg
//   npm run video -- --stills 5,15   → 指定した秒の静止画だけ out/still-*.png に書き出す（確認用）
// 必要なもの：ffmpeg（環境変数 FFMPEG で場所を指定可）、Playwright の Chromium（CHROMIUM_PATH で指定可）、
// フォントの元ファイル（.cache/fonts。npm run build:fonts で自動ダウンロード）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import * as esbuild from 'esbuild';
import { DURATION } from './timeline.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'out');
const FONTS = path.join(ROOT, '.cache/fonts');
const FPS = 30;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const FONT_FILES = {
  'zk-400.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Regular.ttf',
  'zk-700.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Bold.ttf',
  'zk-900.ttf': 'zenkakugothicnew__ZenKakuGothicNew-Black.ttf',
  'quicksand.ttf': 'quicksand__Quicksand[wght].ttf',
  'montserrat.ttf': 'montserrat__Montserrat[wght].ttf',
};
for (const f of Object.values(FONT_FILES)) {
  if (!fs.existsSync(path.join(FONTS, f))) {
    console.error(`フォントの元ファイルがありません（${f}）。先に npm run build:fonts を実行してください。`);
    process.exit(1);
  }
}

// ---------- 画面（文字の表示時刻は data-t="開始,終了" 秒） ----------
const HTML = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>video</title><style>
@font-face{font-family:ZK;font-weight:400;src:url(/fonts/zk-400.ttf)}
@font-face{font-family:ZK;font-weight:700;src:url(/fonts/zk-700.ttf)}
@font-face{font-family:ZK;font-weight:900;src:url(/fonts/zk-900.ttf)}
@font-face{font-family:QS;font-weight:300 700;src:url(/fonts/quicksand.ttf)}
@font-face{font-family:MS;font-weight:100 900;src:url(/fonts/montserrat.ttf)}
:root{--navy:#161A29;--ink:#1A1E2C;--muted:#5E6373;--gold:#E3B34E;--gold-ink:#8A6010;--on-navy:#EEF0F6;--on-navy-muted:#A3AAC0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{background:radial-gradient(ellipse 62% 78% at 70% 46%,#F6F7FA 0%,#E4E7EE 50%,#C9CED9 100%);color:var(--ink);font-family:ZK,sans-serif;letter-spacing:.04em}
#gl canvas{position:absolute;inset:0;width:1920px;height:1080px}
.copy{position:absolute;left:150px;top:0;height:1080px;width:900px;display:flex;flex-direction:column;justify-content:center}
.label{font-family:QS;font-weight:700;font-size:30px;letter-spacing:.24em;color:var(--gold-ink);margin-bottom:26px}
.label::before{content:"";display:inline-block;width:56px;height:3px;background:var(--gold);vertical-align:middle;margin-right:20px}
h2{font-weight:900;font-size:76px;line-height:1.32;letter-spacing:.05em}
.sub{margin-top:36px;font-size:36px;line-height:1.7;color:var(--muted);font-weight:700}
.counter{margin-top:34px;display:flex;align-items:baseline;gap:22px}
.counter .k{font-size:34px;font-weight:700;color:var(--muted)}
.counter #mm{font-family:QS;font-weight:700;font-size:150px;line-height:1;color:var(--gold-ink);font-variant-numeric:tabular-nums}
.counter #mmunit{font-family:QS;font-weight:700;font-size:56px;color:var(--gold-ink)}
.steps{list-style:none;margin-top:40px;display:grid;gap:26px}
.steps li{display:flex;align-items:center;gap:28px;font-size:40px;font-weight:700;line-height:1.4}
.steps .n{flex:none;width:78px;height:78px;border-radius:50%;background:var(--navy);color:var(--gold);font-family:QS;font-weight:700;font-size:40px;display:flex;align-items:center;justify-content:center}
.limit{margin-top:40px;padding:22px 30px;border-left:6px solid var(--gold);background:rgba(255,255,255,.8);width:fit-content;font-size:30px;line-height:1.6;font-weight:700}
.limit b{color:var(--gold-ink)}
.mark{position:absolute;left:150px;top:70px;font-family:MS;font-weight:200;font-size:40px;letter-spacing:.06em}
.note{position:absolute;right:80px;bottom:56px;font-size:22px;color:var(--muted);font-weight:400}
.film{position:absolute;right:80px;bottom:96px;font-size:26px;color:var(--muted);font-weight:700;display:flex;align-items:center;gap:14px}
.film i{width:30px;height:30px;border-radius:50%;background:#E58E9E;opacity:.8}
.card{position:absolute;inset:0;background:radial-gradient(ellipse 80% 90% at 50% 40%,#1E2338 0%,var(--navy) 70%);color:var(--on-navy);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.card .logo{font-family:MS;font-weight:200;font-size:150px;letter-spacing:.06em;line-height:1.1}
.card .rule{width:140px;height:3px;background:var(--gold);margin:46px auto}
.card .lead{font-size:44px;font-weight:700;line-height:1.7}
.card .feat{font-size:36px;font-weight:700;line-height:1.9;color:var(--on-navy)}
.card .feat span{color:var(--gold);margin:0 .6em}
.card .fine{margin-top:44px;font-size:24px;color:var(--on-navy-muted);font-weight:400;line-height:1.7}
#outro .logo{font-size:128px}
</style></head><body>
<div id="gl"></div>

<p class="mark" data-t="3.8,46.6">Luca Bloom</p>
<p class="note" data-t="3.8,46.6">※画像は3Dモデルです</p>
<p class="film" data-t="4.4,26.6"><i></i>ピンクの膜は狭い穴のイメージ</p>
<p class="film" data-t="33.8,40.6"><i></i>ピンクの膜は狭い穴のイメージ</p>

<div class="copy" data-t="4.0,10.6">
  <p class="label">EASY</p>
  <h2>ハンドルを<br>回すだけ。</h2>
  <p class="sub">閉じたアームを入れ、<br>内側からゆっくり広げます。</p>
</div>

<div class="copy" data-t="11.2,19.6">
  <p class="label">UP TO 70mm</p>
  <h2>最大70mmまで、<br>無段階に。</h2>
  <div class="counter"><span class="k">開き幅</span><span id="mm">全閉</span><span id="mmunit">mm</span></div>
  <p class="sub">痛みを感じない、<br>ちょうどいい幅で止められます。</p>
</div>

<div class="copy" data-t="20.2,26.6">
  <p class="label">SELF-LOCK</p>
  <h2>手を離しても、<br>戻らない。</h2>
  <p class="sub">内部の送りねじの力で、その幅に固定。<br>急に閉じることはありません。</p>
</div>

<div class="copy" data-t="27.6,32.6">
  <p class="label">REVERSE TAPER</p>
  <h2>先端が太い、<br>ずれにくいアーム。</h2>
  <p class="sub">根元が細く、先端に向かって太くなる形。<br>肌には幅6mmの面で当たります。</p>
</div>

<div class="copy" data-t="33.5,40.6">
  <p class="label">HOW TO USE</p>
  <h2>使い方は3ステップ。</h2>
  <ol class="steps">
    <li data-t="34.2,99"><span class="n">1</span>クリームやオイルでなじませる</li>
    <li data-t="35.0,99"><span class="n">2</span>閉じたアームを先端から入れる</li>
    <li data-t="35.8,99"><span class="n">3</span>痛くない幅まで、回して開く</li>
  </ol>
  <p class="limit" data-t="37.0,99"><b>1回30分以内</b>・<b>24時間の合計1時間以内</b><br>就寝中は使用しないでください。</p>
</div>

<div class="copy" data-t="41.5,46.4">
  <p class="label">PRIVACY</p>
  <h2>届いても、<br>誰にもわからない。</h2>
  <p class="sub">化粧箱の表記は、背面の「Luca Bloom」だけ。<br>本体は専用のクッション材に収めてお届けします。</p>
</div>

<div class="card" id="title">
  <p class="logo" data-t="0.3,99">Luca Bloom</p>
  <div class="rule" data-t="0.8,99"></div>
  <p class="lead" data-t="1.1,99">包皮が狭い方や匂いが気になる方のための<br>セルフケアツール</p>
</div>

<div class="card" id="outro" style="opacity:0">
  <p class="logo" data-t="47.2,99">Luca Bloom</p>
  <div class="rule" data-t="47.6,99"></div>
  <p class="feat" data-t="47.9,99">最大70mm<span>｜</span>無段階調整<span>｜</span>軽くて冷たくない樹脂製</p>
  <p class="feat" data-t="48.3,99">日本で検品・洗浄・組立<span>｜</span>実用新案出願済み</p>
  <p class="fine" data-t="48.8,99">本製品は雑貨であり、医療機器ではありません。想定使用年齢：18歳以上。</p>
</div>
</body></html>`;

// ---------- ブラウザに渡すファイル ----------
const bundle = await esbuild.build({
  entryPoints: [path.join(import.meta.dirname, 'scene.js')],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
});
const js = bundle.outputFiles[0].contents;
const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(HTML);
  if (p === '/scene.js') return res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(js);
  const f = FONT_FILES[p.replace('/fonts/', '')];
  if (f) return res.writeHead(200, { 'Content-Type': 'font/ttf' }).end(fs.readFileSync(path.join(FONTS, f)));
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('@playwright/test'));
}
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('ページのエラー:', e.message));
await page.goto(url);
// 本体の刻印（CLOSE）はフォントで描くため、フォントを読み込んでから 3D を作る
await page.evaluate(() =>
  Promise.all(['400 10px ZK', '700 10px ZK', '900 10px ZK', '700 10px QS', '700 10px Quicksand', '200 10px MS'].map((f) => document.fonts.load(f))),
);
await page.addStyleTag({
  content: '@font-face{font-family:Quicksand;font-weight:300 700;src:url(/fonts/quicksand.ttf)}@font-face{font-family:Montserrat;font-weight:100 900;src:url(/fonts/montserrat.ttf)}',
});
await page.evaluate(() => Promise.all([document.fonts.load('700 10px Quicksand'), document.fonts.load('200 10px Montserrat')]));
await page.addScriptTag({ url: '/scene.js' });
await page.waitForFunction(() => window.ready === true, null, { timeout: 120_000 });

const frameAt = async (t, type = 'png') => {
  await page.evaluate((s) => window.renderAt(s), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 92 } : {}) });
};

fs.mkdirSync(OUT, { recursive: true });
const stills = arg('stills');
if (stills) {
  for (const s of stills.split(',').map(Number)) {
    fs.writeFileSync(path.join(OUT, `still-${s}.png`), await frameAt(s));
    console.log(`out/still-${s}.png`);
  }
} else {
  // サムネイル（Amazon の動画登録で使う。開き幅70mmの場面）
  fs.writeFileSync(path.join(OUT, 'luca-bloom-thumbnail.jpg'), await frameAt(18.8, 'jpeg'));

  const file = path.join(OUT, 'luca-bloom-amazon.mp4');
  // 無音の音声トラックを付ける（音声なしの動画を受け付けない配信先への対策）
  const ff = spawn(
    FFMPEG,
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', file],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const done = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg 終了コード ${c}`)))));
  const total = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const png = await frameAt(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${i}/${total} コマ（経過 ${el.toFixed(0)}秒、残り約 ${((el / (i + 1)) * (total - i)).toFixed(0)}秒）`);
    }
  }
  ff.stdin.end();
  await done;
  console.log(`完成：out/luca-bloom-amazon.mp4（${(fs.statSync(file).size / 1024 / 1024).toFixed(1)}MB）`);
}
await browser.close();
server.close();
