// Amazon 商品画像の文言。tools/amazon/build-images.mjs が使う。
// 同じ ASIN（商品番号）で各国に出品するため、画像は全世界共通の1組にする。
// 日本語などの文章は使わず、数字・単位（mm）・記号と、短い英単語だけで伝える。
// 表現は海外LPと同じ決まり：病名・効果・比較・最上級・価格・「限定」を入れない（tools/claims.mjs で検査）。
// 日本語版の「業界最大の開き幅※」は比較の表現のため載せない。

const GLOBAL = {
  lang: 'en',
  claims: 'en',
  main: {
    pill: 'Utility model application filed · JP',
    kicker: 'FORESKIN CARE TOOL',
    h: 'Turn. Open.<br><em>Stays put.</em>',
    cards: [
      ['Reverse taper', 'Narrow base → wide tip<br>Holds without slipping'],
      ['Flat face', '6 mm · R2 corners<br>Contact by surface'],
      ['Stepless', 'Up to 70 mm<br>Self-locking screw'],
      ['70 mm', 'Two arms<br>open in parallel'],
    ],
    foot: 'Not a medical device · 18+',
  },
  spec: {
    pill: 'SIZE &amp; SPEC',
    kicker: 'SPECIFICATIONS',
    h: '100.75 mm · <em>POM resin</em>',
    total: '100.75 mm',
    body: '85 mm',
    open: 'Max 70 mm',
    rows: [
      ['Body', '85 × 20 × 20 mm'],
      ['Opening', 'Up to 70 mm (stepless)'],
      ['Material', 'POM (polyacetal)'],
      ['Origin', 'Made in China · QC &amp; assembly in Japan'],
      ['In the box', 'Tool ×1 · Guide card with QR code ×1'],
      ['Arm', '40 mm'],
      ['Neck', '5 mm (closed)'],
    ],
    foot: 'Box label: “Luca Bloom” only · Shipped in an outer carton · Not a medical device',
  },
  arm: {
    pill: 'ARM DESIGN',
    kicker: 'HOLDS · FLAT CONTACT',
    h: 'Arm <em>shape &amp; section</em>',
    lTitle: 'Reverse taper',
    lText: 'Narrow base → wide tip.<br>Skin is held in the neck, so it does not slip off.',
    rTitle: '6 mm flat face',
    rText: 'Flat outer face, R2 corners.<br>Contact by surface, not by line.',
    base: 'Neck',
    baseW: '5 mm (closed)',
    tip: 'Tip:<br>wide, round',
    w6: '6 mm',
    cap: 'Surface contact',
    foot: 'Drawn to scale from CAD data (arm 40 mm).',
  },
  step: {
    pill: 'STEPLESS',
    kicker: 'TURN THE HANDLE',
    h: 'Stepless.<br><em>Stops where you stop.</em>',
    closed: 'Closed',
    max: 'Max',
    cards: [['1 turn'], ['Adjust', 'Stepless'], ['Release', 'Holds']],
    foot: 'Self-locking screw holds the width when you let go.',
  },
};

export const TEXT = { global: GLOBAL };
