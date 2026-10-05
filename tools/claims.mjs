// 海外向けの文章（多言語LP・海外SNS）で使わない語。各国の医療機器・広告の規制を踏まえ、
// 病名・治療や効果をうたう語・比較や最上級の語を言語ごとに検出する。
//   英語：英国 MHRA・ASA、豪州 TGA、米国 FDA・FTC / スペイン語：メキシコ COFEPRIS・PROFECO / フランス語：ANSM・DGCCRF
// tests/site.spec.mjs（各言語のLP）と tools/sns-check.mjs（SNS投稿）で共用。
const RULES = {
  en: {
    banned:
      /\b(phimosis|paraphimosis|balanitis|circumcis\w*|treat(s|ment|ing)?|cure[sd]?|heal(s|ing)?|fix(es|ed)?|correct(s|ion|ive)?|improve[sd]?|prevent(s|ion|ive)?|reliev\w*|relief|therap\w*|clinical(ly)?|proven|medical[- ]grade|doctor[- ]recommended|guarantee[sd]?|results?|before\s*\/\s*after|before[- ]and[- ]after (photos?|pictures?|images?|shots?)|best|no\.? ?1|number one|industry[- ]leading|widest|largest)\b/i,
    // 否定・注意書き・名前の由来として使う場合は許可する
    allowed: /not intended to diagnose, treat or prevent|receiving treatment for the area|makes no medical or therapeutic claims|at your best/gi,
  },
  es: {
    banned:
      /(?<![\p{L}])(fimosis|parafimosis|balanitis|circuncisi\p{L}*|tratamientos?|tratar|trata|cura|curar|cura[rsn]?|sana[r]?|corrig\p{L}*|correcci\p{L}*|mejora[rsn]?|mejoría|previen\p{L}*|prevenir|prevenci\p{L}*|alivi\p{L}*|terap\p{L}*|clínic\p{L}*|comprobad\p{L}*|garantiza\p{L}*|garantía|resultados?|el mejor|la mejor|número 1|n\.? ?º? ?1|líder|más amplia|más grande)(?![\p{L}])/iu,
    allowed: /no pretende diagnosticar, tratar ni prevenir|estás recibiendo tratamiento en la zona|no afirma ningún efecto médico ni terapéutico/giu,
  },
  fr: {
    banned:
      /(?<![\p{L}])(phimosis|paraphimosis|balanite|circoncision|trait(er|e|ent|ement|ements)|guéri\p{L}*|corrig\p{L}*|correction|amélior\p{L}*|préven\p{L}*|prévient|soulag\p{L}*|thérapeuti\p{L}*|clinique(ment)?|prouvé\p{L}*|garanti[e]?s?|résultats?|le meilleur|la meilleure|n° ?1|numéro un|leader|le plus large|la plus grande)(?![\p{L}])/iu,
    allowed: /pas destiné à diagnostiquer, traiter ou prévenir|si vous suivez un traitement pour cette zone|ne revendique aucun effet médical ou thérapeutique/giu,
  },
};

// 文章から許可された言い回しを除いたうえで、最初に見つかった禁止語を返す（なければ null）。lang は en・es・fr
export function findBanned(text, lang = 'en') {
  const r = RULES[lang];
  if (!r) throw new Error(`禁止語の一覧がない言語：${lang}`);
  const m = String(text).replace(r.allowed, '').match(r.banned);
  return m ? m[0] : null;
}
