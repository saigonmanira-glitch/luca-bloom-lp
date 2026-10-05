// 多言語サイトの一覧（どの言語のページがどこにあるか）。hreflang・言語メニュー・サイトマップはここから作る。
// 言語を追加するときは、locales/ にファイルを足して LOCALES に加え、npm run build を実行する。
import enGB from './locales/en-GB.mjs';
import enUS from './locales/en-US.mjs';
import esMX from './locales/es-MX.mjs';
import frFR from './locales/fr-FR.mjs';

export const SITE = 'https://luca-bloom.com/';

// 生成するページの言語（日本語版は手作業で管理しているため含めない）
export const LOCALES = [enGB, enUS, esMX, frFR];

// 言語メニューに並べる順番と表示名（各言語で、その言語自身の名前を書く）
export const MENU = [
  { lang: 'ja', label: '日本語', dir: '' },
  { lang: 'en-GB', label: 'English (UK · Australia)', dir: 'en/' },
  { lang: 'en-US', label: 'English (United States)', dir: 'us/' },
  { lang: 'es-MX', label: 'Español (México)', dir: 'mx/' },
  { lang: 'fr-FR', label: 'Français (France)', dir: 'fr/' },
];

// hreflang：言語コードとページの場所。英国版は豪州向けも兼ねる。どれにも当てはまらない人には英国・豪州版（x-default）
const HREFLANG = [
  ['ja', ''],
  ['en-GB', 'en/'],
  ['en-AU', 'en/'],
  ['en-US', 'us/'],
  ['es-MX', 'mx/'],
  ['fr-FR', 'fr/'],
  ['x-default', 'en/'],
];

// 同じ内容のページの組。kind = 'lp'（商品ページ）・'privacy'（プライバシーポリシー）
const FILE = { lp: '', privacy: 'privacy.html' };

// [hreflang, 絶対URL] の一覧
export function alternates(kind) {
  return HREFLANG.map(([code, dir]) => [code, SITE + dir + FILE[kind]]);
}

// <link rel="alternate" hreflang> のタグ（全ページ共通・自分自身も含む）
export function alternateTags(kind) {
  return alternates(kind)
    .map(([code, url]) => `<link rel="alternate" hreflang="${code}" href="${url}">`)
    .join('\n');
}
