// 海外向けSNS投稿（sns/en/posts.json、またはAIが出力したJSON）の自動チェック。投稿前に実行する。
//   node tools/sns-check.mjs                 … sns/en/posts.json を確認
//   node tools/sns-check.mjs output.json     … AIの出力（1件のオブジェクト、配列、{ posts: [...] } のどれでも可）を確認
// 確認内容：禁止語（tools/claims.mjs）・文字数（X は X の数え方）・ハッシュタグ・必須項目・日本語訳の有無
import fs from 'node:fs';
import path from 'node:path';
import { findBanned } from './claims.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const file = process.argv[2] || path.join(ROOT, 'sns/en/posts.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const posts = Array.isArray(data) ? data : data.posts || [data];

const HASHTAGS = new Set(['#LucaBloom', '#MensSelfCare', '#MensGrooming', '#PersonalCare', '#IntimateCare', '#SelfCare', '#MensCare']);
// Threads はハッシュタグ（トピック）を1つしか付けられないため、検索される語の #phimosis（包茎）1つだけにする。
// 本文には病名を書かない（このタグだけは禁止語の確認から外す）
const THREADS_TAG = '#phimosis';

// X の文字数の数え方：URL は23文字、ラテン文字・一般的な記号は1文字、それ以外（▷ や日本語など）は2文字
function xLength(text) {
  const t = text.replace(/https?:\/\/\S+/g, 'x'.repeat(23));
  let n = 0;
  for (const ch of t) {
    const c = ch.codePointAt(0);
    const light = c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037);
    n += light ? 1 : 2;
  }
  return n;
}

const errors = [];
const ids = new Set();
for (const p of posts) {
  const id = p.id || '(no id)';
  const err = (msg) => errors.push(`${id}: ${msg}`);
  if (ids.has(id)) err('ID が重複しています');
  ids.add(id);
  for (const k of ['instagram', 'x', 'threads', 'alt']) if (!p[k]) err(`${k} がありません`);
  if (!p.ja || !p.ja.instagram || !p.ja.x || !p.ja.threads) err('日本語訳（ja）が足りません');

  const english = [p.instagram, p.x, (p.threads || '').replace(THREADS_TAG, ''), p.alt, ...(p.image ? [p.image.eyebrow, p.image.headline, ...(p.image.checklist || []), ...(p.image.chips || [])] : [])];
  for (const t of english.filter(Boolean)) {
    const hit = findBanned(t);
    if (hit) err(`禁止語「${hit}」：${t.slice(0, 60).replace(/\n/g, ' ')}…`);
    if (/[£$€¥]\s?\d|\b\d+(\.\d+)?\s?(gbp|aud|pounds?|dollars?)\b|\blimited\b|% off|\bsale\b/i.test(t)) err(`価格・限定・セールの表現：${t.slice(0, 60)}…`);
  }

  if (p.x && xLength(p.x) > 280) err(`X が ${xLength(p.x)} 文字（上限280）`);
  if (p.threads && [...p.threads].length > 500) err(`Threads が ${[...p.threads].length} 文字（上限500）`);
  if (p.instagram && [...p.instagram].length > 2200) err(`Instagram が ${[...p.instagram].length} 文字（上限2200）`);
  if (p.alt && [...p.alt].length > 200) err(`alt が ${[...p.alt].length} 文字（上限200）`);

  if (p.instagram) {
    const tags = p.instagram.match(/#\w+/g) || [];
    if (tags.length < 3 || tags.length > 5) err(`Instagram のハッシュタグが ${tags.length} 個（3〜5個）`);
    const words = p.instagram.replace(/#\w+/g, '').split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
    if (words < 40 || words > 170) err(`Instagram の本文が ${words} 語（目安60〜150語）`);
  }
  for (const k of ['instagram', 'x']) {
    for (const tag of (p[k] || '').match(/#\w+/g) || []) if (!HASHTAGS.has(tag)) err(`${k} に許可していないハッシュタグ ${tag}`);
  }
  if (((p.x || '').match(/#\w+/g) || []).length > 2) err('x のハッシュタグが3個以上');
  const threadsTags = (p.threads || '').match(/#\w+/g) || [];
  if (threadsTags.length !== 1 || threadsTags[0] !== THREADS_TAG) err(`threads のハッシュタグは ${THREADS_TAG} の1つだけ（今：${threadsTags.join(' ') || 'なし'}）`);
  if (p.image && p.image.headline && p.image.headline.split('\n').length > 3) err('画像の見出しが4行以上');
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`NG：${errors.length}件の問題（${path.relative(ROOT, file)}）`);
  process.exit(1);
}
console.log(`OK：${posts.length}件の投稿に問題なし（${path.relative(ROOT, file)}）`);
