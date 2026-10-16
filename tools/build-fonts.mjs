// サイトで使っている文字だけを含む Web フォント（WOFF2）を作り、各ページの <head> に @font-face を書き込む。
// 実行：npm run build:fonts（npm run build でも実行される）
//
// ・元フォントは Google Fonts のリポジトリ（SIL Open Font License）から .cache/fonts/ に取得する
// ・文字はサイト内の全 HTML と src/*.js から集める。文章を変えたら再実行すること
// ・Playwright が使える環境では、実際にページを表示して「どの太さで表示される文字か」を調べ、
//   太さごとに必要な文字だけを収録する（見出し用の太字フォントが小さくなる）。
//   使えない環境では、全ての太さに全ての文字を収録する（表示は同じで、ファイルが大きくなるだけ）
// ・出力：assets/fonts/*.woff2、各 HTML の <!-- fonts:start --> 〜 <!-- fonts:end --> の間

import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import subsetFont from 'subset-font';
import { LOCALES } from './i18n/site.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(ROOT, '.cache/fonts');
const OUT = path.join(ROOT, 'assets/fonts');
const SRC = 'https://raw.githubusercontent.com/google/fonts/main/ofl/';
const JP = 'Zen Kaku Gothic New';

const FONTS = [
  { family: JP, weight: 400, src: 'zenkakugothicnew/ZenKakuGothicNew-Regular.ttf', out: 'zenkaku-400.woff2' },
  { family: JP, weight: 700, src: 'zenkakugothicnew/ZenKakuGothicNew-Bold.ttf', out: 'zenkaku-700.woff2' },
  { family: JP, weight: 900, src: 'zenkakugothicnew/ZenKakuGothicNew-Black.ttf', out: 'zenkaku-900.woff2' },
  // 英字用（可変フォント。500〜700 を1ファイルで）
  { family: 'Quicksand', weight: '500 700', src: 'quicksand/Quicksand%5Bwght%5D.ttf', out: 'quicksand.woff2', latin: true },
  // 化粧箱3Dの背面ロゴ用（「Luca Bloom」の文字だけ、太さ200に固定）
  { family: 'Montserrat', weight: 200, src: 'montserrat/Montserrat%5Bwght%5D.ttf', out: 'montserrat-200.woff2', text: 'Luca Bloom', axes: { wght: 200 } },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, ext, skip) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (skip.some((s) => p.includes(s))) continue;
    if (e.isDirectory()) out.push(...(await listFiles(p, ext, skip)));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

async function source(rel) {
  const file = path.join(CACHE, decodeURIComponent(rel).replace(/\//g, '__'));
  if (!(await exists(file))) {
    const res = await fetch(SRC + rel);
    if (!res.ok) throw new Error(`フォントを取得できません: ${rel} (${res.status})`);
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(file);
}

const SKIP = ['node_modules', '.cache', '.git', 'index.backup.html', 'assets/', '_site', 'out/'];
const pages = await listFiles(ROOT, ['.html'], SKIP);
// 商品ページ（日本語版と各国版）。和文フォントは「商品ページで使う文字」と「それ以外のページだけで使う文字」の2ファイルに分け、
// 後者には unicode-range（そのフォントが受け持つ文字）を付ける。ブラウザは表示する文字を含むファイルだけを取りに行くので、
// 商品ページはコラムなどでしか使わない漢字を読み込まない
const LP_FILES = new Set(['index.html', ...LOCALES.map((L) => `${L.dir}index.html`)].map((f) => path.join(ROOT, f)));
const scripts = await listFiles(path.join(ROOT, 'src'), ['.js'], []);

// ---------- 1. ソースから文字を集める（全ての太さの下限。ASCII は常に含める） ----------
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&(amp|lt|gt|quot|apos|nbsp|copy);/g, (_, n) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©' })[n]);
// 画面に出ない部分（コメント・構造化データ）の文字は含めない
const visible = (src, isJs) =>
  isJs
    ? src.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/[^\n]*/g, '$1')
    : src
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
const add = (set, str) => {
  for (const ch of str) if (ch >= ' ') set.add(ch);
};
const ascii = new Set();
for (let c = 0x20; c < 0x7f; c++) ascii.add(String.fromCharCode(c));
const all = new Set(ascii);
for (const f of pages) add(all, decode(visible(await readFile(f, 'utf8'), false)));
const jsChars = new Set(); // JavaScript が画面に出す文字（どの太さで出るか分からないので全ての太さに入れる）
for (const f of scripts) add(jsChars, decode(visible(await readFile(f, 'utf8'), true)));
for (const c of jsChars) all.add(c);

// ---------- 2. 実際に表示して、太さごとの文字を調べる（Playwright がある場合） ----------
// ページごとに、文字の表示に使っているフォント（先読みの対象）
const usedFonts = new Map();
// 太さごとに、商品ページで表示される文字
const lpChars = {};
async function charsByWeight() {
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
  if (!chromium) return null;
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    try {
      const body = await readFile(path.join(ROOT, p));
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  // CHROMIUM_PATH があればそのブラウザを使う（テストと同じ。playwright.config.mjs 参照）
  const browser = await chromium.launch({
    args: ['--proxy-server=direct://', '--proxy-bypass-list=*'],
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const found = { 400: new Set(), 700: new Set(), 900: new Set() };
  usedFonts.clear();
  for (const w of [400, 700, 900]) lpChars[w] = new Set();
  try {
    for (const width of [375, 1280]) {
      // bypassCSP：CSS を書き換えた直後（CSP の許可値の更新前）でもスタイルを効かせ、文字を正しく集める
      const page = await browser.newPage({ viewport: { width, height: 900 }, javaScriptEnabled: false, bypassCSP: true });
      for (const f of pages) {
        await page.goto(base + '/' + path.relative(ROOT, f).split(path.sep).join('/'));
        // この関数はブラウザ内で実行される（document などはブラウザの変数）
        /* global document, NodeFilter, getComputedStyle */
        const res = await page.evaluate((JP) => {
          const out = { 400: '', 700: '', 900: '', fonts: [] };
          const used = new Set();
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const el = n.parentElement;
            if (!el || el.closest('script,style,noscript')) continue;
            const cs = getComputedStyle(el);
            const w = +cs.fontWeight;
            const first = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
            if (n.textContent.trim()) {
              if (first === 'Quicksand') used.add('quicksand.woff2');
              else if (first === 'Montserrat') used.add('montserrat-200.woff2');
              else if (first === JP) used.add(`zenkaku-${w <= 550 ? 400 : w <= 800 ? 700 : 900}.woff2`);
            }
            if (!cs.fontFamily.includes(JP)) continue;
            out[w <= 550 ? 400 : w <= 800 ? 700 : 900] += n.textContent;
          }
          out.fonts = [...used];
          return out;
        }, JP);
        for (const w of [400, 700, 900]) add(found[w], res[w]);
        if (LP_FILES.has(f)) for (const w of [400, 700, 900]) add(lpChars[w], res[w]);
        if (width === 375) usedFonts.set(f, new Set(res.fonts));
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  return found;
}

const byWeight = await charsByWeight();
const textFor = (f) => {
  if (f.text) return f.text;
  if (f.latin) return [...all].filter((c) => c.codePointAt(0) < 0x2000).join('');
  if (!byWeight) return [...all].join('');
  const s = new Set([...ascii, ...jsChars, ...byWeight[f.weight]]);
  return [...s].join('');
};

// unicode-range の書き方（連続する文字はまとめる）：U+3041-3043,U+4E00,…
const unicodeRange = (chars) => {
  const cps = [...chars].map((c) => c.codePointAt(0)).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < cps.length; i++) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    const h = (n) => n.toString(16).toUpperCase();
    out.push(i === j ? `U+${h(cps[i])}` : `U+${h(cps[i])}-${h(cps[j])}`);
    i = j;
  }
  return out.join(',');
};

// ---------- 3. フォントを作る ----------
await mkdir(OUT, { recursive: true });
const faces = [];
const write = async (f, out, text, range) => {
  const buf = await subsetFont(await source(f.src), text, {
    targetFormat: 'woff2',
    ...(f.axes ? { variationAxes: f.axes } : {}),
  });
  await writeFile(path.join(OUT, out), buf);
  console.log(`${out.padEnd(22)} ${String([...text].length).padStart(4)} 文字  ${(buf.length / 1024).toFixed(1)} KB`);
  faces.push(`@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(/assets/fonts/${out}) format("woff2")${range ? `;unicode-range:${range}` : ''}}`);
};
const splitJP = byWeight && Object.keys(lpChars).length;
for (const f of FONTS) {
  const text = textFor(f);
  if (f.family !== JP || !splitJP) {
    await write(f, f.out, text);
    continue;
  }
  // 商品ページ用：英数字・記号（U+2000 未満）と、JavaScript が出す文字と、商品ページに出る文字
  const main = new Set([...text].filter((c) => c.codePointAt(0) < 0x2000 || jsChars.has(c) || lpChars[f.weight].has(c)));
  const rest = new Set([...text].filter((c) => !main.has(c)));
  await write(f, f.out, [...main].join(''));
  if (rest.size) await write(f, f.out.replace('.woff2', '-x.woff2'), [...rest].join(''), unicodeRange(rest));
}
if (!byWeight) console.log('※ Playwright が無いため、太さごとの絞り込みは行っていません');

// ---------- 4. 各ページの <head> に @font-face と、そのページで使うフォントの先読みを書き込む（マーカーの間を置き換え） ----------
// 先読み（preload）：フォントを HTML の読み込み直後から取りに行き、最初のレイアウトから Web フォントで組む。
// 代わりのフォントで一度組んでから組み直す二度手間がなくなり、最初のレイアウトの時間が約5分の1になる（2026-10-16 計測：520ms → 110ms）
const ORDER = FONTS.map((f) => f.out);
const block = (f) => {
  const pre = [...(usedFonts.get(f) || [])]
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((o) => `<link rel="preload" href="/assets/fonts/${o}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');
  return `<!-- fonts:start （tools/build-fonts.mjs が生成。手で編集しない） -->\n${pre ? `${pre}\n` : ''}<style>${faces.join('')}</style>\n<!-- fonts:end -->`;
};
const re = /<!-- fonts:start[^>]*-->[\s\S]*?<!-- fonts:end -->/;
let n = 0;
for (const f of pages) {
  const html = await readFile(f, 'utf8');
  if (!re.test(html)) continue;
  await writeFile(f, html.replace(re, block(f)));
  n++;
}
console.log(`${n} ページに書き込み`);
