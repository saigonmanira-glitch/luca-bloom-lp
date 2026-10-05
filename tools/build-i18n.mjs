// 海外向けページ（/en/・/us/・/mx/・/fr/）を言語ファイル（tools/i18n/locales/*.mjs）から作る。
//   node tools/build-i18n.mjs          … ページを書き出す（npm run build に含む）
//   node tools/build-i18n.mjs --check  … 書き出さずに、最新でないファイルがあれば失敗する（npm run check に含む）
//
// ・各ページの CSP（<meta>）とフォントの指定（fonts:start〜end）は、既存ファイルの値を引き継ぐ
//   （どちらも build-csp.mjs・build-fonts.mjs が更新するため）
// ・日本語版（index.html・privacy.html）の hreflang と言語メニュー、sitemap.xml の多言語部分も、
//   目印（<!-- hreflang:start --> など）の間を書き換える。ここ以外の日本語版の内容には触れない
import fs from 'node:fs';
import path from 'node:path';
import { LOCALES, SITE, alternates, alternateTags } from './i18n/site.mjs';
import { lpHtml, docHtml, langMenu } from './i18n/page.mjs';
import { COUNTRIES, selectorHtml, hubHtml, manualHtml, supportAlternateTags, supportAlternates, SUPPORT_PDFS, SUPPORT_EXTRA_CSS } from './i18n/support.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');
const CSP = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
const FONTS = /<!-- fonts:start[^>]*-->[\s\S]*?<!-- fonts:end -->/;

const files = new Map(); // 相対パス → 内容

// 既存ファイルの CSP とフォント指定を引き継ぐ
function carry(rel, html) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return html;
  const old = fs.readFileSync(p, 'utf8');
  let out = html;
  const csp = old.match(CSP);
  if (csp) out = out.replace(CSP, csp[0]);
  const fonts = old.match(FONTS);
  if (fonts) out = out.replace(FONTS, fonts[0]);
  return out;
}

for (const L of LOCALES) {
  files.set(`${L.dir}index.html`, carry(`${L.dir}index.html`, lpHtml(L)));
  files.set(`${L.dir}privacy.html`, carry(`${L.dir}privacy.html`, docHtml(L, L.privacy, 'privacy.html', 'privacy')));
  if (L.legal) files.set(L.dir + L.legal.file, carry(L.dir + L.legal.file, docHtml(L, L.legal, L.legal.file, null)));
}

// ---------- サポートページ（QR コードの読み込み先 /intl/） ----------
files.set('intl/index.html', carry('intl/index.html', selectorHtml()));
for (const c of COUNTRIES) {
  files.set(`${c.dir}index.html`, carry(`${c.dir}index.html`, hubHtml(c)));
  files.set(`${c.dir}manual.html`, carry(`${c.dir}manual.html`, manualHtml(c)));
}
// 見た目は日本語版のサポートページと共通（jp/support.css に国選択ページ用を足す）
files.set('intl/support.css', `/* tools/build-i18n.mjs が jp/support.css から作る。手で編集しない */\n${fs.readFileSync(path.join(ROOT, 'jp/support.css'), 'utf8')}${SUPPORT_EXTRA_CSS}`);

// ---------- 日本語版：目印の間だけを書き換える ----------
function patch(rel, marker, content) {
  const src = files.get(rel) ?? fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const re = new RegExp(`(<!-- ${marker}:start -->)[\\s\\S]*?(<!-- ${marker}:end -->)`);
  if (!re.test(src)) throw new Error(`${rel} に <!-- ${marker}:start --> 〜 <!-- ${marker}:end --> がありません`);
  files.set(rel, src.replace(re, `$1\n${content}\n$2`));
}
const JA = { lang: 'ja', t: { langLabel: 'Language' } };
patch('index.html', 'hreflang', alternateTags('lp'));
patch('index.html', 'langs', langMenu(JA, 'lp'));
patch('privacy.html', 'hreflang', alternateTags('privacy'));
patch('jp/index.html', 'hreflang', supportAlternateTags('hub'));
patch('jp/manual.html', 'hreflang', supportAlternateTags('manual'));

// ---------- sitemap.xml：多言語ページの部分 ----------
const xmlAlt = (kind) => alternates(kind).map(([h, u]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${u}"/>`).join('');
const today = new Date().toISOString().slice(0, 10);
const oldMap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
// 内容が変わったページは今日の日付、変わっていなければ前回の日付のまま
const relOf = (u) => { const r = u.slice(SITE.length); return r === '' || r.endsWith('/') ? `${r}index.html` : r; };
const changed = (rel) => files.has(rel) && (!fs.existsSync(path.join(ROOT, rel)) || fs.readFileSync(path.join(ROOT, rel), 'utf8') !== files.get(rel));
const lastmod = (u) =>
  changed(relOf(u)) ? today : (oldMap.match(new RegExp(`<loc>${u.replace(/[.?]/g, '\\$&')}</loc><lastmod>([^<]+)</lastmod>`)) || [])[1] || today;
const urls = [];
for (const kind of ['lp', 'privacy']) {
  const seen = new Set();
  for (const [, u] of alternates(kind)) {
    if (seen.has(u)) continue;
    seen.add(u);
    urls.push(`  <url><loc>${u}</loc><lastmod>${lastmod(u)}</lastmod>${xmlAlt(kind)}</url>`);
  }
}
for (const L of LOCALES.filter((x) => x.legal)) {
  const u = SITE + L.dir + L.legal.file;
  urls.push(`  <url><loc>${u}</loc><lastmod>${lastmod(u)}</lastmod></url>`);
}
// サポートページ：入口・マニュアルは hreflang の組、国の選択ページと PDF は単独
for (const kind of ['hub', 'manual']) {
  const alt = supportAlternates(kind).map(([h, u]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${u}"/>`).join('');
  for (const [h, u] of supportAlternates(kind)) {
    if (h === 'ja') continue; // 日本語版は sitemap.xml の手作業の部分に載っている
    urls.push(`  <url><loc>${u}</loc><lastmod>${lastmod(u)}</lastmod>${alt}</url>`);
  }
}
for (const pdf of SUPPORT_PDFS) {
  const u = SITE + pdf;
  urls.push(`  <url><loc>${u}</loc><lastmod>${(oldMap.match(new RegExp(`<loc>${u.replace(/[.?]/g, '\\$&')}</loc><lastmod>([^<]+)</lastmod>`)) || [])[1] || today}</lastmod></url>`);
}
patch('sitemap.xml', 'i18n', urls.join('\n'));

// ---------- 書き出し・確認 ----------
let stale = 0;
for (const [rel, html] of files) {
  const p = path.join(ROOT, rel);
  const old = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (old === html) continue;
  stale++;
  if (check) console.error(`最新ではありません（npm run build を実行してください）：${rel}`);
  else {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, html);
  }
}
if (check && stale) process.exit(1);
console.log(check ? `OK：多言語ページ ${files.size}件は最新` : `${stale}件を更新（多言語ページ ${files.size}件）`);
