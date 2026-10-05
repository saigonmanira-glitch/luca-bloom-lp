// 海外向けコラム（/{言語}/column/）を、記事データ（columns/en.mjs・fr.mjs・es.mjs）から作る。
// 日本語版 /column/ と同じ見た目（/column/column.css）・同じ図。記事は各国の規制に合わせて病名を使わない8本。
// 受診先・緊急連絡先は国ごとに CARE から差し込む。英国・豪州版（/en/）は両国の連絡先を併記する。
import { LOCALES, SITE } from './site.mjs';
import { FIGS } from './columns/figures.mjs';
import { supportLink, COUNTRIES } from './support.mjs';
import en from './columns/en.mjs';
import fr from './columns/fr.mjs';
import es from './columns/es.mjs';

// 文字列・関数・配列・オブジェクトの中の文章をまとめて置き換える
const swap = (pairs) => {
  const s = (v) =>
    typeof v === 'string' ? pairs.reduce((x, [a, b]) => x.replace(a, b), v)
      : Array.isArray(v) ? v.map(s)
        : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, s(x)]))
          : v;
  return s;
};
const american = swap([[/colour/g, 'color'], [/odour/g, 'odor'], [/Odour/g, 'Odor'], [/specialise/g, 'specialize'], [/judgement/g, 'judgment'], [/trousers/g, 'pants'], [/Trousers/g, 'Pants']]);
const frPunct = swap([[/ ([?!;])/g, '$1'], [/ :/g, ' :'], [/« /g, '« '], [/ »/g, ' »']]);

// 国ごとの受診先と緊急連絡先
const CARE = {
  'en-GB': {
    gpBox: 'See your GP', // 図の最後の箱（短く）
    gp: 'GP', gpA: 'a GP',
    emergency: 'In the UK, call 999 in an emergency, or NHS 111 for urgent advice. In Australia, call 000 in an emergency, or healthdirect on 1800 022 222 for advice.',
    afterHours: 'Out of hours: NHS 111 / healthdirect',
  },
  'en-US': {
    gpBox: 'See your doctor', // 図の最後の箱（短く）
    gp: 'primary care doctor', gpA: 'a primary care doctor',
    emergency: 'In an emergency, call 911 or go to the nearest emergency room.',
    afterHours: 'After hours: urgent care or 911',
  },
  'en-CA': {
    gpBox: 'See your family doctor', // 図の最後の箱（短く）
    gp: 'family doctor', gpA: 'a family doctor',
    emergency: 'In an emergency, call 911 or go to the nearest emergency department. For health advice, most provinces offer 811.',
    afterHours: 'After hours: 811 or 911',
  },
  'fr-CA': {
    gpBox: 'Votre médecin', // 図の最後の箱（短く）
    gp: 'médecin de famille',
    emergency: 'En cas d’urgence, composez le 911 ou rendez-vous à l’urgence la plus proche. Pour un conseil santé, composez le 811 (Info-Santé au Québec).',
    afterHours: 'Hors des heures : 811 ou 911',
  },
  'es-MX': {
    gpBox: 'Consulta a un médico', // 図の最後の箱（短く）
    gp: 'médico general',
    emergency: 'En caso de emergencia, llama al 911 o acude al servicio de urgencias más cercano.',
    afterHours: 'Fuera de horario: 911 o urgencias',
  },
};

const SOURCE = {
  'en-GB': () => en(CARE['en-GB']),
  'en-US': () => american(en(CARE['en-US'])),
  'en-CA': () => en(CARE['en-CA']),
  'fr-CA': () => frPunct(fr(CARE['fr-CA'])),
  'es-MX': () => es(CARE['es-MX']),
};

export const PUBLISHED = '2026-10-05';
const HREFLANG = [['en-GB', 'en/'], ['en-AU', 'en/'], ['en-US', 'us/'], ['en-CA', 'ca/'], ['fr-CA', 'ca/fr/'], ['es-MX', 'mx/']];

// 言語ごとのコラム（LP の言語ファイル L と、記事データ）
export const COLUMN_SETS = LOCALES.map((L) => ({ L, ...SOURCE[L.code]() }));

// 生成するページ（テスト・サイトの検査で使う）
export const COLUMN_PAGES = COLUMN_SETS.flatMap(({ L, articles }) => [`${L.dir}column/`, ...articles.map((a) => `${L.dir}column/${a.slug}.html`)]);

// hreflang：同じ記事の各言語版と日本語版（slug が null なら一覧ページ）
export function columnAlternates(slug, jp) {
  const file = slug ? `${slug}.html` : '';
  return [
    ['ja', `${SITE}column/${jp ? `${jp}.html` : ''}`],
    ...HREFLANG.map(([h, dir]) => [h, `${SITE}${dir}column/${file}`]),
    ['x-default', `${SITE}en/column/${file}`],
  ];
}
export const columnAlternateTags = (slug, jp) =>
  columnAlternates(slug, jp).map(([h, u]) => `<link rel="alternate" hreflang="${h}" href="${u}">`).join('\n');
// 日本語版の記事ファイル名 → 海外版の slug（日本語版に hreflang を書き込むため）
export const JP_TO_SLUG = Object.fromEntries(COLUMN_SETS[0].articles.map((a) => [a.jp, a.slug]));

const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const dateText = (L) => new Intl.DateTimeFormat(L.lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(PUBLISHED));

function block(b) {
  const [type, ...a] = b;
  const li = (items) => items.map((i) => `<li>${i}</li>`).join('');
  switch (type) {
    case 'p': return `<p>${a[0]}</p>`;
    case 'h2': return `<h2>${a[0]}</h2>`;
    case 'h3': return `<h3>${a[0]}</h3>`;
    case 'check': return `<ul class="check">\n${a[0].map((i) => `<li>${i}</li>`).join('\n')}\n</ul>`;
    case 'ng': return `<ul class="ng">${li(a[0])}</ul>`;
    case 'steps': return `<ol class="steps">${li(a[0])}</ol>`;
    case 'fig': {
      const [name, labels, aria, cap] = a;
      return `<figure class="fig">${FIGS[name](labels.map(esc), esc(aria))}<figcaption>${cap}</figcaption></figure>`;
    }
    case 'tbl': {
      const [head, rows] = a;
      return `<div class="tbl"><table><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([th, ...td]) => `<tr><th scope="row">${th}</th>${td.map((d) => `<td>${d}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    case 'cards': return `<div class="cards">${a[0].map(([tag, t, d]) => `<div><b><i>${tag}</i>${t}</b><span>${d}</span></div>`).join('')}</div>`;
    case 'alert': {
      const [t, items, p] = a;
      return `<div class="alert"><p class="t">${t}</p><ul>${li(items)}</ul><p>${p}</p></div>`;
    }
    default: throw new Error(`コラムの不明な要素：${type}`);
  }
}

function head(L, { title, description, url, type, alternates, lds }) {
  return `<!DOCTYPE html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${alternates}
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#161A29">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Luca Bloom">
<meta property="og:locale" content="${L.ogLocale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}${L.dir}og.png">
<meta name="twitter:card" content="summary_large_image">
<!-- fonts:start -->
<!-- fonts:end -->
<link rel="stylesheet" href="/column/column.css">
${lds.map(ld).join('\n')}
</head>`;
}

// 使い方（マニュアル）へのリンク：その言語の国のマニュアル。英国・豪州版は国の選択から
function manualHref(L) {
  const list = COUNTRIES.flatMap((c) => c.langs.filter((v) => v.lp === L.dir).map((v) => supportLink(c, v).manual));
  return list.length === 1 ? list[0] : '/intl/';
}

function siteHeader(L, ui) {
  return `<a class="skip" href="#main">${L.t.skip}</a>
<header class="site"><div class="in"><a class="logo" href="/${L.dir}">Luca Bloom</a>
<nav aria-label="${esc(ui.siteNav)}"><a href="/${L.dir}column/">${ui.indexH1}</a><a href="${manualHref(L)}">${ui.manual}</a></nav></div></header>`;
}

function siteFooter(L, ui) {
  return `<footer class="site"><a href="/${L.dir}">${ui.home}</a><a href="/${L.dir}column/">${ui.indexH1}</a><a href="/${L.dir}privacy.html">${ui.privacy}</a>
<p>&copy; Luca Bloom</p></footer>
</body>
</html>
`;
}

function productBox(L, ui) {
  const buttons = L.stores.map((s) => `<a class="btn" href="${s.href}" rel="nofollow sponsored noopener" target="_blank">${s.cta}</a>`).join('');
  return `<aside class="product">
<p class="product-label">${ui.authorLabel}</p>
<p>${ui.author}</p>
<p>${ui.product}</p>
<p class="btns">${buttons}<a class="btn ghost" href="/${L.dir}">${ui.details}</a></p>
</aside>`;
}

export function articleHtml(set, a) {
  const { L, ui, articles } = set;
  const url = `${SITE}${L.dir}column/${a.slug}.html`;
  const i = articles.indexOf(a);
  const related = [1, 2, 3].map((k) => articles[(i + k) % articles.length]);
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description,
    datePublished: PUBLISHED, dateModified: PUBLISHED, mainEntityOfPage: url, image: `${SITE}${L.dir}og.png`,
    author: { '@type': 'Organization', name: 'Luca Bloom', url: SITE + L.dir },
    publisher: { '@type': 'Organization', name: 'Luca Bloom', url: SITE + L.dir, logo: { '@type': 'ImageObject', url: `${SITE}apple-touch-icon.png` } },
    url, inLanguage: L.lang,
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: ui.home, item: SITE + L.dir },
      { '@type': 'ListItem', position: 2, name: ui.indexH1, item: `${SITE}${L.dir}column/` },
      { '@type': 'ListItem', position: 3, name: plain(a.title) },
    ],
  };
  // ページのタイトル（検索結果に収まる70文字まで）。長い記事は「| Luca Bloom」を付けないか、短い題を使う
  const pageTitle = [`${a.title} | Luca Bloom`, a.title, a.short].find((x) => x && x.length <= 70);
  if (!pageTitle) throw new Error(`タイトルが70文字を超えます（short を付けてください）：${a.title}`);
  return `${head(L, { title: pageTitle, description: a.description, url, type: 'article', alternates: columnAlternateTags(a.slug, a.jp), lds: [article, crumbs] })}
<body>
${siteHeader(L, ui)}
<main id="main">
<nav class="crumbs" aria-label="${esc(ui.crumbs)}"><a href="/${L.dir}">${ui.home}</a> › <a href="/${L.dir}column/">${ui.indexH1}</a> › ${a.title}</nav>
<article>
<h1>${a.title}</h1>
<p class="date"><time datetime="${PUBLISHED}">${dateText(L)}</time></p>
${block(a.body[0])}
<div class="points"><p class="t">${ui.points}</p><ul>${a.points.map((p) => `<li>${p}</li>`).join('')}</ul></div>
${a.body.slice(1).map(block).join('\n')}
<p class="note">${ui.note}</p>
</article>
${productBox(L, ui)}
<section class="related"><h2>${ui.related}</h2><ul class="list">${related.map((r) => `<li><a href="/${L.dir}column/${r.slug}.html">${r.title}</a></li>`).join('')}</ul></section>
</main>
${siteFooter(L, ui)}`;
}

export function indexHtml(set) {
  const { L, ui, articles } = set;
  const url = `${SITE}${L.dir}column/`;
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: ui.home, item: SITE + L.dir }, { '@type': 'ListItem', position: 2, name: ui.indexH1 }],
  };
  const collection = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${ui.indexTitle} | Luca Bloom`, url, inLanguage: L.lang,
    mainEntity: { '@type': 'ItemList', itemListElement: articles.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${url}${a.slug}.html`, name: a.title })) },
  };
  return `${head(L, { title: `${ui.indexTitle} | Luca Bloom`, description: ui.indexDescription, url, type: 'website', alternates: columnAlternateTags(null, null), lds: [crumbs, collection] })}
<body>
${siteHeader(L, ui)}
<main id="main">
<nav class="crumbs" aria-label="${esc(ui.crumbs)}"><a href="/${L.dir}">${ui.home}</a> › ${ui.indexH1}</nav>
<h1>${ui.indexH1}</h1>
<p>${ui.indexIntro}</p>
<ul class="list">${articles.map((a) => `<li><a href="/${L.dir}column/${a.slug}.html">${a.title}<span>${a.description}</span></a></li>`).join('')}</ul>
${productBox(L, ui)}
</main>
${siteFooter(L, ui)}`;
}

// 商品ページのコラムへの入口（日本語版と同じ見た目）
export function columnLink(L) {
  const set = COLUMN_SETS.find((s) => s.L === L);
  return `<a class="col-link" href="/${L.dir}column/"><span class="k">COLUMN</span><b>${set.ui.lpTitle}</b><span class="d">${set.ui.lpText}</span></a>`;
}
