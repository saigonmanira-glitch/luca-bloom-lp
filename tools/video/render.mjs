// Amazon 商品動画（MP4・1920×1080・30fps・H.264）を作る。
//   npm run video                    → out/luca-bloom-amazon.mp4 と out/luca-bloom-thumbnail.jpg
//   npm run video -- --stills 5,15   → 指定した秒の静止画だけ out/still-*.png に書き出す（確認用）
//   npm run video -- --lang en       → 英国・オーストラリア向けの英語版 out/luca-bloom-amazon-en.mp4（BGM は python3 tools/video/audio.py out/luca-bloom-amazon-en.mp4）
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

// ---------- 言語（--lang en：英国・豪州・カナダ英語、us：米国、fr：カナダ・フランス語、es：メキシコ。既定は日本語） ----------
// 英語版の表現は海外LPと同じ決まり（病名・効果・比較・価格・「限定」を入れない。英国式のつづり）
const LANG = arg('lang') || 'ja';
const ALL = {
  ja: {
    html: 'ja', note: '※画像は3Dモデルです', film: 'ピンクの膜は狭い穴のイメージ',
    easyH: 'ハンドルを<br>回すだけ。', easyS: '閉じたアームを入れ、<br>内側からゆっくり広げます。',
    mmH: '最大70mmまで、<br>無段階に。', mmK: '開き幅', closed: '全閉', mmS: '痛みを感じない、<br>ちょうどいい幅で止められます。',
    lockH: '手を離しても、<br>戻らない。', lockS: '内部の送りねじの力で、その幅に固定。<br>急に閉じることはありません。',
    taperH: '先端が太い、<br>ずれにくいアーム。', taperS: '根元が細く、先端に向かって太くなる形。<br>肌には幅6mmの面で当たります。',
    howH: '使い方は3ステップ。', steps: ['クリームやオイルでなじませる', '閉じたアームを先端から入れる', '痛くない幅まで、回して開く'],
    limit: '<b>1回30分以内</b>・<b>24時間の合計1時間以内</b><br>就寝中は使用しないでください。',
    privH: '届いても、<br>誰にもわからない。', privS: '化粧箱の表記は、背面の「Luca Bloom」だけ。<br>本体は専用のクッション材に収めてお届けします。',
    lead: '包皮が狭い方や匂いが気になる方のための<br>セルフケアツール',
    feat1: '最大70mm<span>｜</span>無段階調整<span>｜</span>軽くて冷たくない樹脂製',
    feat2: '日本で検品・洗浄・組立<span>｜</span>実用新案出願済み',
    fine: '本製品は雑貨であり、医療機器ではありません。想定使用年齢：18歳以上。',
  },
  en: {
    html: 'en-GB', note: 'Images are 3D models.', film: 'The pink film shows a narrow opening',
    easyH: 'Just turn<br>the handle.', easyS: 'Insert the closed arms,<br>then open them slowly from inside.',
    mmH: 'Up to 70 mm,<br>stepless.', mmK: 'Opening', closed: 'Closed', mmS: 'Stop at a comfortable width<br>that does not hurt.',
    lockH: 'Let go,<br>and it stays.', lockS: 'The internal lead screw holds it at that width.<br>It never snaps shut.',
    taperH: 'Wider tips,<br>shaped not to slip.', taperS: 'Narrow at the base, wider towards the tip.<br>A 6 mm flat face rests against the skin.',
    howH: 'Three simple steps.', steps: ['Apply cream or oil', 'Insert the closed arms, tips first', 'Turn to open, only as far as is comfortable'],
    limit: '<b>30 minutes at most per session</b> · <b>1 hour in total per 24 hours</b><br>Do not use while asleep.',
    privH: 'Nobody will know<br>what arrived.', privS: 'The box only says “Luca Bloom” on the back.<br>The device ships in a fitted cushioned insert.',
    lead: 'A self-care tool for anyone<br>whose foreskin feels tight',
    feat1: 'Up to 70 mm<span>|</span>Stepless<span>|</span>Light resin, not cold to the touch',
    feat2: 'Inspected, cleaned and assembled in Japan<span>|</span>Japanese utility model application filed',
    fine: 'Luca Bloom is not a medical device. For adults aged 18 and over.',
  },
  // カナダ（フランス語）。約物：コロンの前・« » の内側に改行しない空白
  fr: {
    html: 'fr-CA', note: 'Images de modèles 3D.', film: 'Le voile rose représente une ouverture étroite',
    easyH: 'Il suffit de tourner<br>la molette.', easyS: 'Insérez les bras fermés,<br>puis écartez-les lentement de l’intérieur.',
    mmH: 'Jusqu’à 70 mm,<br>sans paliers.', mmK: 'Écartement', closed: 'Fermé', mmS: 'Arrêtez-vous à un écartement<br>confortable, sans douleur.',
    lockH: 'Lâchez :<br>il reste en place.', lockS: 'La vis-mère interne le maintient à cet écartement.<br>Il ne se referme jamais brusquement.',
    taperH: 'Des extrémités larges,<br>conçues pour ne pas glisser.', taperS: 'Étroits à la base, plus larges vers l’extrémité.<br>Une face plane de 6 mm repose sur la peau.',
    howH: 'Trois étapes simples.', steps: ['Appliquez une crème ou une huile', 'Insérez les bras fermés, extrémités d’abord', 'Tournez pour ouvrir, sans dépasser le confort'],
    limit: '<b>30 minutes au plus par séance</b> · <b>1 heure au total par 24 heures</b><br>N’utilisez pas le produit pendant le sommeil.',
    privH: 'Personne ne saura<br>ce que vous avez reçu.', privS: 'La boîte ne porte que « Luca Bloom » au dos.<br>Le dispositif est livré dans un calage ajusté.',
    lead: 'Un outil de soin personnel<br>pour un prépuce qui semble serré',
    feat1: 'Jusqu’à 70 mm<span>|</span>Sans paliers<span>|</span>Résine légère, pas froide au toucher',
    feat2: 'Inspecté, nettoyé et assemblé au Japon<span>|</span>Demande de modèle d’utilité déposée au Japon',
    fine: 'Luca Bloom n’est pas un instrument médical. Réservé aux adultes de 18 ans et plus.',
  },
  // メキシコ（スペイン語）。LP と同じく「tú」
  es: {
    html: 'es-MX', note: 'Las imágenes son modelos 3D.', film: 'La película rosa representa una abertura estrecha',
    easyH: 'Solo gira<br>la manija.', easyS: 'Introduce los brazos cerrados<br>y ábrelos despacio desde dentro.',
    mmH: 'Hasta 70 mm,<br>ajuste continuo.', mmK: 'Apertura', closed: 'Cerrado', mmS: 'Detente en una apertura cómoda<br>que no duela.',
    lockH: 'Suéltala<br>y se queda.', lockS: 'El tornillo interno la mantiene en esa apertura.<br>Nunca se cierra de golpe.',
    taperH: 'Puntas más anchas,<br>pensadas para no resbalar.', taperS: 'Delgados en la base, más anchos hacia la punta.<br>Una cara plana de 6 mm apoya sobre la piel.',
    howH: 'Tres pasos sencillos.', steps: ['Aplica crema o aceite', 'Introduce los brazos cerrados, punta primero', 'Gira para abrir, solo hasta donde sea cómodo'],
    limit: '<b>Máximo 30 minutos por sesión</b> · <b>1 hora en total cada 24 horas</b><br>No la uses mientras duermes.',
    privH: 'Nadie sabrá<br>qué te llegó.', privS: 'La caja solo dice “Luca Bloom” en la parte trasera.<br>La herramienta viaja en un acolchado a la medida.',
    lead: 'Una herramienta de autocuidado<br>para quienes sienten el prepucio apretado',
    feat1: 'Hasta 70 mm<span>|</span>Ajuste continuo<span>|</span>Resina ligera, no se siente fría',
    feat2: 'Revisado, limpiado y ensamblado en Japón<span>|</span>Solicitud de modelo de utilidad presentada en Japón',
    fine: 'Luca Bloom no es un dispositivo médico. Solo para mayores de 18 años.',
  },
};
// 米国：英語版を米国式のつづりに
ALL.us = { ...ALL.en, html: 'en-US', taperS: ALL.en.taperS.replace('towards', 'toward') };
// フランス語の約物をそろえる
const nb = (v) => (typeof v === 'string' ? v.replace(/ :/g, '\u00a0:').replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»') : Array.isArray(v) ? v.map(nb) : v);
ALL.fr = Object.fromEntries(Object.entries(ALL.fr).map(([k, v]) => [k, nb(v)]));
const TEXT = ALL[LANG];
if (!TEXT) {
  console.error(`対応していない言語：${LANG}（ja・en・us・fr・es）`);
  process.exit(1);
}
const SUFFIX = LANG === 'ja' ? '' : `-${LANG}`;

// ---------- 画面（文字の表示時刻は data-t="開始,終了" 秒） ----------
const HTML = `<!DOCTYPE html><html lang="${TEXT.html}"><head><meta charset="utf-8"><title>video</title><style>
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
<p class="note" data-t="3.8,46.6">${TEXT.note}</p>
<p class="film" data-t="4.4,26.6"><i></i>${TEXT.film}</p>
<p class="film" data-t="33.8,40.6"><i></i>${TEXT.film}</p>

<div class="copy" data-t="4.0,10.6">
  <p class="label">EASY</p>
  <h2>${TEXT.easyH}</h2>
  <p class="sub">${TEXT.easyS}</p>
</div>

<div class="copy" data-t="11.2,19.6">
  <p class="label">UP TO 70mm</p>
  <h2>${TEXT.mmH}</h2>
  <div class="counter"><span class="k">${TEXT.mmK}</span><span id="mm" data-closed="${TEXT.closed}">${TEXT.closed}</span><span id="mmunit">mm</span></div>
  <p class="sub">${TEXT.mmS}</p>
</div>

<div class="copy" data-t="20.2,26.6">
  <p class="label">SELF-LOCK</p>
  <h2>${TEXT.lockH}</h2>
  <p class="sub">${TEXT.lockS}</p>
</div>

<div class="copy" data-t="27.6,32.6">
  <p class="label">REVERSE TAPER</p>
  <h2>${TEXT.taperH}</h2>
  <p class="sub">${TEXT.taperS}</p>
</div>

<div class="copy" data-t="33.5,40.6">
  <p class="label">HOW TO USE</p>
  <h2>${TEXT.howH}</h2>
  <ol class="steps">
    <li data-t="34.2,99"><span class="n">1</span>${TEXT.steps[0]}</li>
    <li data-t="35.0,99"><span class="n">2</span>${TEXT.steps[1]}</li>
    <li data-t="35.8,99"><span class="n">3</span>${TEXT.steps[2]}</li>
  </ol>
  <p class="limit" data-t="37.0,99">${TEXT.limit}</p>
</div>

<div class="copy" data-t="41.5,46.4">
  <p class="label">PRIVACY</p>
  <h2>${TEXT.privH}</h2>
  <p class="sub">${TEXT.privS}</p>
</div>

<div class="card" id="title">
  <p class="logo" data-t="0.3,99">Luca Bloom</p>
  <div class="rule" data-t="0.8,99"></div>
  <p class="lead" data-t="1.1,99">${TEXT.lead}</p>
</div>

<div class="card" id="outro" style="opacity:0">
  <p class="logo" data-t="47.2,99">Luca Bloom</p>
  <div class="rule" data-t="47.6,99"></div>
  <p class="feat" data-t="47.9,99">${TEXT.feat1}</p>
  <p class="feat" data-t="48.3,99">${TEXT.feat2}</p>
  <p class="fine" data-t="48.8,99">${TEXT.fine}</p>
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
    fs.writeFileSync(path.join(OUT, `still${SUFFIX}-${s}.png`), await frameAt(s));
    console.log(`out/still${SUFFIX}-${s}.png`);
  }
} else {
  // サムネイル（Amazon の動画登録で使う。開き幅70mmの場面）
  fs.writeFileSync(path.join(OUT, `luca-bloom-thumbnail${SUFFIX}.jpg`), await frameAt(18.8, 'jpeg'));

  const file = path.join(OUT, `luca-bloom-amazon${SUFFIX}.mp4`);
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
  console.log(`完成：out/luca-bloom-amazon${SUFFIX}.mp4（${(fs.statSync(file).size / 1024 / 1024).toFixed(1)}MB）`);
}
await browser.close();
server.close();
