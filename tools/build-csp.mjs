// 全ページの Content-Security-Policy（CSP：ページが読み込み・実行してよいものの許可リスト）を書き込む。
// ・HTML 内の <style> は、中身の SHA-256 ハッシュ（指紋）で1つずつ許可する（'unsafe-inline' を使わない）。
//   中身が1文字でも変わるとハッシュが変わるため、CSS を編集したら必ず npm run build を実行すること。
// ・node tools/build-csp.mjs --check：書き込まずに、最新でないページがあれば失敗する（CI・npm run check で使用）
//
// Google アナリティクス 4（src/ga.js。日本語のページだけ）を読み込むページは、Google の読み込み先・送信先だけを追加で許可する。
// Trusted Types は外さず、ga.js が作る default ポリシー（Google の計測用ドメインの URL だけ通す）を許可する。
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const check = process.argv.includes('--check');
const files = execFileSync('git', ['ls-files', '*.html'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .concat(['index.html'])
  .filter((f, i, a) => a.indexOf(f) === i && fs.existsSync(f));

const META = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;

// Cloudflare Web Analytics（閲覧数の集計。Cookie を使わない）の計測タグがあるページ（商品ページ・SNS用の中継ページ go/）だけ、
// その読み込み先と送信先を許可する（tools/build-go.mjs・tools/i18n/page.mjs・index.html）
const BEACON = /static\.cloudflareinsights\.com\/beacon\.min\.js/;
const GA = /src="\/assets\/js\/ga\.js"/;
const G_SCRIPT = ' https://www.googletagmanager.com';
const G_SEND = ' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com';

function policy(styleHashes, beacon = false, ga = false) {
  return [
    "default-src 'none'", // 下で許可したもの以外は、すべて読み込まない
    `script-src 'self'${beacon ? ' https://static.cloudflareinsights.com' : ''}${ga ? G_SCRIPT : ''}`, // スクリプトは自サイトのファイルのみ（HTML 内に直接書いたスクリプト・eval は不可）
    `style-src 'self' ${styleHashes.join(' ')}`.trim(),
    `img-src 'self'${ga ? G_SEND : ''}`,
    "font-src 'self'",
    `connect-src 'self'${beacon ? ' https://cloudflareinsights.com' : ''}${ga ? G_SEND : ''}`,
    "manifest-src 'self'",
    "media-src 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    'upgrade-insecure-requests', // http の読み込みを自動で https に
    "require-trusted-types-for 'script'", // innerHTML などへの文字列の直接代入を禁止（DOM 経由の攻撃対策）
    ga ? "trusted-types default goog#html" : "trusted-types 'none'", // GA のページは ga.js の default ポリシーと Google のタグ自身のポリシーだけ
  ].join('; ');
}

let stale = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (!META.test(html)) {
    console.error(`CSP の meta がありません：${f}`);
    process.exitCode = 1;
    continue;
  }
  const hashes = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(
    (m) => `'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`,
  );
  const unique = [...new Set(hashes)];
  const next = html.replace(META, `<meta http-equiv="Content-Security-Policy" content="${policy(unique, BEACON.test(html), GA.test(html))}">`);
  if (next === html) continue;
  stale++;
  if (check) console.error(`CSP が最新ではありません（npm run build を実行してください）：${f}`);
  else fs.writeFileSync(f, next);
}
if (check && stale) process.exitCode = 1;
else console.log(check ? `OK：${files.length}ページの CSP は最新` : `${stale}ページの CSP を更新`);
