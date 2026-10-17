// Google アナリティクス 4（日本語のページだけで読み込む：トップ・コラム・サポート）
// 海外のページでは使わない（英国・カナダ〈ケベック州〉などは Cookie を使う計測に事前の同意が必要なため。海外は Cookie を使わない Cloudflare Web Analytics のみ）
// 読み込むページの CSP は tools/build-csp.mjs が Google の送信先だけを追加で許可する。privacy.html の「5.」に記載
const ID = 'G-24CWN0WMTW';

// Trusted Types（DOM 経由の攻撃対策）は外さない。Google のタグが読み込むスクリプトの URL を、Google の計測用ドメインだけに限って通す
const GOOGLE = /^https:\/\/(www\.googletagmanager\.com|([a-z0-9-]+\.)*google-analytics\.com)\//;
if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
  window.trustedTypes.createPolicy('default', {
    createScriptURL(url) {
      if (GOOGLE.test(new URL(url, location.href).href)) return url;
      throw new TypeError(`読み込みを拒否：${url}`);
    },
  });
}

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments); // Google の仕様どおり arguments をそのまま渡す
}
gtag('js', new Date());
gtag('config', ID);
const s = document.createElement('script');
s.async = true;
s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
document.head.append(s);

// 購入リンクのクリック（click_buy）：どの店（Amazon・公式ショップ）か、ページのどこ（ヒーロー・最後・画面下のバー）か
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element && e.target.closest('a[href]');
  if (!a) return;
  const host = new URL(a.href).hostname;
  const store = /(^|\.)amazon\./.test(host) ? 'amazon' : host === 'shop.luca-bloom.com' ? 'official_shop' : '';
  if (!store) return;
  const where = a.closest('#bar') ? 'sticky_bar' : a.closest('.hero') ? 'hero' : a.closest('.final') ? 'final' : 'other';
  gtag('event', 'click_buy', { store, link_location: where, transport_type: 'beacon' });
});
