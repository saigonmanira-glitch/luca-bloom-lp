// 英語の文章（英語版LP・海外SNS）で使わない語。英国（MHRA・ASA）・豪州（TGA）の規制を踏まえ、
// 病名・治療や効果をうたう語・比較や最上級の語を検出する。tests/site.spec.mjs と tools/sns-check.mjs で共用。
export const BANNED_EN =
  /\b(phimosis|paraphimosis|balanitis|circumcis\w*|treat(s|ment|ing)?|cure[sd]?|heal(s|ing)?|fix(es|ed)?|correct(s|ion|ive)?|improve[sd]?|prevent(s|ion|ive)?|reliev\w*|relief|therap\w*|clinical(ly)?|proven|medical[- ]grade|doctor[- ]recommended|guarantee[sd]?|results?|before\s*\/\s*after|before[- ]and[- ]after (photos?|pictures?|images?|shots?)|best|no\.? ?1|number one|industry[- ]leading|widest|largest)\b/i;

// 否定・注意書き・名前の由来として使う場合は許可する
export const ALLOWED_EN =
  /not intended to diagnose, treat or prevent|receiving treatment for the area|makes no medical or therapeutic claims|at your best/gi;

// 文章から許可された言い回しを除いたうえで、最初に見つかった禁止語を返す（なければ null）
export function findBanned(text) {
  const m = String(text).replace(ALLOWED_EN, '').match(BANNED_EN);
  return m ? m[0] : null;
}
