// 公開するファイルだけを _site/ に集める（GitHub Pages の公開用。.github/workflows/pages.yml が実行する）
//   node tools/build-site.mjs
// リポジトリには制作用のファイル（tools/・tests/・src/・amazon/・SNS の原稿や AI への指示文・README など）も入っているが、
// サイトとして公開するのは下の「許可リスト」に載ったものだけにする。載っていないものは公開されない（安全側に倒す）。
import fs from 'node:fs';
import path from 'node:path';
import { HEADERS_FILE } from '../worker/src/headers.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '_site');

// ルート直下で公開するファイル
const FILES = [
  'index.html',
  '404.html',
  'privacy.html',
  'favicon.svg',
  'apple-touch-icon.png',
  'og.png',
  'hero-fallback.webp',
  'hero-fallback-700.webp',
  'asm-fallback.webp', // 構造の欄の静止画（3D を出さない端末・読み込み前）。tools/build-assembly-still.mjs
  'asm-fallback-700.webp',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'CNAME',
  '0439b1ed56414d799f461aba86902a1c.txt', // 検索エンジンの所有権確認用
  '.well-known/security.txt',
];
// フォルダごと公開するもの（中の、下の拡張子のファイルだけ）
const DIRS = {
  assets: ['.js', '.woff2'],
  column: ['.html', '.css', '.svg', '.webp', '.png', '.jpg'],
  jp: ['.html', '.css', '.js', '.pdf', '.png', '.webp', '.svg'],
  en: ['.html', '.png', '.webp', '.svg', '.jpg'],
  us: ['.html', '.png', '.webp', '.svg', '.jpg'],
  ca: ['.html', '.png', '.webp', '.svg', '.jpg'],
  mx: ['.html', '.png', '.webp', '.svg', '.jpg'],
  intl: ['.html', '.css', '.pdf', '.png', '.webp', '.svg'],
  go: ['.html', '.js', '.png'],
  'base-shop': ['.css', '.svg', '.mp4', '.jpg'], // BASE のショップのテンプレートが読み込む
  sns: ['.jpg', '.png', '.svg', '.mp4'], // SNS の投稿 API に渡す画像（公開URLが必要）。原稿・指示文（.md・.json・.txt）は公開しない
};

const copy = (rel) => {
  const to = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, rel), to);
};
const walk = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.posix.join(dir, e.name);
    return e.isDirectory() ? walk(rel) : [rel];
  });

fs.rmSync(OUT, { recursive: true, force: true });
let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`公開するファイルがありません：${f}`);
  copy(f);
  n++;
}
for (const [dir, exts] of Object.entries(DIRS)) {
  for (const f of walk(dir)) {
    if (!exts.includes(path.extname(f).toLowerCase())) continue;
    copy(f);
    n++;
  }
}
// Cloudflare（worker/）で配信するときの安全設定・キャッシュの設定。中身は worker/src/headers.js と共通
fs.writeFileSync(
  path.join(OUT, '_headers'),
  `${HEADERS_FILE}/assets/js/chunks/*\n  cache-control: public, max-age=31536000, immutable\n`,
);
console.log(`_site/ に ${n} ファイル`);
