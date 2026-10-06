// SNSのプロフィールに貼る「中継URL」（luca-bloom.com/go/<媒体>/）を作る。
// 開くと約0.8秒後に Amazon の商品ページへ移動する(go/go.js。計測スクリプトが読み込まれる時間を確保するため)。媒体ごとにURLを分けることで、
// どのSNSから何人が Amazon へ移動したかを、Cloudflare Web Analytics（無料のアクセス集計）で数えられる。
//
// 集計を有効にするには、Cloudflare の Web Analytics でサイトを追加し、表示されたトークン（公開して問題ない識別子）を
// CF_TOKEN に入れて npm run build を実行する。トークンが空の間は、移動だけ行い集計はしない。
// リンクを貼ったときの画像は go/og-amazon.png(白基調・1200×630)。
// 外部の計測スクリプトを読み込むのはこの中継ページだけで、他のページの CSP は変えない（tools/build-csp.mjs）。
import fs from 'node:fs';
import path from 'node:path';

export const CF_TOKEN = 'f84e8a91cd1443f0ba481943c1bf1e02';
const AMAZON = 'https://www.amazon.co.jp/dp/B0HHXQ1X4C';
export const CHANNELS = ['instagram', 'threads', 'facebook', 'x', 'note'];

const ROOT = path.resolve(import.meta.dirname, '..');
const beacon = CF_TOKEN
  ? `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_TOKEN}"}'></script>\n`
  : '';

for (const ch of CHANNELS) {
  const url = `https://luca-bloom.com/go/${ch}/`;
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="noindex">
<title>Amazonへ移動｜Luca Bloom（ルカブルーム）の商品ページ</title>
<meta name="description" content="Amazonへ移動します。包皮がきつい方のためのセルフケアツール「Luca Bloom（ルカブルーム）」のAmazon商品ページです。">
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Luca Bloom">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="Amazonへ移動｜Luca Bloom（ルカブルーム）の商品ページ">
<meta property="og:description" content="Amazonへ移動します。包皮がきつい方のためのセルフケアツール「Luca Bloom」のAmazon商品ページです。">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://luca-bloom.com/go/og-amazon.png">
<meta property="og:image:alt" content="Luca Bloom：Amazonへ移動">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Amazonへ移動｜Luca Bloom（ルカブルーム）の商品ページ">
<meta name="twitter:description" content="Amazonへ移動します。包皮がきつい方のためのセルフケアツール「Luca Bloom」のAmazon商品ページです。">
<meta name="twitter:image" content="https://luca-bloom.com/go/og-amazon.png">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;color:#1A1E2C;font-family:"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP",Meiryo,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
.logo{font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif;font-weight:600;font-size:22px;letter-spacing:.06em;color:#161A29;margin:0 0 16px}
p{margin:0 0 20px;font-size:15px;line-height:1.8;color:#3E4352}
a{display:inline-block;background:#161A29;color:#FFFFFF;font-weight:700;text-decoration:none;border-radius:999px;padding:12px 24px}
a:focus-visible{outline:2px solid #E3B34E;outline-offset:3px}
</style>
${beacon}<script defer src="/go/go.js"></script>
</head>
<body>
<main>
<p class="logo">Luca Bloom</p>
<p>Amazonへ移動しています。</p>
<a id="go" href="${AMAZON}" rel="sponsored">Amazonで見る</a>
</main>
</body>
</html>
`;
  const dir = path.join(ROOT, 'go', ch);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
fs.writeFileSync(path.join(ROOT, 'go', 'go.js'),
  "// 中継ページ：計測スクリプトの読み込みを待ってから、リンク先(Amazon)へ移動する\n" +
  "/* global document, setTimeout, location */\n" +
  "const a = document.getElementById('go');\n" +
  "if (a) setTimeout(() => location.replace(a.href), 800);\n");
console.log(`中継ページ：${CHANNELS.map((c) => `/go/${c}/`).join(' ')}${CF_TOKEN ? '（集計あり）' : '（集計なし：CF_TOKEN が空）'}`);
