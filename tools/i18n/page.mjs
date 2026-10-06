// 海外向けページの HTML を、言語ファイル（locales/*.mjs）の文章から組み立てる。
// 構成・デザイン・3D は全言語共通。CSP（<meta>）とフォント（fonts:start〜end）は、後で
// tools/build-csp.mjs・tools/build-fonts.mjs が書き込むため、ここでは仮の値を入れておく。
import fs from 'node:fs';
import path from 'node:path';
import { MENU, SITE, alternateTags } from './site.mjs';
import { COUNTRIES, supportLink } from './support.mjs';
import { columnLink, columnName } from './columns.mjs';
import { WAITLIST } from './waitlist.mjs';

const DIR = import.meta.dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');

// 言語メニュー（JavaScript を使わない開閉メニュー）。商品ページ・文書ページ共通の見た目
const LANG_CSS = `.langs{position:relative;background:none;margin:0;border-radius:0}
.langs summary{list-style:none;cursor:pointer;padding:4px 26px 4px 12px;font-family:var(--font-en);font-weight:600;font-size:12.5px;line-height:1.6;color:var(--on-navy);border:1px solid var(--navy-line);border-radius:99px;position:relative}
.langs summary::-webkit-details-marker{display:none}
.langs summary::before{content:none}
.langs summary::after{content:"";position:absolute;right:11px;top:50%;width:6px;height:6px;margin-top:-5px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);transition:none}
.langs[open] summary::after{transform:rotate(-135deg);margin-top:-1px;top:50%}
.langs ul{position:absolute;right:0;top:calc(100% + 8px);z-index:40;margin:0;padding:6px;list-style:none;background:var(--white);border-radius:12px;box-shadow:0 14px 34px rgba(0,0,0,.35);min-width:220px}
.langs a{display:block;padding:9px 12px;border-radius:8px;color:var(--ink);text-decoration:none;font-size:14px;line-height:1.4;font-family:var(--font-jp)}
.langs a:hover{background:var(--ivory)}
.langs a[aria-current]{font-weight:700;background:#F1EEE6}
`;
export const LP_CSS = read('lp.css') + LANG_CSS;
export const DOC_CSS = read('doc.css') + LANG_CSS;
const SPRITE = read('parts/sprite.frag');
const BOX_FB = read('parts/box-fallback.frag');
const FONTS_PLACEHOLDER = '<!-- fonts:start -->\n<!-- fonts:end -->';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check22 = '<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#161A29"/><path d="M6.5 11.2l3 3 6-6.4" fill="none" stroke="#E3B34E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check20 = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="#E3B34E" stroke-width="1.6"/><path d="M6 10.2l2.6 2.6L14 7.4" fill="none" stroke="#E3B34E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// テキスト（HTML を含まない）から、構造化データ用の素の文字列を作る
const plain = (s) => String(s).replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

export function langMenu(L, kind) {
  const file = kind === 'privacy' ? 'privacy.html' : '';
  const items = MENU.map(
    (m) =>
      `<li><a href="/${m.dir}${file}" hreflang="${m.lang}" lang="${m.lang}"${m.lang === L.lang ? ' aria-current="page"' : ''}>${m.label}</a></li>`,
  ).join('');
  return `<details class="langs"><summary>${L.t.langLabel}</summary><ul>${items}</ul></details>`;
}

// Facebook などに「ほかの言語版もある」と伝える（自分以外の全言語）
const OG_LOCALES = ['ja_JP', 'en_GB', 'en_AU', 'en_US', 'en_CA', 'fr_CA', 'es_MX'];

function head(L, { title, description, ogDescription = description, canonical, kind, ogType, extraLd = [] }) {
  const og = `${SITE}${L.dir}og.png`;
  return `<!DOCTYPE html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${kind ? alternateTags(kind) + '\n' : ''}<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#161A29">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Luca Bloom">
<meta property="og:locale" content="${L.ogLocale}">
${OG_LOCALES.filter((o) => o !== L.ogLocale).map((o) => `<meta property="og:locale:alternate" content="${o}">\n`).join('')}<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(ogDescription)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(L.t.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:image" content="${og}">
${extraLd.map(ld).join('\n')}
${FONTS_PLACEHOLDER}`;
}

const organization = (url) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Luca Bloom',
  url,
  logo: `${SITE}apple-touch-icon.png`,
  email: 'lucabloom65@gmail.com',
  address: { '@type': 'PostalAddress', postalCode: '106-0032', addressRegion: 'Tokyo', addressLocality: 'Minato-ku', streetAddress: 'S-Building 3F, 2-1-19 Roppongi', addressCountry: 'JP' },
});

// ---------------- 商品ページ ----------------
export function lpHtml(L) {
  const t = L.t;
  const url = SITE + L.dir;
  // 発売前の国（L.waitlist）は、購入ボタンの代わりに発売通知のメールボタンと、目標までの残り件数を出す
  const w = L.waitlist;
  const buttons = (cls) =>
    w ? `      <a class="cta${cls}" href="${esc(w.href)}">${w.cta}\n        ${arrow}</a>`
      : L.stores
        .map((s, i) => `      <a class="cta${i ? ' cta-2' : ''}${cls}" href="${s.href}" target="_blank" rel="noopener sponsored">${s.cta}\n        ${arrow}</a>`)
        .join('\n');
  const barButtons = w ? `<a class="cta" href="${esc(w.href)}" aria-label="${esc(w.cta)}">${w.short}</a>`
    : L.stores
      .map((s, i) => `<a class="cta${i ? ' cta-2' : ''}" href="${s.href}" target="_blank" rel="noopener sponsored"${s.short !== s.cta ? ` aria-label="${esc(s.cta)}"` : ''}>${s.short}</a>`)
      .join('\n    ');
  const wlDate = new Intl.DateTimeFormat(L.lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(WAITLIST.updated));
  const waitlistBox = (full) =>
    w ? `      <div class="wl">
        <p class="wl-h">${w.head(WAITLIST.target - WAITLIST.count)}</p>
        <progress class="wl-bar" max="${WAITLIST.target}" value="${WAITLIST.count}" aria-label="${esc(w.progress(WAITLIST.count, WAITLIST.target))}">${w.progress(WAITLIST.count, WAITLIST.target)}</progress>
        <p class="wl-n"><span>${w.progress(WAITLIST.count, WAITLIST.target)}</span><span>${w.updated(wlDate)}</span></p>
${full ? `        <p class="wl-note">${w.note}</p>\n` : ''}      </div>\n` : '';
  const product = {
    '@context': 'https://schema.org', '@type': 'Product', name: 'Luca Bloom', description: plain(t.ldDescription),
    brand: { '@type': 'Brand', name: 'Luca Bloom' }, image: [`${url}og.png`], material: t.material, category: t.category,
    additionalProperty: t.props.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    countryOfOrigin: { '@type': 'Country', name: t.country },
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })),
  };
  const page = { '@context': 'https://schema.org', '@type': 'WebPage', name: t.title, url, inLanguage: L.lang, description: plain(t.ldDescription) };

  return `${head(L, { title: t.title, description: t.description, ogDescription: t.ogDescription, canonical: url, kind: 'lp', ogType: 'product', extraLd: [product, faq, page, organization(url)] })}
<noscript><style>#fb{display:none}</style></noscript>
<style>
${LP_CSS}</style>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
${SPRITE}
<!-- ================= HERO ================= -->
<header class="hero">
  <div class="wrap">
    <div class="top">
      <a class="logo" href="#top">Luca Bloom</a>
      ${langMenu(L, 'lp')}
    </div>
    <h1 id="top"><span class="for">${t.heroFor}</span><span class="catch">${t.heroCatch.map((c) => `<span>${c}</span>`).join(' ')}</span></h1>
    <p class="lead">${t.heroLead}</p>

    <div class="stage" id="stage" role="img" aria-label="${esc(t.stageAria)}">
      <img class="fb-img" id="fb" src="hero-fallback.webp" srcset="hero-fallback-800.webp 800w, hero-fallback.webp 1200w" sizes="(min-width: 600px) 520px, calc(100vw - 40px)" alt="${esc(t.imageAlt)}" width="1200" height="630" fetchpriority="high" decoding="async">
      <noscript><img class="fb-img" src="hero-fallback.webp" alt="${esc(t.imageAlt)}" width="1200" height="630"></noscript>
    </div>
    <p class="stage-note"><i aria-hidden="true"></i>${t.stageNote.map((n) => `<span class="nb">${n}</span>`).join(' ')}</p>
    <div class="meter">
      <div class="meter-row"><span>${t.meterLabel}</span><b id="gapv">${t.closed}</b></div>
      <input id="gap" type="range" min="10" max="70" step="1" value="10" aria-label="${esc(t.sliderAria)}" aria-valuetext="${esc(t.closed)}">
      <div class="ends"><span>${t.closed}</span><span>${t.max}</span></div>
    </div>

    <ul class="badges">
${t.badges.map(([b, s]) => `      <li><b>${b}</b>${s}</li>`).join('\n')}
    </ul>

    <div class="buy">
      <p class="price">${t.buyNote}</p>
${waitlistBox(true)}${buttons(' js-buy')}
    </div>
  </div>
</header>

<main id="main">
<!-- ================= WORRY ================= -->
<section class="sec">
  <div class="wrap">
    <p class="label">${t.worryLabel}</p>
    <h2>${t.worryH2}</h2>
    <ul class="worry">
${t.worries.map((w) => `      <li>${check22}${w}</li>`).join('\n')}
    </ul>
    <div class="bridge">
      <div class="arrow"></div>
      <p>${t.bridgeHtml}</p>
      <p class="note">${t.bridgeNote}</p>
    </div>
  </div>
</section>

<!-- ================= REASONS ================= -->
<section class="sec pt0">
  <div class="wrap">
    <p class="label">${t.reasonsLabel}</p>
    <h2>${t.reasonsH2}</h2>
    <div class="reasons">

      <article class="reason">
        <div class="ill">
          <svg viewBox="-9 -3 70 64" role="img" aria-label="${esc(t.r1.aria)}">
            <g fill="#FFFFFF" stroke="#8990A6" stroke-width=".35" stroke-linejoin="round">
              <use href="#lb-arm" transform="translate(8 20) scale(-1 1)"/>
              <use href="#lb-arm" transform="translate(22 20)"/>
              <use href="#lb-body"/>
            </g>
            <g stroke="#161A29" stroke-width=".35" fill="none">
              <path d="M26.5 37.5H35"/><path d="M27.4 55.5L35 55.5"/>
            </g>
            <circle cx="26.2" cy="37.5" r=".7" fill="#161A29"/><circle cx="27" cy="54.8" r=".7" fill="#161A29"/>
            <g font-family="Zen Kaku Gothic New,sans-serif" font-weight="700" fill="#161A29" font-size="3">
              <text x="36" y="36.4">${t.r1.labels[0]}</text><text x="36" y="40.4">${t.r1.labels[1]}</text><text x="36" y="44.2" font-size="2.85" font-weight="500" fill="#686D7D">${t.r1.labels[2]}</text>
              <text x="36" y="54.4">${t.r1.labels[3]}</text><text x="36" y="58.4">${t.r1.labels[4]}</text>
            </g>
          </svg>
        </div>
        <div class="body">
          <p class="no">${t.reasonWord} 01</p>
          <h3>${t.r1.h3}</h3>
          <p>${t.r1.p}</p>
        </div>
      </article>

      <article class="reason">
        <div class="ill">
          <svg viewBox="0 0 320 236" role="img" aria-label="${esc(t.r2.aria)}">
            <g font-family="Zen Kaku Gothic New,sans-serif" text-anchor="middle">
              <text x="80" y="20" font-size="13" font-weight="700" fill="#686D7D">${t.r2.rod}</text>
              <text x="240" y="20" font-size="13" font-weight="700" fill="#161A29">Luca Bloom</text>
            </g>
            <path d="M84 36v42" stroke="#C9707F" stroke-width="5" stroke-linecap="round" transform="translate(-4 0)"/>
            <path d="M70 72l10 14 10-14" fill="#C9707F" stroke="#C9707F" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="80" cy="130" r="36" fill="#FFFFFF" stroke="#8990A6" stroke-width="1.6"/>
            <path d="M16 136Q46 97 80 93Q114 97 144 136" fill="none" stroke="#C9707F" stroke-width="4" stroke-linecap="round" opacity=".85"/>
            <circle cx="80" cy="93" r="3.5" fill="#161A29"/>
            <g stroke="#C9707F" stroke-width="2.6" stroke-linecap="round">
              <path d="M216 44v34M228 44v34M240 44v34M252 44v34M264 44v34"/>
            </g>
            <g fill="#C9707F"><path d="M211 76l5 8 5-8zM223 76l5 8 5-8zM235 76l5 8 5-8zM247 76l5 8 5-8zM259 76l5 8 5-8z"/></g>
            <path d="M204 118A24 24 0 0 1 228 94H252A24 24 0 0 1 276 118V142A12 12 0 0 1 264 154H216A12 12 0 0 1 204 142Z" fill="#FFFFFF" stroke="#8990A6" stroke-width="1.6"/>
            <path d="M178 140L201.5 117A26.5 26.5 0 0 1 228 91H252A26.5 26.5 0 0 1 278.5 117L302 140" fill="none" stroke="#C9707F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
            <path d="M228 91H252" stroke="#161A29" stroke-width="3.5" stroke-linecap="round"/>
            <g font-family="Zen Kaku Gothic New,sans-serif" font-size="13" fill="#686D7D" text-anchor="middle">
              <text x="80" y="186">${t.r2.phi}</text>
              <text x="240" y="182">${t.r2.wide}</text>
              <text x="291" y="104" text-anchor="start">R2</text>
            </g>
            <path d="M204 162V166H276V162" fill="none" stroke="#8990A6" stroke-width="1"/>
            <g font-family="Zen Kaku Gothic New,sans-serif" font-size="13" font-weight="700" text-anchor="middle">
              <text x="80" y="212" fill="#686D7D">${t.r2.line[0]}</text><text x="80" y="228" fill="#686D7D">${t.r2.line[1]}</text>
              <text x="240" y="212" fill="#161A29">${t.r2.face[0]}</text><text x="240" y="228" fill="#161A29">${t.r2.face[1]}</text>
            </g>
          </svg>
        </div>
        <div class="body">
          <p class="no">${t.reasonWord} 02</p>
          <h3>${t.r2.h3}</h3>
          <p>${t.r2.p}</p>
          <p class="note-s">${t.r2.note}</p>
        </div>
      </article>

      <article class="reason">
        <div class="ill">
          <svg viewBox="0 0 300 180" role="img" aria-label="${esc(t.r3.aria)}">
            <path d="M92 26A64 64 0 0 1 150 70" fill="none" stroke="#E3B34E" stroke-width="5" stroke-linecap="round"/>
            <path d="M141 66l9 6 3-11" fill="none" stroke="#E3B34E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="47" y="45" width="90" height="90" fill="#FFFFFF" stroke="#8990A6" stroke-width="1.6"/>
            <path d="M72 45L47 70M112 45L137 70M137 110L112 135M47 110L72 135" stroke="#8990A6" stroke-width="1.6"/>
            <path d="M72 45H112L137 70V110L112 135H72L47 110V70Z" fill="#F5F3EE"/>
            <path d="M72 45H112L137 70V110L112 135H72L47 110V70Z" fill="none" stroke="#8990A6" stroke-width="1.2"/>
            <rect x="200" y="84" width="60" height="48" rx="10" fill="#161A29"/>
            <path d="M214 84v-12a16 16 0 0 1 32 0v12" fill="none" stroke="#161A29" stroke-width="7"/>
            <circle cx="230" cy="104" r="6" fill="#E3B34E"/>
            <path d="M230 108v10" stroke="#E3B34E" stroke-width="4" stroke-linecap="round"/>
            <text x="92" y="165" text-anchor="middle" font-family="Zen Kaku Gothic New,sans-serif" font-size="12.5" font-weight="700" fill="#161A29">${t.r3.stepless}</text>
            <text x="230" y="165" text-anchor="middle" font-family="Zen Kaku Gothic New,sans-serif" font-size="12.5" font-weight="700" fill="#161A29">${t.r3.stays}</text>
          </svg>
        </div>
        <div class="body">
          <p class="no">${t.reasonWord} 03</p>
          <h3>${t.r3.h3}</h3>
          <p>${t.r3.p}</p>
        </div>
      </article>

      <article class="reason">
        <div class="ill">
          <svg viewBox="-14 -3 106 76" role="img" aria-label="${esc(t.r4.aria)}">
            <g fill="#FFFFFF" stroke="#8990A6" stroke-width=".35" stroke-linejoin="round">
              <use href="#lb-arm" transform="translate(8 20) scale(-1 1)"/>
              <use href="#lb-arm" transform="translate(68 20)"/>
              <use href="#lb-body"/>
            </g>
            <g stroke="#E3B34E" stroke-width=".7" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.9 55V66M73.1 55V66" stroke-width=".35" stroke="#8990A6" stroke-dasharray="1 1"/>
              <path d="M3.4 63.5H72.6"/><path d="M6 61.6L3.4 63.5L6 65.4M70 61.6L72.6 63.5L70 65.4"/>
            </g>
            <text x="38" y="61.2" text-anchor="middle" font-family="Quicksand,sans-serif" font-size="6" font-weight="700" fill="#161A29">70mm</text>
          </svg>
        </div>
        <div class="body">
          <p class="no">${t.reasonWord} 04</p>
          <p class="big">70<small>mm</small></p>
          <h3>${t.r4.h3}</h3>
          <p>${t.r4.p}</p>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- ================= VOICE ================= -->
<section class="sec pt0" id="voice">
  <div class="wrap">
    <p class="label">${t.voiceLabel}</p>
    <h2>${t.voiceH2}</h2>
    <p class="sub">${t.voiceSub}</p>
    <div class="voices">
${t.voices.map(([n, q, who]) => `      <figure class="voice">
        <p class="rate" role="img" aria-label="${esc(t.rateLabel(n))}"><svg viewBox="0 0 96 18" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<use href="#lb-star" x="${i * 19.5}" fill="${i < n ? '#E3B34E' : '#E3E0D8'}"/>`).join('')}</svg><b>${n}<small>/5</small></b></p>
        <blockquote>${q}</blockquote>
        <figcaption>${who}</figcaption>
      </figure>`).join('\n')}
    </div>
  </div>
</section>

<!-- ================= PRIVACY ================= -->
<section class="sec dark">
  <div class="wrap">
    <p class="label">${t.privLabel}</p>
    <h2>${t.privH2}</h2>
    <p class="sub">${t.privSub}</p>
    <div class="boxstage" id="boxstage" role="img" aria-label="${esc(t.boxAria)}">
      <div class="fb" id="boxfb">${BOX_FB.trim().replace('{{boxFbAria}}', esc(t.boxFbAria))}</div>
    </div>
    <p class="box-cap">${t.boxCap}</p>
    <ul class="privacy-points">
${t.privPoints.map((p) => `      <li>${check20}${p}</li>`).join('\n')}
    </ul>
  </div>
</section>

<!-- ================= HOW TO ================= -->
<section class="sec">
  <div class="wrap">
    <p class="label">${t.howLabel}</p>
    <h2>${t.howH2}</h2>
    <ol class="steps">
      <li>
        <div class="pic"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 8c8 12 14 20 14 28a14 14 0 0 1-28 0c0-8 6-16 14-28z" fill="#161A29"/><path d="M24 38a6 6 0 0 0 6 6" fill="none" stroke="#E3B34E" stroke-width="2.5" stroke-linecap="round"/></svg></div>
        <div><p class="s">${t.stepWord} 1</p><b>${t.steps[0][0]}</b><span>${t.steps[0][1]}</span></div>
      </li>
      <li>
        <div class="pic"><svg viewBox="-13 11 42 52" aria-hidden="true"><g fill="#FFFFFF" stroke="#161A29" stroke-width=".7" stroke-linejoin="round"><use href="#lb-arm" transform="translate(8 20) scale(-1 1)"/><use href="#lb-arm" transform="translate(8 20)"/></g><rect x="-13" y="11" width="42" height="9" fill="#161A29"/><path d="M24 36v16" stroke="#E3B34E" stroke-width="2" stroke-linecap="round"/><path d="M20.8 48.5L24 52.5L27.2 48.5" fill="none" stroke="#E3B34E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div><p class="s">${t.stepWord} 2</p><b>${t.steps[1][0]}</b><span>${t.steps[1][1]}</span></div>
      </li>
      <li>
        <div class="pic"><svg viewBox="0 0 60 60" aria-hidden="true"><rect x="15" y="15" width="30" height="30" fill="#161A29"/><path d="M23.3 15H36.7L45 23.3V36.7L36.7 45H23.3L15 36.7V23.3Z" fill="#2E3550"/><path d="M30 6A24 24 0 0 1 53 23" fill="none" stroke="#E3B34E" stroke-width="3.5" stroke-linecap="round"/><path d="M47.5 21.5l5.5 2 1.5-5.6" fill="none" stroke="#E3B34E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div><p class="s">${t.stepWord} 3</p><b>${t.steps[2][0]}</b><span>${t.steps[2][1]}</span></div>
      </li>
    </ol>
    <p class="guide-h">${t.guideH}</p>
    <div class="guide">
${t.guide.map(([s, n, u]) => `      <div><span>${s}</span><b>${n}<small>${u}</small></b></div>`).join('\n')}
    </div>
    <p class="guide-note">${t.guideNote}</p>
  </div>
</section>

<!-- ================= SAFETY ================= -->
<section class="sec pt0" id="safety">
  <div class="wrap">
    <p class="label">${t.safetyLabel}</p>
    <h2>${t.safetyH2}</h2>
    <p class="sub">${t.safetySub}</p>
    <div class="safety">
${t.safety.map(([h, items]) => `      <h3>${h}</h3>\n      <ul>\n${items.map((i) => `        <li>${i}</li>`).join('\n')}\n      </ul>`).join('\n')}
    </div>
  </div>
</section>

<!-- ================= TRUST ================= -->
<section class="sec pt0">
  <div class="wrap">
    <p class="label">${t.qualityLabel}</p>
    <h2>${t.qualityH2}</h2>
    <div class="trust">
      <div>
        <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#161A29"/><circle cx="24" cy="24" r="8" fill="#C9505E"/></svg>
        <p><b>${t.quality[0][0]}</b><span>${t.quality[0][1]}</span></p>
      </div>
      <div>
        <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#161A29"/><path d="M15 30c3-10 15-14 19-14-1 6-4 17-15 17" fill="#F5F3EE"/><path d="M15 34c4-6 8-10 14-13" stroke="#161A29" stroke-width="1.6" fill="none"/></svg>
        <p><b>${t.quality[1][0]}</b><span>${t.quality[1][1]}</span></p>
      </div>
      <div>
        <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#161A29"/><path d="M16 12h12l6 6v18H16z" fill="#F5F3EE"/><path d="M20 22h10M20 27h10M20 32h6" stroke="#161A29" stroke-width="1.8" stroke-linecap="round"/><circle cx="33" cy="33" r="6" fill="#E3B34E"/></svg>
        <p><b>${t.quality[2][0]}</b><span>${t.quality[2][1]}</span></p>
      </div>
    </div>
  </div>
</section>

<!-- ================= FAQ ================= -->
<section class="sec pt0">
  <div class="wrap">
    <p class="label">${t.faqLabel}</p>
    <h2>${t.faqH2}</h2>
    <div class="faq">
${t.faq.map(([q, a]) => `      <details><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
    </div>
  </div>
</section>

<!-- ================= SUPPORT ================= -->
<section class="sec pt0" id="support">
  <div class="wrap">
    <p class="label">${t.supportLabel}</p>
    <h2>${t.supportH2}</h2>
    <p class="sub">${t.supportSub}</p>
    <div class="support-links">
${supportLinks(L)}
    </div>
  </div>
</section>

<!-- ================= COLUMN ================= -->
<section class="sec pt0" id="column">
  <div class="wrap">
    ${columnLink(L)}
  </div>
</section>

<!-- ================= FINAL ================= -->
<section class="sec dark final">
  <div class="wrap">
    <p class="label">Luca Bloom</p>
    <h2>${t.finalH2}</h2>
    <p class="sub">${t.finalSub}</p>
    <div class="buy">
${waitlistBox(false)}${buttons(' js-buy')}
    </div>
  </div>
</section>
</main>

${footer(L, '')}

<aside class="bar" id="bar" aria-label="${esc(t.barAria)}">
  <div class="in">
    <p class="p">Luca Bloom<small>${t.barSmall}</small></p>
    ${barButtons}
  </div>
</aside>

<script type="module" src="/assets/js/app.js"></script>
</body>
</html>
`;
}

// サポート欄：日本語版と同じく、ご使用マニュアルと免責事項（PDF）へ直接リンクする。
// 英国・豪州版のように1ページで複数の国を扱うときは、国ごとに並べる
function supportLinks(L) {
  const list = COUNTRIES.flatMap((c) => c.langs.filter((v) => v.lp === L.dir).map((v) => ({ c, ...supportLink(c, v) })));
  const name = (c) => (list.length > 1 ? ` – ${c.name}` : '');
  return list
    .map(({ c, manual, pdf }) => `      <a href="${manual}"><b>${L.t.manual[0]}${name(c)}</b><span>${L.t.manual[1]}</span></a>
      <a href="${pdf}" target="_blank" rel="noopener"><b>${L.t.pdf[0]}${name(c)}</b><span>${L.t.pdf[1]}</span></a>`)
    .join('\n');
}

function footer(L, prefix) {
  const t = L.t;
  const legal = L.legal ? `<a href="${L.legal.file}">${L.legal.link}</a>` : '';
  // 日本語版と同じく、ご使用マニュアル・免責事項（PDF）・コラムへのリンクと、サポートページの案内を載せる
  const list = COUNTRIES.flatMap((c) => c.langs.filter((v) => v.lp === L.dir).map((v) => ({ c, ...supportLink(c, v) })));
  const name = (c) => (list.length > 1 ? ` (${c.name})` : '');
  const hub = list.length === 1 ? `/${list[0].c.dir}` : '/intl/';
  const support = list
    .map(({ c, manual, pdf }) => `<a href="${manual}">${t.manual[0]}${name(c)}</a><a href="${pdf}" target="_blank" rel="noopener">${t.pdf[0]}${name(c)}</a>`)
    .join('');
  return `<footer>
  <div class="wrap">
    <span class="logo">Luca Bloom</span>
    <p>${t.footer}${t.footerMore(hub)}</p>
    <nav aria-label="${esc(t.navLabel)}"><a href="${prefix}#safety">${t.safetyLink}</a>${support}<a href="/${L.dir}column/">${columnName(L)}</a><a href="privacy.html">${t.privacyLink}</a>${legal}</nav>
    <p class="op">${t.operator}</p>
    ${prefix ? '' : `<p>${t.imagesNote}</p>\n    `}<p>© Luca Bloom</p>
  </div>
</footer>`;
}

// ---------------- 文書ページ（プライバシーポリシー・法定表示） ----------------
export function docHtml(L, doc, file, kind) {
  const url = SITE + L.dir + file;
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: L.t.home, item: SITE + L.dir },
      { '@type': 'ListItem', position: 2, name: plain(doc.h1) },
    ],
  };
  return `${head(L, { title: doc.title, description: doc.description, canonical: url, kind, ogType: 'website', extraLd: [crumbs] })}
<style>
${DOC_CSS}</style>
</head>
<body>
<a class="skip" href="#main">${L.t.skip}</a>

<header class="hero">
  <div class="wrap">
    <div class="top">
      <a class="logo" href="./">Luca Bloom</a>
      ${kind ? langMenu(L, kind) : `<a class="back" href="./">${L.t.backHome}</a>`}
    </div>
    <p class="label">${doc.label}</p>
    <h1>${doc.h1}</h1>
  </div>
</header>

<main id="main" class="doc">
  <div class="wrap">
    <p class="intro">${doc.intro}</p>
${doc.sections.map(([h, body]) => `\n    <section>\n      <h2>${h}</h2>\n      ${body}\n    </section>`).join('\n')}

    <p class="date">${doc.date}</p>
  </div>
</main>

${footer(L, './')}
</body>
</html>
`;
}
