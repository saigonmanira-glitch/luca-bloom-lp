// 同梱カードの QR コード（https://luca-bloom.com/intl）から開く、海外向けサポートページ。
//   /intl/                 … 国の選択
//   /intl/{国}/            … ご使用マニュアル と 免責事項（PDF）の選択（日本語版 /jp/ を参考にした入口）
//   /intl/{国}/manual.html … ご使用マニュアル。各国の PDF（Instructions for Use, Safety Warnings & Terms of Sale）の
//                            使い方・禁忌・安全ルール・お手入れの内容を、図（/jp/img/ と共用）と合わせてまとめたもの
// 免責事項は各国の PDF（intl/{国}/terms.pdf）。PDF を差し替えたら、ここの文章と COUNTRIES の pages（ページ数）も合わせる。
import { SITE } from './site.mjs';

const MAIL = '<a href="mailto:lucabloom65@gmail.com">lucabloom65@gmail.com</a>';

// ---------------- 英語：英国・豪州・米国・カナダの PDF は同じ文面（医師の呼び方・つづり・緊急連絡先・年齢だけが違う） ----------------
// doc：PDF での医師の呼び方（英国・豪州 a medical practitioner／米国・カナダ a physician）
const en = (doc) => ({
  langName: 'English',
  skip: 'Skip to content',
  hubTitle: 'User Manual & Disclaimer',
  hubDescription: (n) => `Luca Bloom user manual (how to use it, care, who must not use it, emergency release) and disclaimer (PDF) for ${n}.`,
  productLink: 'Product page',
  h1: 'Please read before use',
  lead: 'Choose what you would like to see.',
  manualCard: ['User Manual', 'How to use it, care and storage, who must not use it, and emergency release'],
  pdfCard: ['Disclaimer (PDF)', (n) => `Instructions for Use, Safety Warnings &amp; Terms of Sale | PDF, ${n} pages`],
  noticeH: 'If the device will not come off',
  notice: (e) => `Do not pull it. First turn the knob in the direction of the CLOSE arrow. If the knob will not turn, see <a href="manual.html#emergency">emergency release</a>. If you notice pain, congestion, swelling, numbness or discolouration, stop using it immediately and consult ${doc} promptly. ${e}`,
  contact: `Contact: ${MAIL}<br>You can also contact us through the messaging system of the platform where you bought it.`,
  other: 'Select another country',
  home: 'Home',
  support: 'Support',
  manualTitle: 'User Manual',
  manualDescription: 'Luca Bloom user manual: where it is used, washing and inspection, inserting, turning the knob (30 minutes at most per session), removal, care, who must not use it and emergency release.',
  manualLead: (pdf) => `This manual summarises how to use the product and the safety rules in the <a href="${pdf}" target="_blank" rel="noopener" class="on-navy">Instructions for Use, Safety Warnings &amp; Terms of Sale (PDF)</a>. Read the PDF as well before first use.`,
  areaH: 'Where it is used',
  area: (age) => [
    age,
    'For external use by adult males on the foreskin only. Never insert the arms into the urethra (the urinary opening).',
    'Never insert the arms further than needed to make contact with the inner edge of the foreskin opening.',
    'For use by the original purchaser only. Do not use it on any other part of the body.',
  ],
  steps: [
    {
      img: 'step1', alt: 'Washing the device with water and detergent',
      n: '① Before first use and every use', h: 'Wash and inspect',
      p: [
        'Machining oil and fine residue from manufacturing may remain on the product. Before first use (required), wash it thoroughly with a mild detergent and water, then dry it completely. Wash and dry it after every use as well. To disinfect it, use isopropyl alcohol.',
        'Before every use, check the product, especially the arms and the release plate, for cracks or damage. Do not use a damaged product.',
      ],
    },
    {
      img: 'step2', alt: 'Applying cream and inserting the tips of the arms',
      n: '②', h: 'Apply cream or oil, then insert the tips',
      p: ['Apply cream or oil to the arms and the skin. With the arms closed, insert the tips of the two arms a short distance into the opening of the foreskin. Take care not to pinch skin or hair.'],
    },
    {
      img: 'step3', alt: 'Turning the knob to open the arms, with a 30-minute mark and a warning against opening too far',
      n: '③ 30 minutes at most', h: 'Turn the knob slowly',
      p: [
        'Turning the knob slowly separates the arms and gently widens the opening. The arms stay at that width when you let go.',
        'Never expand to a degree that causes significant pain. Stop well before the point of pain.',
        'During use, check the glans and foreskin regularly for discolouration (reddish-purple, darkening or similar). Stop immediately if any appears.',
      ],
      warn: '<b>Prohibited</b> More than 30 minutes in a single session, more than 1 hour in total in any 24 hours, and use while sleeping.',
    },
    {
      img: 'step4', alt: 'Closing the arms and lifting the device off',
      n: '④', h: 'Close the arms, then remove',
      p: [
        'Turn the knob in the direction of the arrow marked CLOSE on the side of the body to bring the arms back together, then remove the device slowly.',
        'After use, wash any residue off the device, particularly from the lead screw. Avoid prolonged contact with strongly acidic preparations, such as exfoliating products containing glycolic or salicylic acid.',
      ],
    },
    {
      img: 'storage', alt: 'Storing the device away from direct sunlight',
      n: 'Storage', h: 'Away from sunlight, heat and humidity',
      p: [
        'Store it in a clean place at room temperature, away from direct sunlight, heat and humidity. Keep it out of reach of children.',
        'Do not modify, alter or disassemble the product. Dispose of it according to your local rules for plastic waste.',
      ],
    },
    {
      img: 'no-boil', alt: 'No boiling',
      n: 'NG', h: 'Do not boil it or use hot water',
      p: ['Boiling or hot water may deform the product. To disinfect it, use isopropyl alcohol.'],
    },
    {
      img: 'emergency', alt: 'Emergency: operating the release plate, pulling out the shaft and taking the device apart',
      n: 'EMERGENCY', h: 'If it will not come off',
      p: [
        '<b>Do not pull the device forcefully.</b> Forcing it can cause serious injury.',
        '<b>1. Turn the knob toward CLOSE.</b> If you feel discomfort, pain, tightness or numbness, first turn the knob in the direction of the CLOSE arrow. This brings the arms together and reduces the pressure. In most cases you can then remove the device normally.',
        '<b>2. Use the release plate.</b> If the knob will not turn at all, do not force it. If the device still will not come off, use the release plate (the flat, keyhole-shaped part): push it downward so that the large round opening of the keyhole aligns with the shaft. The shaft can then pass through it.',
      ],
      warn: (e) => `<b>If it still cannot be removed</b>, do not continue to force it. Seek medical attention promptly. ${e}`,
    },
  ],
  noH: 'Do not use this product if any of the following apply',
  no: [
    'You are unable to judge, attach, operate or remove the device safely by yourself.',
    'You have a severe metal allergy.',
    'You take anticoagulant (blood-thinning) medication, have any bleeding disorder, or have a severe vascular condition.',
    'You are undergoing treatment related to the application area, or you have reduced sensation due to a circulatory disorder, peripheral neuropathy, diabetes or a similar condition.',
    'You have any wound, bleeding, inflammation, infection, discharge, rash or other abnormality on or within the application area.',
    `The foreskin is already adhered or fused to the glans. Forced expansion can cause severe tearing. Consult ${doc} instead.`,
    'You are under the influence of alcohol, or have taken pain medication, sleep aids, sedatives or similar substances.',
    'Children or infants are nearby, or the product would be stored within their reach (choking and injury hazard).',
  ],
  stopH: 'Stop immediately and seek medical care',
  stop: (e) => [
    `If you experience pain, congestion, swelling, numbness, discolouration or any unexpected problem, stop using the product immediately and consult ${doc} promptly. ${e}`,
    'Never forcibly retract the foreskin when there is not enough slack. If the retracted foreskin becomes trapped behind the glans and cannot be returned to its normal position, seek emergency medical care immediately.',
    `If the inner surface of the foreskin is already adhered to the glans, do not try to force it open. Consult ${doc}.`,
    'If the device breaks during use, stop immediately, remove it and recover all fragments. If a fragment remains in the application area, or you cannot confirm that every fragment has been recovered, do not try to remove it yourself: seek medical attention promptly. Do not use a product that has broken, even if it still seems to work.',
    'If you notice redness, irritation or any other skin reaction, stop using it immediately. Trace metal residue may be present because the factory also processes metal parts.',
  ],
  next: 'Open the Disclaimer (PDF)',
  footer: '© Luca Bloom | This product is not a medical device.',
});

// 文字列・関数の戻り値・配列・オブジェクトの中の文章をまとめて置き換える
const swap = (pairs) => {
  const s = (v) =>
    typeof v === 'string' ? pairs.reduce((x, [a, b]) => x.replace(a, b), v)
      : typeof v === 'function' ? (...a) => s(v(...a))
        : Array.isArray(v) ? v.map(s)
          : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, s(x)]))
            : v;
  return s;
};
// 米国・カナダの PDF のつづり（discoloration・summarize）
const american = swap([[/discolouration/g, 'discoloration'], [/summarises/g, 'summarizes']]);
const EN_UK = en('a medical practitioner');
const EN_NA = american(en('a physician'));

// ---------------- フランス語（カナダ）：カナダの PDF（version française）の用語・文面 ----------------
// 約物：コロンの前と « » の内側に改行しない空白（U+00A0）、? ! ; の前には入れない
const frPunct = swap([[/ ([?!;])/g, '$1'], [/ :/g, ' :'], [/« /g, '« '], [/ »/g, ' »']]);
const FR = frPunct({
  langName: 'Français',
  skip: 'Aller au contenu',
  hubTitle: 'Mode d’emploi et avis de non-responsabilité',
  hubDescription: (n) => `Mode d’emploi de Luca Bloom (utilisation, entretien, contre-indications, dégagement d’urgence) et avis de non-responsabilité (PDF) pour le ${n}.`,
  productLink: 'Page du produit',
  h1: 'À lire avant l’utilisation',
  lead: 'Choisissez ce que vous souhaitez consulter.',
  manualCard: ['Mode d’emploi', 'Utilisation, entretien et rangement, contre-indications et dégagement d’urgence'],
  pdfCard: ['Avis de non-responsabilité (PDF)', (n) => `Mode d’emploi, avertissements de sécurité et conditions de vente | PDF, ${n} pages (français et anglais)`],
  noticeH: 'Si le dispositif ne se détache pas',
  notice: (e) => `Ne tirez pas dessus. Tournez d’abord la molette dans le sens de la flèche « CLOSE ». Si la molette ne tourne pas, consultez le <a href="manual.html#emergency">dégagement d’urgence</a>. Si vous ressentez une douleur, une congestion, une enflure, un engourdissement ou remarquez une décoloration, cessez immédiatement l’utilisation et consultez rapidement un médecin. ${e}`,
  contact: `Courriel : ${MAIL}<br>Vous pouvez aussi nous écrire par la messagerie de la plateforme où vous avez acheté le produit.`,
  other: 'Choisir un autre pays',
  home: 'Accueil',
  support: 'Assistance',
  manualTitle: 'Mode d’emploi',
  manualDescription: 'Mode d’emploi de Luca Bloom : zone d’utilisation, lavage et inspection, insertion, rotation de la molette (30 minutes au plus par séance), retrait, entretien, contre-indications et dégagement d’urgence.',
  manualLead: (pdf) => `Ce mode d’emploi résume l’utilisation du produit et les règles de sécurité du document <a href="${pdf}" target="_blank" rel="noopener" class="on-navy">Mode d’emploi, avertissements de sécurité et conditions de vente (PDF)</a>. Lisez aussi le PDF avant la première utilisation.`,
  areaH: 'Zone d’utilisation',
  area: (age) => [
    age,
    'Usage externe seulement, par des hommes adultes, sur le prépuce. N’insérez jamais les bras dans l’urètre (l’orifice urinaire).',
    'N’insérez jamais les bras au-delà de ce qui est nécessaire pour entrer en contact avec le bord interne de l’ouverture du prépuce.',
    'Réservé à l’usage de l’acheteur lui-même. Ne l’utilisez sur aucune autre partie du corps.',
  ],
  steps: [
    {
      img: 'step1', alt: 'Lavage du dispositif à l’eau avec un détergent',
      n: '① Avant la première utilisation et chaque utilisation', h: 'Lavez et inspectez',
      p: [
        'De l’huile d’usinage et de fines particules issues de la fabrication peuvent subsister sur le produit. Avant la première utilisation (obligatoire), lavez-le soigneusement à l’eau avec un détergent doux, puis séchez-le complètement. Lavez-le et séchez-le aussi après chaque utilisation. Pour le désinfecter, utilisez de l’alcool isopropylique.',
        'Avant chaque utilisation, inspectez le produit, en particulier les bras et la plaque de dégagement, afin d’y déceler des fissures ou des dommages. N’utilisez pas un produit endommagé.',
      ],
    },
    {
      img: 'step2', alt: 'Application de crème et insertion de l’extrémité des bras',
      n: '②', h: 'Appliquez une crème ou une huile, puis insérez l’extrémité des bras',
      p: ['Appliquez une crème ou une huile sur les bras et sur la peau. Bras fermés, insérez l’extrémité des deux bras sur une courte distance dans l’ouverture du prépuce. Veillez à ne pas pincer la peau ni les poils.'],
    },
    {
      img: 'step3', alt: 'Rotation de la molette pour écarter les bras, avec un repère de 30 minutes et une mise en garde contre un écartement excessif',
      n: '③ 30 minutes au plus', h: 'Tournez lentement la molette',
      p: [
        'En tournant lentement la molette, les bras s’écartent et élargissent doucement l’ouverture. Les bras restent à cet écartement quand vous lâchez la molette.',
        'N’écartez jamais au point de provoquer une douleur importante. Arrêtez bien avant le seuil de la douleur.',
        'Pendant l’utilisation, examinez régulièrement le gland et le prépuce afin de repérer une décoloration (rouge violé, assombrissement ou semblable). Cessez immédiatement si elle apparaît.',
      ],
      warn: '<b>Interdit</b> Plus de 30 minutes par séance, plus d’une heure au total par période de 24 heures, et l’utilisation pendant le sommeil.',
    },
    {
      img: 'step4', alt: 'Fermeture des bras et retrait du dispositif',
      n: '④', h: 'Fermez les bras, puis retirez le dispositif',
      p: [
        'Tournez la molette dans le sens de la flèche « CLOSE » (« fermer ») gravée sur le côté du corps pour rapprocher les bras, puis retirez lentement le dispositif.',
        'Après usage, nettoyez tout résidu sur le dispositif, en particulier sur la vis-mère. Évitez tout contact prolongé avec des produits fortement acides, comme les préparations exfoliantes à base d’acide glycolique ou salicylique.',
      ],
    },
    {
      img: 'storage', alt: 'Rangement à l’abri de la lumière directe du soleil',
      n: 'Rangement', h: 'À l’abri du soleil, de la chaleur et de l’humidité',
      p: [
        'Rangez le produit à température ambiante, dans un endroit propre, à l’abri de la lumière directe du soleil, de la chaleur et de l’humidité. Gardez-le hors de la portée des enfants.',
        'Ne modifiez pas, n’altérez pas et ne démontez pas le produit. Éliminez-le conformément à la réglementation sur les déchets de plastique de votre municipalité, province ou territoire.',
      ],
    },
    {
      img: 'no-boil', alt: 'Ne pas faire bouillir',
      n: 'NG', h: 'Ne faites pas bouillir le produit, pas d’eau chaude',
      p: ['L’ébullition ou l’eau chaude pourrait déformer le produit. Pour le désinfecter, utilisez de l’alcool isopropylique.'],
    },
    {
      img: 'emergency', alt: 'Urgence : actionner la plaque de dégagement, retirer la tige et séparer le dispositif',
      n: 'EMERGENCY', h: 'S’il ne se détache pas',
      p: [
        '<b>Ne tirez pas sur le dispositif avec force.</b> Le retirer de force peut causer des blessures graves.',
        '<b>1. Tournez la molette vers « CLOSE ».</b> Si vous ressentez un inconfort, une douleur, un serrement ou un engourdissement, tournez d’abord la molette dans le sens de la flèche « CLOSE ». Les bras se rapprochent et la pression diminue. Dans la plupart des cas, vous pouvez ensuite retirer le dispositif normalement.',
        '<b>2. Utilisez la plaque de dégagement.</b> Si la molette ne tourne plus du tout, ne forcez pas. Si le dispositif ne se détache toujours pas, utilisez la plaque de dégagement (la pièce plate en forme de trou de serrure) : poussez-la vers le bas de manière à aligner la grande ouverture ronde du trou de serrure avec la tige. La tige peut alors la traverser.',
      ],
      warn: (e) => `<b>S’il ne peut toujours pas être retiré</b>, n’insistez pas. Consultez rapidement un médecin. ${e}`,
    },
  ],
  noH: 'N’utilisez pas ce produit si l’un des cas suivants s’applique',
  no: [
    'Vous n’êtes pas en mesure d’évaluer, de poser, d’utiliser ou de retirer le dispositif de façon autonome et sécuritaire.',
    'Vous souffrez d’une allergie grave aux métaux.',
    'Vous prenez un anticoagulant, souffrez d’un trouble de la coagulation ou d’une affection vasculaire grave.',
    'Vous suivez un traitement lié à la zone d’utilisation, ou votre sensibilité y est diminuée en raison d’un trouble circulatoire, d’une neuropathie périphérique, du diabète ou d’une affection semblable.',
    'Vous présentez une plaie, un saignement, une inflammation, une infection, un écoulement, une éruption cutanée ou toute autre anomalie sur la zone d’utilisation ou à l’intérieur de celle-ci.',
    'Le prépuce adhère déjà au gland ou y est soudé. Un écartement forcé peut provoquer une déchirure grave. Consultez plutôt un médecin.',
    'Vous êtes sous l’effet de l’alcool, ou vous avez pris des analgésiques, des somnifères, des sédatifs ou des substances semblables.',
    'Des enfants ou des nourrissons se trouvent à proximité, ou le produit serait rangé à leur portée (risque d’étouffement et de blessure).',
  ],
  stopH: 'Cessez immédiatement et consultez un médecin',
  stop: (e) => [
    `Si vous ressentez une douleur, une congestion, une enflure, un engourdissement, une décoloration ou tout autre problème imprévu, cessez immédiatement d’utiliser le produit et consultez rapidement un médecin. ${e}`,
    'Ne rétractez jamais le prépuce de force lorsque le jeu est insuffisant. Si le prépuce rétracté reste coincé derrière le gland et ne peut être remis en place, consultez immédiatement un service d’urgence.',
    'Si la face interne du prépuce adhère déjà au gland, n’essayez pas de l’ouvrir de force. Consultez un médecin.',
    'Si le dispositif se brise pendant l’utilisation, cessez immédiatement, retirez-le et récupérez tous les fragments. Si un fragment demeure dans la zone d’utilisation, ou si vous ne pouvez pas confirmer que tous les fragments ont été récupérés, n’essayez pas de le retirer vous-même : consultez rapidement un médecin. N’utilisez plus un produit qui s’est brisé, même s’il semble encore fonctionner.',
    'Si vous constatez une rougeur, une irritation ou toute autre réaction cutanée, cessez immédiatement l’utilisation. Des traces de résidus métalliques peuvent être présentes, car l’usine traite aussi des composants métalliques.',
  ],
  next: 'Ouvrir l’avis de non-responsabilité (PDF)',
  footer: '© Luca Bloom | Ce produit n’est pas un instrument médical.',
});

// ---------------- スペイン語（メキシコ）：メキシコの PDF の用語・文面（usted） ----------------
const ES = {
  langName: 'Español',
  skip: 'Ir al contenido',
  hubTitle: 'Manual de uso y aviso de responsabilidad',
  hubDescription: (n) => `Manual de uso de Luca Bloom (uso, cuidado, contraindicaciones y liberación de emergencia) y aviso de responsabilidad (PDF) para ${n}.`,
  productLink: 'Página del producto',
  h1: 'Lea esto antes de usarlo',
  lead: 'Elija lo que desea consultar.',
  manualCard: ['Manual de uso', 'Uso, cuidado y almacenamiento, contraindicaciones y liberación de emergencia'],
  pdfCard: ['Aviso de responsabilidad (PDF)', (n) => `Instrucciones de uso, advertencias de seguridad y condiciones de venta | PDF, ${n} páginas`],
  noticeH: 'Si el dispositivo no sale',
  notice: (e) => `No lo jale. Primero gire la perilla en la dirección de la flecha CLOSE. Si la perilla no gira, consulte la <a href="manual.html#emergency">liberación de emergencia</a>. Si siente dolor, congestión, hinchazón, entumecimiento o nota decoloración, deje de usarlo de inmediato y consulte a un médico lo antes posible. ${e}`,
  contact: `Correo electrónico: ${MAIL}<br>También puede contactarnos a través del sistema de mensajería de la plataforma donde compró este producto.`,
  other: 'Elegir otro país',
  home: 'Inicio',
  support: 'Soporte',
  manualTitle: 'Manual de uso',
  manualDescription: 'Manual de uso de Luca Bloom: área de aplicación, lavado e inspección, inserción, giro de la perilla (máximo 30 minutos por sesión), retiro, cuidado, contraindicaciones y liberación de emergencia.',
  manualLead: (pdf) => `Este manual resume el uso del producto y las reglas de seguridad de las <a href="${pdf}" target="_blank" rel="noopener" class="on-navy">Instrucciones de uso, advertencias de seguridad y condiciones de venta (PDF)</a>. Lea también el PDF antes del primer uso.`,
  areaH: 'Área de aplicación',
  area: (age) => [
    age,
    'Solo para uso externo por hombres adultos en el prepucio. Nunca inserte los brazos en la uretra (el orificio urinario).',
    'Nunca inserte los brazos más allá de lo necesario para hacer contacto con el borde interior de la abertura del prepucio.',
    'Solo para uso del comprador original. No lo use en ninguna otra parte del cuerpo.',
  ],
  steps: [
    {
      img: 'step1', alt: 'Lavado del dispositivo con agua y detergente',
      n: '① Antes del primer uso y de cada uso', h: 'Lave e inspeccione',
      p: [
        'Puede quedar aceite de maquinado y residuos de partículas finas de la fabricación en el producto. Antes del primer uso (obligatorio), lávelo bien con un detergente suave y agua, y séquelo por completo. Lávelo y séquelo también después de cada uso. Para desinfectarlo, use alcohol isopropílico.',
        'Antes de cada uso, inspeccione el producto, especialmente los brazos y la placa de liberación, en busca de grietas o daños. No use un producto dañado.',
      ],
    },
    {
      img: 'step2', alt: 'Aplicación de crema e inserción de las puntas de los brazos',
      n: '②', h: 'Aplique crema o aceite e inserte las puntas',
      p: ['Aplique crema o aceite en los brazos y en la piel. Con los brazos cerrados, inserte las puntas de los dos brazos una corta distancia en la abertura del prepucio. Tenga cuidado de no pellizcar la piel o el vello.'],
    },
    {
      img: 'step3', alt: 'Giro de la perilla para separar los brazos, con una marca de 30 minutos y una advertencia de no abrir de más',
      n: '③ Máximo 30 minutos', h: 'Gire la perilla lentamente',
      p: [
        'Al girar lentamente la perilla, los brazos se separan y ensanchan suavemente la abertura. Los brazos se quedan en esa apertura al soltar la perilla.',
        'Nunca expanda al grado de causar dolor significativo. Deténgase mucho antes de sentir dolor.',
        'Durante el uso, revise regularmente el glande y el prepucio en busca de decoloración (rojo violáceo, oscurecimiento o similar). Deje de usarlo de inmediato si aparece.',
      ],
      warn: '<b>Prohibido</b> Más de 30 minutos en una sola sesión, más de una hora en total en cualquier periodo de 24 horas, y usarlo mientras duerme.',
    },
    {
      img: 'step4', alt: 'Cierre de los brazos y retiro del dispositivo',
      n: '④', h: 'Cierre los brazos y luego retírelo',
      p: [
        'Gire la perilla en la dirección de la flecha marcada CLOSE en el costado del cuerpo para volver a juntar los brazos, y luego retire el dispositivo lentamente.',
        'Después de usarlo, lave cualquier residuo del dispositivo, especialmente del tornillo de avance. Evite el contacto prolongado con preparaciones fuertemente ácidas, como productos exfoliantes que contengan ácido glicólico o salicílico.',
      ],
    },
    {
      img: 'storage', alt: 'Almacenamiento lejos de la luz solar directa',
      n: 'Almacenamiento', h: 'Lejos del sol, el calor y la humedad',
      p: [
        'Guárdelo a temperatura ambiente en un lugar limpio, lejos de la luz solar directa, el calor y la humedad. Manténgalo fuera del alcance de los niños.',
        'No modifique, altere ni desarme el producto. Deséchelo de acuerdo con las regulaciones locales sobre residuos plásticos de su municipio.',
      ],
    },
    {
      img: 'no-boil', alt: 'Prohibido hervir',
      n: 'NG', h: 'No lo hierva ni use agua caliente',
      p: ['Hervirlo o exponerlo a agua caliente puede deformar el producto. Para desinfectarlo, use alcohol isopropílico.'],
    },
    {
      img: 'emergency', alt: 'Emergencia: operar la placa de liberación, sacar el eje y separar el dispositivo',
      n: 'EMERGENCY', h: 'Si no sale',
      p: [
        '<b>No jale el dispositivo con fuerza.</b> Forzarlo puede causar lesiones graves.',
        '<b>1. Gire la perilla hacia CLOSE.</b> Si siente incomodidad, dolor, opresión o entumecimiento, primero gire la perilla en la dirección de la flecha CLOSE. Esto junta los brazos y reduce la presión. En la mayoría de los casos, después podrá retirar el dispositivo normalmente.',
        '<b>2. Use la placa de liberación.</b> Si la perilla no gira en absoluto, no la fuerce. Si el dispositivo sigue sin salir, use la placa de liberación (la pieza plana en forma de ojo de cerradura): empújela hacia abajo para alinear la abertura redonda grande del ojo de cerradura con el eje. Así el eje puede pasar a través de ella.',
      ],
      warn: (e) => `<b>Si aun así no puede retirarse</b>, no continúe forzándolo. Busque atención médica de inmediato. ${e}`,
    },
  ],
  noH: 'No use este producto si se aplica alguno de los siguientes casos',
  no: [
    'No puede evaluar, colocar, operar o retirar el dispositivo de forma independiente y segura.',
    'Tiene una alergia grave a los metales.',
    'Toma medicamentos anticoagulantes, tiene algún trastorno hemorrágico o una afección vascular grave.',
    'Está recibiendo tratamiento relacionado con el área de aplicación, o tiene sensibilidad reducida debido a un trastorno circulatorio, neuropatía periférica, diabetes o afección similar.',
    'Tiene alguna herida, sangrado, inflamación, infección, secreción, sarpullido u otra anomalía en o dentro del área de aplicación.',
    'El prepucio ya está adherido o fusionado al glande. La expansión forzada puede causar desgarros graves. Consulte a un médico en su lugar.',
    'Está bajo la influencia del alcohol, o ha tomado analgésicos, somníferos, sedantes o sustancias similares.',
    'Hay niños o bebés cerca, o el producto se guardaría a su alcance (riesgo de asfixia y lesión).',
  ],
  stopH: 'Deje de usarlo de inmediato y busque atención médica',
  stop: (e) => [
    `Si experimenta dolor, congestión, hinchazón, entumecimiento, decoloración o cualquier problema inesperado, deje de usar el producto de inmediato y consulte a un médico lo antes posible. ${e}`,
    'Nunca retraiga el prepucio a la fuerza cuando no haya suficiente holgura. Si el prepucio retraído queda atrapado detrás del glande y no puede regresar a su posición normal, busque atención médica de emergencia de inmediato.',
    'Si la superficie interna del prepucio ya está adherida al glande, no intente abrirlo a la fuerza. Consulte a un médico.',
    'Si el dispositivo se rompe durante el uso, deje de usarlo de inmediato, retírelo y recupere todos los fragmentos. Si un fragmento permanece en el área de aplicación, o no puede confirmar que se recuperaron todos, no intente retirarlo usted mismo: busque atención médica de inmediato. No use un producto que se haya roto, aunque parezca seguir funcionando.',
    'Si nota enrojecimiento, irritación o cualquier otra reacción en la piel, deje de usarlo de inmediato. Puede haber trazas de residuos metálicos, ya que la fábrica también procesa componentes metálicos.',
  ],
  next: 'Abrir el aviso de responsabilidad (PDF)',
  footer: '© Luca Bloom | Este producto no es un dispositivo médico.',
};

// ---------------- 国の一覧（国選択ページの並び順） ----------------
// dir：サポートページの場所、pdf：免責事項（PDF はアップロードされた各国のファイルをそのまま使う）
// langs：ページに載せる言語（カナダは PDF と同じく1ページにフランス語→英語の順で両方）。
//   lp：その言語の商品ページ、age・emergency：その国の PDF（1. 年齢、5. 緊急時の連絡先）の文面
export const COUNTRIES = [
  {
    id: 'gb', name: 'United Kingdom', dir: 'intl/gb/', pdf: 'terms.pdf', pages: 7,
    langs: [{
      id: 'en', lang: 'en-GB', t: EN_UK, lp: 'en/',
      age: 'You must be at least 18 years of age to use this product.',
      emergency: 'In an emergency, call 999 or 112, or go to the nearest A&amp;E department. For urgent but non-emergency advice, call NHS 111.',
    }],
  },
  {
    id: 'au', name: 'Australia', dir: 'intl/au/', pdf: 'terms.pdf', pages: 6,
    langs: [{
      id: 'en', lang: 'en-AU', t: EN_UK, lp: 'en/',
      age: 'You must be at least 18 years of age to use this product.',
      emergency: 'In an emergency, call 000, or go to the nearest hospital emergency department.',
    }],
  },
  {
    id: 'us', name: 'United States', dir: 'intl/us/', pdf: 'terms.pdf', pages: 6,
    langs: [{
      id: 'en', lang: 'en-US', t: EN_NA, lp: 'us/',
      age: 'You must be at least 18 years of age, or the age of majority in your state or jurisdiction of residence, whichever is greater.',
      emergency: 'In an emergency, call 911 or go to the nearest emergency room.',
    }],
  },
  {
    id: 'ca', name: 'Canada', dir: 'intl/ca/', pdf: 'terms.pdf', pages: 14,
    langs: [
      {
        id: 'fr', lang: 'fr-CA', t: FR, lp: 'ca/fr/',
        age: 'Vous devez être âgé d’au moins 18 ans, ou avoir atteint l’âge de la majorité dans votre province ou territoire de résidence si celui-ci est plus élevé.',
        emergency: 'En cas d’urgence, composez le 911 ou le numéro d’urgence de votre localité, ou rendez-vous à l’urgence la plus proche.',
      },
      {
        id: 'en', lang: 'en-CA', t: EN_NA, lp: 'ca/',
        age: 'You must be at least 18 years of age, or the age of majority in your province or territory of residence, whichever is greater.',
        emergency: 'In an emergency, call 911 or your local emergency number, or go to the nearest emergency department.',
      },
    ],
  },
  {
    id: 'mx', name: 'México', dir: 'intl/mx/', pdf: 'terms.pdf', pages: 7,
    langs: [{
      id: 'es', lang: 'es-MX', t: ES, lp: 'mx/',
      age: 'Debe tener al menos 18 años de edad para usar este producto.',
      emergency: 'En caso de emergencia, llame al 911 o acuda a la sala de urgencias más cercana.',
    }],
  },
];

// 生成するページ（テスト・サイトの検査で使う）
export const SUPPORT_PAGES = ['intl/', ...COUNTRIES.flatMap((c) => [c.dir, `${c.dir}manual.html`])];
// 免責事項の PDF（国ごとに1つ）
export const SUPPORT_PDFS = COUNTRIES.map((c) => c.dir + c.pdf);
// 複数の言語を載せるページでは、言語ごとの見出しに id（#fr・#en）を付ける
const anchor = (c, v) => (c.langs.length > 1 ? `#${v.id}` : '');
const emergencyId = (c, v) => (c.langs.length > 1 ? `emergency-${v.id}` : 'emergency');
// 商品ページから、その国・その言語のマニュアルと免責事項（PDF）へのリンク先
export const supportLink = (c, v) => ({ manual: `/${c.dir}manual.html${anchor(c, v)}`, pdf: `/${c.dir}${c.pdf}` });

// hreflang：入口ページ同士・マニュアル同士を相互に指す（日本語版 /jp/ を含む）。入口の x-default は国の選択ページ
export function supportAlternates(kind) {
  const file = kind === 'manual' ? 'manual.html' : '';
  const list = [['ja', `${SITE}jp/${file}`], ...COUNTRIES.flatMap((c) => c.langs.map((v) => [v.lang, SITE + c.dir + file]))];
  if (kind === 'hub') list.push(['x-default', `${SITE}intl/`]);
  return list;
}
export const supportAlternateTags = (kind) =>
  supportAlternates(kind).map(([h, u]) => `<link rel="alternate" hreflang="${h}" href="${u}">`).join('\n');

// ---------------- HTML（見た目は日本語版 /jp/ と共通） ----------------
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const GO = '<svg class="go" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="#161A29" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const IC_BOOK = '<span class="ic"><svg viewBox="0 0 30 30" aria-hidden="true"><rect x="5" y="3" width="20" height="24" rx="3" fill="none" stroke="#E3B34E" stroke-width="2.2"/><path d="M10 10h10M10 15h10M10 20h6" stroke="#EEF0F6" stroke-width="2.2" stroke-linecap="round"/></svg></span>';
const IC_SHIELD = '<span class="ic"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3l10 4v7c0 7-4.5 11-10 13C9.5 25 5 21 5 14V7z" fill="none" stroke="#E3B34E" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 9v7" stroke="#EEF0F6" stroke-width="2.4" stroke-linecap="round"/><circle cx="15" cy="20.5" r="1.5" fill="#EEF0F6"/></svg></span>';

function head({ lang, title, description, canonical, alternates, crumbs }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Luca Bloom">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}en/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#161A29">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item ? { item } : {}) })) })}
<!-- fonts:start -->
<!-- fonts:end -->
<link rel="stylesheet" href="/intl/support.css">
</head>`;
}

const foot = (text) => `<footer class="foot"><div class="wrap">${text}</div></footer>
<script src="/jp/support.js"></script>
</body>
</html>
`;

// 国の選択ページ（QR コードの読み込み先）
export function selectorHtml() {
  const items = [
    ...COUNTRIES.map((c) => ({ href: `/${c.dir}`, lang: c.langs.length > 1 ? '' : c.langs[0].lang, label: c.name })),
    { href: '/jp/', lang: 'ja', label: '日本（日本語）' },
  ];
  return `${head({
    lang: 'en',
    title: 'Select your country | Luca Bloom',
    description: 'Select your country to read the Luca Bloom user manual and the instructions and disclaimer (PDF).',
    canonical: `${SITE}intl/`,
    alternates: supportAlternateTags('hub'),
    crumbs: [['Luca Bloom', `${SITE}en/`], ['Select your country']],
  })}
<body>
<a class="skip" href="#main">Skip to content</a>
<header>
<div class="head"><div class="wrap"><span class="logo">Luca Bloom</span></div></div>
<div class="hero"><div class="wrap">
  <p class="label">Support</p>
  <h1>Select your country</h1>
  <p>User manual and disclaimer</p>
</div></div>
</header>

<main id="main"><div class="wrap">
  <ul class="countries">
${items.map((i) => `    <li><a href="${i.href}"${i.lang ? ` hreflang="${i.lang}" lang="${i.lang}"` : ''}><b>${i.label}</b>${GO}</a></li>`).join('\n')}
  </ul>
</div></main>

${foot('© Luca Bloom')}`;
}

// 複数の言語を載せるとき、2つ目以降の言語の要素に lang を付ける
const langAttr = (c, v) => (v === c.langs[0] ? '' : ` lang="${v.lang}"`);

// 国ごとの入口ページ（マニュアル・免責事項 PDF・外せないとき・お問い合わせ）
export function hubHtml(c) {
  const [v0] = c.langs;
  const t = v0.t;
  const url = SITE + c.dir;
  const multi = c.langs.length > 1;
  const both = (f, sep) => c.langs.map((v, i) => (i ? `<span lang="${v.lang}">${f(v.t)}</span>` : f(v.t))).join(sep);
  return `${head({
    lang: v0.lang,
    title: multi ? `${c.langs.map((v) => v.t.manualTitle).join(' · ')} (${c.name}) | Luca Bloom` : `${plain(t.hubTitle)} (${c.name}) | Luca Bloom`,
    description: c.langs.map((v) => v.t.hubDescription(c.name)).join(' '),
    canonical: url,
    alternates: supportAlternateTags('hub'),
    crumbs: [[t.home, SITE + v0.lp], [plain(t.hubTitle)]],
  })}
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
<div class="head"><div class="wrap"><a class="logo" href="/${v0.lp}">Luca Bloom</a><nav><a href="/${v0.lp}">${t.productLink}</a></nav></div></div>
<div class="hero"><div class="wrap">
  <p class="label">Support · ${c.name}</p>
  <h1>${both((x) => x.h1, '<br>')}</h1>
  <p>${both((x) => x.lead, ' / ')}</p>
</div></div>
</header>

<main id="main"><div class="wrap">
  <div class="choices">
${c.langs.map((v) => `    <a class="choice" href="manual.html${anchor(c, v)}"${langAttr(c, v)}>
      ${IC_BOOK}
      <span><b>${v.t.manualCard[0]}${multi ? ` (${v.t.langName})` : ''}</b><span>${v.t.manualCard[1]}</span></span>
      ${GO}
    </a>`).join('\n')}
    <a class="choice" href="${c.pdf}" target="_blank" rel="noopener">
      ${IC_SHIELD}
      <span><b>${both((x) => x.pdfCard[0], ' / ')}</b><span>${t.pdfCard[1](c.pages)}</span></span>
      ${GO}
    </a>
  </div>

${c.langs.map((v) => `  <p class="notice"${langAttr(c, v)}><b>${v.t.noticeH}</b><br>${v.t.notice(v.emergency).replace('manual.html#emergency', `manual.html#${emergencyId(c, v)}`)}</p>`).join('\n')}

${c.langs.map((v) => `  <p class="contact"${langAttr(c, v)}>${v.t.contact}</p>`).join('\n')}
  <p class="contact">${both((x) => `<a href="/intl/">${x.other}</a>`, ' / ')}</p>
</div></main>

${foot(both((x) => x.footer, '<br>'))}`;
}

// ご使用マニュアルの本文（1言語分）。その国の PDF の内容
function manualBody(c, v) {
  const t = v.t;
  const multi = c.langs.length > 1;
  const warn = (w) => (typeof w === 'function' ? w(v.emergency) : w);
  return `${multi ? `  <h2 class="lang-h" id="${v.id}">${t.langName}</h2>\n` : ''}  <h2 class="sec-h first">${t.areaH}</h2>
  <ul class="rules">
${t.area(v.age).map((r) => `    <li>${r}</li>`).join('\n')}
  </ul>

  <ol class="steps">
${t.steps
  .map(
    (s) => `    <li class="step"${s.img === 'emergency' ? ` id="${emergencyId(c, v)}"` : ''}>
      <figure><img src="/jp/img/${s.img}.png" width="${s.img === 'emergency' ? 732 : 730}" height="910" alt="${esc(s.alt)}" loading="lazy"></figure>
      <div class="tx"><p class="n">${s.n}</p><h2>${s.h}</h2>
${s.p.map((p) => `        <p>${p}</p>`).join('\n')}${s.warn ? `\n        <p class="warn">${warn(s.warn)}</p>` : ''}</div>
    </li>`,
  )
  .join('\n')}
  </ol>

  <h2 class="sec-h">${t.noH}</h2>
  <ul class="rules">
${t.no.map((r) => `    <li>${r}</li>`).join('\n')}
  </ul>

  <h2 class="sec-h">${t.stopH}</h2>
  <ul class="rules">
${t.stop(v.emergency).map((r) => `    <li>${r}</li>`).join('\n')}
  </ul>

  <a class="next" href="${c.pdf}" target="_blank" rel="noopener">${t.next}</a>`;
}

// 国ごとのご使用マニュアル（カナダはフランス語→英語の順に1ページで）
export function manualHtml(c) {
  const [v0] = c.langs;
  const t = v0.t;
  const url = `${SITE}${c.dir}manual.html`;
  const multi = c.langs.length > 1;
  return `${head({
    lang: v0.lang,
    title: `${c.langs.map((v) => v.t.manualTitle).join(' · ')} (${c.name}) | Luca Bloom`,
    description: c.langs.map((v) => v.t.manualDescription).join(' '),
    canonical: url,
    alternates: supportAlternateTags('manual'),
    crumbs: [[t.home, SITE + v0.lp], [t.support, SITE + c.dir], [t.manualTitle]],
  })}
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
<div class="head"><div class="wrap"><a class="logo" href="/${v0.lp}">Luca Bloom</a><nav><a href="./">${t.support}</a></nav></div></div>
<div class="hero"><div class="wrap">
  <p class="label">Manual</p>
  <h1>${c.langs.map((v, i) => (i ? `<span lang="${v.lang}">${v.t.manualTitle}</span>` : v.t.manualTitle)).join('<br>')}</h1>
${c.langs.map((v) => `  <p${langAttr(c, v)}>${v.t.manualLead(c.pdf)}</p>`).join('\n')}
</div></div>
</header>

<main id="main"><div class="wrap">
  <p class="crumb"><a href="/${v0.lp}">${t.home}</a> / <a href="./">${t.support}</a> / ${t.manualTitle}${multi ? ` | ${c.langs.map((v) => `<a href="#${v.id}"${langAttr(c, v)}>${v.t.langName}</a>`).join(' · ')}` : ''}</p>

${c.langs.map((v) => (v === v0 ? manualBody(c, v) : `  <div lang="${v.lang}">\n${manualBody(c, v)}\n  </div>`)).join('\n\n')}
</div></main>

${foot(c.langs.map((v, i) => (i ? `<span lang="${v.lang}">${v.t.footer}</span>` : v.t.footer)).join('<br>'))}`;
}

// 日本語版のサポートページの CSS に、国選択ページ用の見た目を足したもの
export const SUPPORT_EXTRA_CSS = `
/* intl（tools/i18n/support.mjs） */
html:not([lang="ja"]) body{letter-spacing:.01em}
.countries{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.countries a{display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--white);border:1px solid var(--line);border-radius:16px;padding:18px 18px;text-decoration:none;min-height:64px}
.countries b{font-size:17px;font-weight:900;line-height:1.4}
.countries .go{width:18px;height:18px;flex:none}
.sec-h.first{margin-top:0}
.rules + .steps{margin-top:28px}
.choice b span{display:inline;font-size:inherit;color:inherit;margin:0;line-height:inherit}
.lang-h{font-family:var(--font-en);font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-ink);margin:0 0 10px;padding-top:8px}
.next + .lang-h{margin-top:56px;border-top:1px solid var(--line);padding-top:32px}
`;
