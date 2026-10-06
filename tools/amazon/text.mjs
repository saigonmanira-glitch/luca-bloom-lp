// Amazon 商品画像の文言（版ごと）。tools/amazon/build-images.mjs が使う。
// 表現は海外LPと同じ決まり：病名・効果・比較・最上級・価格・「限定」を入れない（tools/claims.mjs で検査）。
// 日本語版の「業界最大の開き幅※」は比較の表現のため、どの版にも載せない。

// 文字列・配列・オブジェクトの中の文章をまとめて置き換える
const swap = (pairs) => {
  const s = (v) =>
    typeof v === 'string' ? pairs.reduce((x, [a, b]) => x.replace(a, b), v)
      : Array.isArray(v) ? v.map(s)
        : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, s(x)]))
          : v;
  return s;
};

// 英国・オーストラリア・カナダ（英語）
const EN = {
  lang: 'en-GB',
  claims: 'en',
  main: {
    pill: 'Japanese utility model application filed',
    kicker: 'FORESKIN CARE TOOL',
    h: 'A screw-driven<br><em>self-care tool</em>',
    cards: [
      ['Reverse-taper arms', 'Narrow at the base, wider at the tip,<br>shaped not to slip'],
      ['Flat-faced arms', 'A flat face with R2 corners<br>spreads the pressure'],
      ['Stepless adjustment', 'Self-locking: stays put<br>when you let go'],
      ['Up to 70 mm', 'Two arms that open<br>in parallel'],
    ],
    foot: 'Luca Bloom is not a medical device. For adults aged 18 and over.',
  },
  spec: {
    pill: 'SIZE &amp; SPEC',
    kicker: 'SIZE &amp; SPECIFICATIONS',
    h: '100.75 mm long, <em>light resin</em>',
    total: 'Overall length 100.75 mm',
    body: 'Body 85 mm',
    open: 'Opening up to 70 mm',
    rows: [
      ['Body size', '85 × 20 × 20 mm'],
      ['Opening', 'up to 70 mm (stepless)'],
      ['Material', 'POM (polyacetal resin)'],
      ['Made in', 'China (inspected, cleaned and assembled in Japan)'],
      ['In the box', 'device ×1, information card (illustrated guide, QR code) ×1'],
      ['Arm length', '40 mm'],
      ['Neck width', '5 mm (when closed)'],
    ],
    foot: 'The product box shows only “Luca Bloom”, and it ships inside an outer carton. Luca Bloom is not a medical device.',
  },
  arm: {
    pill: 'ARM DESIGN',
    kicker: 'SHAPED NOT TO SLIP, FLAT WHERE IT TOUCHES',
    h: 'Arm <em>shape &amp; cross-section</em>',
    lTitle: 'Reverse-taper arms',
    lText: 'Narrow at the base and wider towards the tip, so the arms are less likely to slip once in place.',
    rTitle: '6 mm flat face',
    rText: 'The outer face is flat with R2 rounded corners, so it rests on a surface rather than a line like a round rod.',
    base: 'Base:<br>narrow neck',
    baseW: '5 mm wide (closed)',
    tip: 'Tip:<br>wide, rounded',
    w6: '6 mm wide',
    cap: 'Rests flat to spread the pressure',
    foot: 'Drawn to the actual dimensions of the DXF drawing (arm length 40 mm); the cross-section is the thickest part of the arm, to scale.',
  },
  step: {
    pill: 'STEPLESS',
    kicker: 'JUST TURN THE HANDLE',
    h: 'Stepless adjustment,<br><em>right where you want it.</em>',
    closed: 'Neck width when closed',
    max: 'Maximum opening',
    cards: [['Per turn of the handle'], ['How it adjusts', 'Stepless'], ['When you let go', 'It stays put']],
    foot: 'Self-locking: the screw holds the arms at that width. It is stepless, so you can stop wherever you like.',
  },
};

// 米国：米国式のつづり・言い回しに直し、仕様にインチを併記する（LP と同じ）
const US = (() => {
  const t = swap([[/towards/g, 'toward'], [/an outer carton/g, 'a plain shipping box']])(EN);
  t.lang = 'en-US';
  t.spec.rows = [
    ['Body size', '85 × 20 × 20 mm (3.3 × 0.8 × 0.8 in)'],
    ['Opening', 'up to 70 mm (2.8 in), stepless'],
    ['Material', 'POM (polyacetal resin)'],
    ['Made in', 'China (inspected, cleaned and assembled in Japan)'],
    ['In the box', 'device ×1, information card (illustrated guide, QR code) ×1'],
    ['Arm length', '40 mm (1.6 in)'],
    ['Neck width', '5 mm (0.2 in) when closed'],
  ];
  return t;
})();

// カナダ（フランス語）：約物はコロンの前・« » の内側に改行しない空白（U+00A0）、小数点はコンマ
const frPunct = swap([[/ ([?!;])/g, '$1'], [/ :/g, ' :'], [/« /g, '« '], [/ »/g, ' »']]);
const FR = frPunct({
  lang: 'fr-CA',
  claims: 'fr',
  main: {
    pill: 'Demande de modèle d’utilité déposée au Japon',
    kicker: 'SOIN DU PRÉPUCE',
    h: 'Un outil de soin<br><em>à vis</em>',
    cards: [
      ['Bras à conicité inversée', 'Étroits à la base, plus larges au bout,<br>conçus pour ne pas glisser'],
      ['Bras à face plane', 'Une face plane aux coins R2<br>répartit la pression'],
      ['Réglage sans paliers', 'Autobloquant : reste en place<br>quand vous lâchez'],
      ['Jusqu’à 70 mm', 'Deux bras qui s’ouvrent<br>en parallèle'],
    ],
    cardSize: 46,
    foot: 'Luca Bloom n’est pas un instrument médical. Réservé aux adultes de 18 ans et plus.',
  },
  spec: {
    pill: 'DIMENSIONS',
    kicker: 'DIMENSIONS ET CARACTÉRISTIQUES',
    h: '100,75 mm de long, <em>résine légère</em>',
    hStyle: 'font-size:96px;top:368px',
    total: 'Longueur totale 100,75 mm',
    body: 'Corps 85 mm',
    open: 'Écartement jusqu’à 70 mm',
    rows: [
      ['Corps', '85 × 20 × 20 mm'],
      ['Écartement', 'jusqu’à 70 mm (sans paliers)'],
      ['Matériau', 'POM (résine polyacétal)'],
      ['Fabrication', 'Chine (inspecté, nettoyé et assemblé au Japon)'],
      ['Contenu', 'dispositif ×1, carte d’information (guide illustré, code QR) ×1'],
      ['Bras', '40 mm de long'],
      ['Col (fermé)', '5 mm de large'],
    ],
    foot: 'La boîte ne porte que la mention « Luca Bloom » et est expédiée dans un carton extérieur. Luca Bloom n’est pas un instrument médical.',
  },
  arm: {
    pill: 'FORME DES BRAS',
    kicker: 'CONÇUS POUR NE PAS GLISSER, PLATS AU CONTACT',
    h: 'Forme et <em>section des bras</em>',
    lTitle: 'Bras à conicité inversée',
    lText: 'Étroits à la base et plus larges vers l’extrémité, les bras glissent moins une fois en place.',
    rTitle: 'Face plane de 6 mm',
    rText: 'La face extérieure est plane, aux coins arrondis R2 : elle s’appuie sur une surface, et non sur une ligne comme une tige ronde.',
    base: 'Base :<br>col étroit',
    baseW: '5 mm de large (fermé)',
    tip: 'Extrémité :<br>large, arrondie',
    w6: '6 mm de large',
    cap: 'Un appui plat qui répartit la pression',
    capSize: 40,
    foot: 'Dessins aux dimensions réelles du plan DXF (bras de 40 mm); la section est celle de la partie la plus épaisse du bras, à l’échelle.',
  },
  step: {
    pill: 'SANS PALIERS',
    kicker: 'IL SUFFIT DE TOURNER LA MOLETTE',
    h: 'Réglage sans paliers,<br><em>exactement où vous voulez.</em>',
    hStyle: 'font-size:100px;top:366px',
    closed: 'Largeur du col, fermé',
    max: 'Écartement maximal',
    cards: [['Par tour de molette'], ['Réglage', 'Sans paliers'], ['Quand vous lâchez', 'Reste en place']],
    cardSize: 58,
    foot: 'Autobloquant : la vis maintient les bras à cet écartement. Sans paliers, vous vous arrêtez où vous voulez.',
  },
});

// メキシコ（スペイン語）：LP と同じく「tú」。小数点はピリオド
const ES = {
  lang: 'es-MX',
  claims: 'es',
  main: {
    pill: 'Solicitud de modelo de utilidad presentada en Japón',
    kicker: 'CUIDADO DEL PREPUCIO',
    h: 'Se ajusta<br><em>con un tornillo</em>',
    cards: [
      ['Brazos en cono invertido', 'Delgados en la base y anchos en la punta,<br>pensados para no resbalar'],
      ['Brazos de cara plana', 'Cara plana con esquinas R2<br>que reparte la presión'],
      ['Ajuste continuo', 'Se bloquea solo:<br>no se mueve al soltarlo'],
      ['Hasta 70 mm', 'Dos brazos que se abren<br>en paralelo'],
    ],
    cardSize: 46,
    foot: 'Luca Bloom no es un dispositivo médico. Solo para mayores de 18 años.',
  },
  spec: {
    pill: 'MEDIDAS',
    kicker: 'MEDIDAS Y ESPECIFICACIONES',
    h: '100.75 mm de largo, <em>resina ligera</em>',
    hStyle: 'font-size:96px;top:368px',
    total: 'Largo total 100.75 mm',
    body: 'Cuerpo 85 mm',
    open: 'Apertura de hasta 70 mm',
    rows: [
      ['Cuerpo', '85 × 20 × 20 mm'],
      ['Apertura', 'hasta 70 mm (ajuste continuo)'],
      ['Material', 'POM (resina poliacetal)'],
      ['Hecho en', 'China (revisado, limpiado y ensamblado en Japón)'],
      ['Contenido', 'herramienta ×1, tarjeta informativa (guía ilustrada, código QR) ×1'],
      ['Brazo', '40 mm de largo'],
      ['Cuello (cerrado)', '5 mm de ancho'],
    ],
    foot: 'La caja solo dice “Luca Bloom” y se envía dentro de una caja de cartón exterior. Luca Bloom no es un dispositivo médico.',
  },
  arm: {
    pill: 'DISEÑO DE LOS BRAZOS',
    kicker: 'NO RESBALA Y APOYA EN PLANO',
    h: 'Forma y <em>sección de los brazos</em>',
    hStyle: 'font-size:92px',
    lTitle: 'Brazos en cono invertido',
    lText: 'Delgados en la base y más anchos hacia la punta, así resbalan menos una vez colocados.',
    rTitle: 'Cara plana de 6 mm',
    rText: 'La cara exterior es plana con esquinas redondeadas R2: apoya sobre una superficie, no sobre una línea como una varilla redonda.',
    base: 'Base:<br>cuello delgado',
    baseW: '5 mm de ancho (cerrado)',
    tip: 'Punta:<br>ancha y redondeada',
    w6: '6 mm de ancho',
    cap: 'Apoya en plano y reparte la presión',
    capSize: 42,
    foot: 'Dibujos con las medidas reales del plano DXF (brazo de 40 mm); la sección es la parte más gruesa del brazo, a escala.',
  },
  step: {
    pill: 'AJUSTE CONTINUO',
    kicker: 'SOLO GIRA LA MANIJA',
    h: 'Ajuste continuo,<br><em>justo donde lo quieres.</em>',
    closed: 'Ancho del cuello, cerrado',
    max: 'Apertura máxima',
    cards: [['Por vuelta de la manija'], ['Cómo se ajusta', 'Continuo'], ['Al soltarla', 'No se mueve']],
    foot: 'Se bloquea sola: el tornillo mantiene los brazos en esa apertura. Es continuo, así que te detienes donde quieras.',
  },
};

export const TEXT = { en: EN, us: US, 'ca-fr': FR, mx: ES };
