// Luca Bloom LP：ページ全体の動き（スライダー表示・購入バー・3Dの読み込み・アクセス解析）
// ビルド：npm run build（esbuild で assets/js/ に出力）

// ---------- アクセス解析（Google アナリティクス 4） ----------
// 測定ID（G-から始まる文字列）を入れると計測が始まる。空欄の間は何も読み込まない。
// 有効にする際は privacy.html の「5. アクセス解析ツール・外部サービス」と、tools/build-csp.mjs の
// CSP（Google のドメインの許可・Trusted Types の解除。ファイル冒頭の説明を参照）も更新すること。
const GA_ID = '';

function initAnalytics() {
  if (!GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  // Amazon への購入ボタンのクリックを計測（どのボタンか location で区別。英語版は UK・豪州の2種類）
  document.querySelectorAll('a[href*="www.amazon."]').forEach((a, i) => {
    a.addEventListener('click', () => {
      const where = a.closest('#bar') ? 'sticky_bar' : `button_${i + 1}`;
      window.gtag('event', 'click_buy', { location: where, store: new URL(a.href).hostname, transport_type: 'beacon' });
    });
  });
}

// ---------- 開き幅スライダー ----------
// target / current = アームの移動量(mm) 0〜60。開き幅 = 10 + 移動量
// 表示の言葉はページの言語（<html lang>）で切り替える。全閉の表示はページ内の初期表示（#gapv）と同じ語にする
const LANG = document.documentElement.lang;
const TEXT = {
  ja: { closed: '全閉', value: (v) => `開き幅 ${v}ミリ` },
  'en-GB': { closed: 'Closed', value: (v) => `Opening width ${v} millimetres` },
  'en-US': { closed: 'Closed', value: (v) => `Opening width ${v} millimeters` },
  'es-MX': { closed: 'Cerrado', value: (v) => `Apertura de ${v} milímetros` },
  'fr-FR': { closed: 'Fermé', value: (v) => `Écartement de ${v} millimètres` },
}[LANG] || { closed: 'Closed', value: (v) => `Opening width ${v} millimetres` };

function createState() {
  const slider = document.getElementById('gap');
  const out = document.getElementById('gapv');
  const state = {
    slider,
    target: 0,
    current: 0,
    demo: true,
    kick() {},
    show(travel) {
      const v = Math.round(10 + travel); // 表示は1mm刻み
      slider.setAttribute('aria-valuetext', v <= 10 ? TEXT.closed : TEXT.value(v)); // 読み上げ用
      if (v <= 10) {
        out.textContent = TEXT.closed;
      } else {
        out.textContent = String(v);
        const unit = document.createElement('small');
        unit.textContent = 'mm';
        out.appendChild(unit);
      }
    },
  };
  slider.addEventListener('input', () => {
    state.demo = false;
    state.target = parseFloat(slider.value) - 10;
    state.show(state.target);
    state.kick();
  });
  return state;
}

// ---------- 画面下の購入バー：購入ボタンが見えている間は隠す ----------
function initBuyBar() {
  const bar = document.getElementById('bar');
  if (!bar || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
    });
    bar.classList.toggle('hide', visible.size > 0);
  });
  document.querySelectorAll('.js-buy').forEach((el) => io.observe(el));
}

// ---------- 3D（three.js）の読み込み ----------
// 3Dはページ最上部にあるため、ページの読み込み完了（load）後に読み込む。
// 読み込みに失敗した場合・WebGLが使えない場合は静止画のまま。
function loadScene(state) {
  import('./scene.js')
    .then((m) => m.initScenes(state))
    .catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  const state = createState();
  initBuyBar();
  initAnalytics();
  if (document.readyState === 'complete') loadScene(state);
  else window.addEventListener('load', () => loadScene(state), { once: true });
});
