// お知らせ（プレスリリース・掲載情報など）。日本語LPと海外LPの全ページで共通。
// 新しい順に並べる。title の言語を lang に書く（ページの言語と違うときは lang 属性を付けて読み上げを正しくする）
export const NEWS = [
  { date: '2026-10-15', src: 'ツナググ', lang: 'ja', url: 'https://press.portal-th.com/archives/53852', title: '包茎に向き合う元公務員が立ち上げた「Luca Bloom」、11月中旬に米国・カナダ・メキシコで発売へ' },
  { date: '2026-10-15', src: 'PRLog', lang: 'en', url: 'https://www.prlog.org/13176565-japanese-brand-luca-bloom-to-launch-mens-self-care-tool-in-the-us-canada-and-mexico-in-november.html', title: 'Japanese Brand Luca Bloom to Launch Men’s Self-Care Tool in the US, Canada and Mexico in November' },
  { date: '2026-10-13', src: 'valuepress', lang: 'ja', url: 'https://www.value-press.com/pressrelease/382432', title: '包茎に向き合う元公務員が開発した「Luca Bloom」、英国Amazonで販売開始' },
  { date: '2026-10-13', src: '@Press', lang: 'ja', url: 'https://www.atpress.ne.jp/news/6165665', title: '元公務員の24歳が一人で立ち上げたブランド「Luca Bloom」、メンズセルフケアツールを初期ロット限定5,800円で販売' },
];

// お知らせの一覧（<ul class="news">）。pageLang はページの言語（ja / en-GB など）
export function newsList(pageLang, indent = '    ') {
  const base = pageLang.slice(0, 2);
  const items = NEWS.map((n) => `${indent}  <li><time datetime="${n.date}">${n.date.replaceAll('-', '.')}</time><span class="src">${n.src}</span><a href="${n.url}" target="_blank" rel="noopener"${n.lang === base ? '' : ` lang="${n.lang}"`}>${n.title}</a></li>`);
  return `<ul class="news">\n${items.join('\n')}\n${indent}</ul>`;
}
