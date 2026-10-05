// 公開ファイルの静的チェック（ブラウザ不要）
// ・サイト内リンクと画像・CSS・JSの参照先が存在するか
// ・全ページに title / description / canonical があるか
// ・sitemap.xml のURLがすべて実在するか
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://luca-bloom.com/';
const pages = ['index.html', 'privacy.html', '404.html']
  .concat(fs.readdirSync(path.join(ROOT, 'jp')).filter((f) => f.endsWith('.html')).map((f) => `jp/${f}`))
  .concat(['en', 'us', 'mx', 'fr'].flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.html')).map((f) => `${d}/${f}`)))
  .concat(fs.readdirSync(path.join(ROOT, 'column')).filter((f) => f.endsWith('.html')).map((f) => `column/${f}`));

const errors = [];
const exists = (rel) => {
  let p = rel.split(/[?#]/)[0];
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return fs.existsSync(path.join(ROOT, p));
};

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(ref)) {
      if (ref.startsWith(SITE) && !exists(ref.slice(SITE.length))) errors.push(`${page}: ${ref} が存在しません`);
      continue;
    }
    const rel = ref.startsWith('/') ? ref.slice(1) : path.posix.join(path.posix.dirname(page), ref);
    if (!exists(path.posix.normalize(rel))) errors.push(`${page}: ${ref} が存在しません`);
  }
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${page}: title がありません`);
  if (page !== '404.html') {
    if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${page}: description がありません`);
    if (!/<link rel="canonical" href="https:\/\/luca-bloom\.com\//.test(html)) errors.push(`${page}: canonical がありません`);
  }
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  if (!url.startsWith(SITE) || !exists(url.slice(SITE.length))) errors.push(`sitemap.xml: ${url} が存在しません`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK：${pages.length}ページ、リンク・参照先・メタ情報・sitemap に問題なし`);
