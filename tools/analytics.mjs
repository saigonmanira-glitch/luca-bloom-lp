// アクセス集計：Cloudflare Web Analytics（無料。Cookie など端末への保存を使わず、閲覧者を個別に識別しない）。
// トークンは Cloudflare の Web Analytics でサイトを追加すると表示される、公開して問題ない識別子。
// 計測タグを入れるのは、商品ページ（日本語版・各国版）と SNS用の中継ページ（go/）だけ。
// タグのあるページだけ、CSP で読み込み先・送信先を許可する（tools/build-csp.mjs）。
// プライバシーポリシー（privacy.html・tools/i18n/locales/*.mjs）にも記載している。
export const CF_TOKEN = 'f84e8a91cd1443f0ba481943c1bf1e02';
export const BEACON = CF_TOKEN
  ? `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_TOKEN}"}'></script>`
  : '';
