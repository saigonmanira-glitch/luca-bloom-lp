// 同梱カードの QR コード（https://luca-bloom.com/intl）から開く、海外向けサポートページ。
//   /intl/              … 国の選択（英語・フランス語・スペイン語・日本語を併記）
//   /intl/{国}/         … その国のマニュアルと免責事項（PDF）の入口・緊急時の連絡先
//   /intl/{国}/manual.html … 図解のマニュアル（図は日本語版 /jp/img/ と共通。図中の文字は英単語とアイコンのみ）
// 文章は各国の PDF（Instructions for Use, Safety Warnings & Terms of Sale）と同じ言葉づかいにそろえる
// （CLOSE の矢印・リリースプレートを下へ押す・1回30分以内・24時間で合計1時間以内・尿道に入れない など）。
// PDF を差し替えるときは、COUNTRIES の pages（ページ数）も直す。
import { SITE } from './site.mjs';

const MAIL = '<a href="mailto:lucabloom65@gmail.com">lucabloom65@gmail.com</a>';

// ---------------- 英語（英国式のつづりを基本に、米国・カナダ向けは置き換える） ----------------
const EN = {
  skip: 'Skip to content',
  langName: 'English',
  label: 'Support',
  hubTitle: 'User guide and safety information',
  hubDescription: (n) => `Luca Bloom support for ${n}: the illustrated user guide, the Instructions for Use, Safety Warnings & Terms of Sale (PDF) and what to do if the device will not come off.`,
  h1: 'Please read before use',
  lead: 'Choose what you would like to see.',
  manualCard: ['Illustrated user guide', 'Step-by-step use, care and storage, and emergency release'],
  pdfTitle: 'Instructions for Use, Safety Warnings &amp; Terms of Sale',
  pdfCard: (n) => `PDF (${n} pages) · age requirement, who should not use it, safety rules, warranty, returns and contact`,
  noticeH: 'If the device will not come off',
  notice: (e) => `Do not pull it. See <a href="manual.html#emergency">emergency release</a>. If you notice pain, congestion, swelling, numbness or a change in colour, stop using it straight away and seek medical care. ${e}`,
  contact: `Contact: ${MAIL}<br>You can also contact us through the order messages on the platform where you bought it.`,
  product: 'Product page',
  change: 'Change country',
  home: 'Support',
  manualTitle: 'User guide | Luca Bloom',
  manualDescription:
    'Illustrated user guide for Luca Bloom: washing, applying cream and inserting, turning the knob (30 minutes at most per session), removal, storage, no boiling and emergency release.',
  manualLabel: 'Guide',
  manualH1: 'User guide',
  manualLead: (pdf) => `Before use, also read the <a href="${pdf}" target="_blank" rel="noopener" type="application/pdf" class="on-navy">Instructions for Use, Safety Warnings &amp; Terms of Sale (PDF)</a>.`,
  beforeH: 'Before you start',
  before: (age) => [
    age,
    'For external use on the foreskin only. Never insert the arms into the urethra (the urinary opening).',
    'Before first use, check the list “Do not use this product if any of the following apply” in the PDF (section 4).',
  ],
  steps: [
    {
      img: 'step1', alt: 'Washing the device with soap and running water',
      n: '① Before and after use', h: 'Wash with a mild detergent',
      p: [
        'Before first use (required) and before and after every use, wash it with a mild detergent and water, then dry it completely. To disinfect it, use isopropyl alcohol.',
        'Before every use, check the product, especially the arms and the release plate, for cracks or damage. Do not use a damaged product.',
      ],
    },
    {
      img: 'step2', alt: 'Applying cream and inserting the tips of the arms',
      n: '②', h: 'Apply cream or oil, then insert the tips',
      p: ['Apply plenty of cream or oil to the arms and the skin. With the arms closed, slowly insert the tips a short distance into the opening of the foreskin, only as far as needed to touch its inner edge. Take care not to pinch skin or hair.'],
    },
    {
      img: 'step3', alt: 'Turning the knob to open the arms, with a 30-minute mark and a warning not to open too far',
      n: '③ 30 minutes at most', h: 'Turn the knob slowly to open',
      p: [
        'Turn the knob slowly to open the arms, and stop well before the point of pain. The arms stay at that width when you let go.',
        'During use, check the glans and foreskin regularly for a change in colour, such as reddish-purple or darker. Stop straight away if you notice one.',
      ],
      warn: '<b>Time limits (for safety)</b> 30 minutes at most per session, and 1 hour at most in total in any 24 hours. Never use it while sleeping.<br><b>Do not open too far</b> Never open it to a point that causes significant pain (bottom right of the picture).',
    },
    {
      img: 'step4', alt: 'Closing the arms and lifting the device off',
      n: '④', h: 'Close the arms, then remove',
      p: ['Turn the knob in the direction of the CLOSE arrow engraved on the side of the body to close the arms, then remove the device slowly. After use, wash it as in step ①, including any cream left on the lead screw (the threaded rod).'],
    },
    {
      img: 'storage', alt: 'Storing the device away from direct sunlight',
      n: 'Storage', h: 'Keep away from sunlight, heat and humidity',
      p: ['Store it at room temperature in a clean place. Keep it out of reach of children.'],
    },
    {
      img: 'no-boil', alt: 'No boiling symbol',
      n: 'Do not', h: 'Do not boil it or use hot water',
      p: ['Boiling or hot water can deform the product. Disinfect it with isopropyl alcohol instead.'],
    },
    {
      img: 'emergency', alt: 'Emergency: moving the release plate, pulling out the shaft and taking the device apart',
      n: 'EMERGENCY', h: 'If it will not come off',
      p: [
        'Do not pull it.',
        '<b>If the knob turns:</b> turn it in the direction of the CLOSE arrow. The arms close and the pressure eases; in most cases you can then remove the device as usual.',
        '<b>If the knob will not turn, or the device still will not come off:</b> do not force it. Slide the release plate (the flat, keyhole-shaped part at the right end of the body) in the direction of the RELEASE arrow shown in the picture, so that the large round opening of the keyhole lines up with the shaft. The shaft passes through and the arms come free.',
      ],
      warn: (e) => `<b>If it still will not come off</b>, do not use any more force. Seek medical attention promptly. ${e}`,
    },
  ],
  stopH: 'Stop using it straight away',
  stop: [
    'If you notice pain, congestion, swelling, numbness, a change in colour or anything unexpected, stop straight away and seek medical care.',
    'If you feel discomfort, first turn the knob in the direction of the CLOSE arrow to ease the pressure. Do not pull the device.',
    'If the foreskin has been drawn back behind the glans and will not return to its normal position, do not leave it: seek emergency medical care immediately.',
    'If the device breaks during use, stop, remove it and recover all the pieces. If a piece remains in the application area, or you cannot confirm that you have recovered every piece, do not try to remove it yourself: seek medical attention promptly. Do not use a product that has broken.',
    'If you notice redness, irritation or any other skin reaction, stop using it.',
  ],
  next: 'Open the Instructions for Use, Safety Warnings &amp; Terms of Sale (PDF)',
  footer: '© Luca Bloom | Luca Bloom is not a medical device.',
};

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
const EN_US = swap([[/colour/g, 'color'], [/straight away/g, 'right away']])(EN);
const EN_CA = swap([[/straight away/g, 'right away']])(EN);

// ---------------- フランス語（カナダ）：PDF と同じ用語（molette・plaque de dégagement・vis-mère・tige） ----------------
// 約物：コロンの前と « » の内側に改行しない空白（U+00A0）、? ! ; の前には入れない
const frPunct = swap([[/ ([?!;])/g, '$1'], [/ :/g, ' :'], [/« /g, '« '], [/ »/g, ' »']]);
const FR = frPunct({
  skip: 'Aller au contenu',
  langName: 'Français',
  label: 'Assistance',
  hubTitle: 'Guide d’utilisation et sécurité',
  hubDescription: (n) => `Assistance Luca Bloom pour le ${n} : le guide illustré, le mode d’emploi, avertissements de sécurité et conditions de vente (PDF) et la marche à suivre si le dispositif ne se détache pas.`,
  h1: 'À lire avant l’utilisation',
  lead: 'Choisissez ce que vous souhaitez consulter.',
  manualCard: ['Guide illustré', 'Utilisation étape par étape, entretien et rangement, dégagement d’urgence'],
  pdfTitle: 'Mode d’emploi, avertissements de sécurité et conditions de vente',
  pdfCard: (n) => `PDF (${n} pages, en français et en anglais) · exigence d’âge, contre-indications, règles de sécurité, retours et coordonnées`,
  noticeH: 'Si le dispositif ne se détache pas',
  notice: (e) => `Ne tirez pas dessus. Consultez la section <a href="manual.html#emergency">Dégagement d’urgence</a>. Si vous ressentez une douleur, une congestion, une enflure, un engourdissement ou remarquez un changement de couleur, cessez immédiatement l’utilisation et consultez un médecin. ${e}`,
  contact: `Courriel : ${MAIL}<br>Vous pouvez aussi nous écrire par la messagerie de la plateforme où vous avez acheté le produit.`,
  product: 'Page du produit',
  change: 'Changer de pays',
  home: 'Assistance',
  manualTitle: 'Guide d’utilisation | Luca Bloom',
  manualDescription:
    'Guide illustré de Luca Bloom : lavage, application de crème et insertion, rotation de la molette (30 minutes au plus par séance), retrait, rangement, ne pas faire bouillir et dégagement d’urgence.',
  manualLabel: 'Guide',
  manualH1: 'Guide d’utilisation',
  manualLead: (pdf) => `Avant l’utilisation, lisez aussi le <a href="${pdf}" target="_blank" rel="noopener" type="application/pdf" class="on-navy">mode d’emploi, avertissements de sécurité et conditions de vente (PDF)</a>.`,
  beforeH: 'Avant de commencer',
  before: (age) => [
    age,
    'Usage externe seulement, sur le prépuce. N’insérez jamais les bras dans l’urètre (l’orifice urinaire).',
    'Avant la première utilisation, vérifiez la liste « N’utilisez pas ce produit si l’un des cas suivants s’applique » dans le PDF (section 4).',
  ],
  steps: [
    {
      img: 'step1', alt: 'Lavage du dispositif à l’eau courante avec du savon',
      n: '① Avant et après l’utilisation', h: 'Lavez avec un détergent doux',
      p: [
        'Avant la première utilisation (obligatoire) ainsi qu’avant et après chaque utilisation, lavez le produit à l’eau avec un détergent doux, puis séchez-le complètement. Pour le désinfecter, utilisez de l’alcool isopropylique.',
        'Avant chaque utilisation, inspectez le produit, en particulier les bras et la plaque de dégagement, afin d’y déceler des fissures ou des dommages. N’utilisez pas un produit endommagé.',
      ],
    },
    {
      img: 'step2', alt: 'Application de crème et insertion de l’extrémité des bras',
      n: '②', h: 'Appliquez une crème ou une huile, puis insérez l’extrémité des bras',
      p: ['Appliquez généreusement une crème ou une huile sur les bras et sur la peau. Bras fermés, insérez lentement l’extrémité des bras sur une courte distance dans l’ouverture du prépuce, seulement jusqu’à toucher son bord interne. Veillez à ne pas pincer la peau ni les poils.'],
    },
    {
      img: 'step3', alt: 'Rotation de la molette pour écarter les bras, avec un repère de 30 minutes et une mise en garde contre un écartement excessif',
      n: '③ 30 minutes au plus', h: 'Tournez lentement la molette pour ouvrir',
      p: [
        'Tournez lentement la molette pour écarter les bras, et arrêtez-vous bien avant le seuil de la douleur. Les bras restent à cet écartement quand vous lâchez la molette.',
        'Pendant l’utilisation, examinez régulièrement le gland et le prépuce afin de repérer un changement de couleur (rouge violé ou plus foncé). Cessez immédiatement si vous en remarquez un.',
      ],
      warn: '<b>Durée maximale (par sécurité)</b> 30 minutes au plus par séance, et 1 heure au plus au total par période de 24 heures. N’utilisez jamais le produit pendant le sommeil.<br><b>N’écartez pas trop</b> N’écartez jamais au point de provoquer une douleur importante (en bas à droite de l’image).',
    },
    {
      img: 'step4', alt: 'Fermeture des bras et retrait du dispositif',
      n: '④', h: 'Fermez les bras, puis retirez le dispositif',
      p: ['Tournez la molette dans le sens de la flèche « CLOSE » (« fermer ») gravée sur le côté du corps pour fermer les bras, puis retirez lentement le dispositif. Après l’utilisation, lavez-le comme à l’étape ①, y compris les restes de crème sur la vis-mère (la tige filetée).'],
    },
    {
      img: 'storage', alt: 'Rangement à l’abri de la lumière directe du soleil',
      n: 'Rangement', h: 'À l’abri du soleil, de la chaleur et de l’humidité',
      p: ['Rangez le produit à température ambiante, dans un endroit propre. Gardez-le hors de la portée des enfants.'],
    },
    {
      img: 'no-boil', alt: 'Symbole interdisant de faire bouillir',
      n: 'À éviter', h: 'Ne faites pas bouillir le produit, pas d’eau chaude',
      p: ['L’eau bouillante ou chaude peut déformer le produit. Désinfectez-le plutôt avec de l’alcool isopropylique.'],
    },
    {
      img: 'emergency', alt: 'Urgence : actionner la plaque de dégagement, retirer la tige et séparer le dispositif',
      n: 'URGENCE', h: 'S’il ne se détache pas',
      p: [
        'Ne tirez pas dessus.',
        '<b>Si la molette tourne :</b> tournez-la dans le sens de la flèche « CLOSE ». Les bras se rapprochent et la pression diminue; dans la plupart des cas, vous pouvez ensuite retirer le dispositif normalement.',
        '<b>Si la molette ne tourne pas, ou si le dispositif ne se détache toujours pas :</b> ne forcez pas. Faites glisser la plaque de dégagement (la pièce plate en forme de trou de serrure, à l’extrémité droite du corps) dans le sens de la flèche « RELEASE » indiquée sur l’image, afin d’aligner la grande ouverture ronde du trou de serrure avec la tige. La tige passe alors à travers et les bras se libèrent.',
      ],
      warn: (e) => `<b>S’il ne se détache toujours pas</b>, n’insistez pas. Consultez rapidement un médecin. ${e}`,
    },
  ],
  stopH: 'Cessez immédiatement l’utilisation',
  stop: [
    'Si vous ressentez une douleur, une congestion, une enflure, un engourdissement, remarquez un changement de couleur ou tout autre problème imprévu, cessez immédiatement et consultez un médecin.',
    'En cas d’inconfort, tournez d’abord la molette dans le sens de la flèche « CLOSE » pour réduire la pression. Ne tirez pas sur le dispositif.',
    'Si le prépuce rétracté reste coincé derrière le gland et ne peut être remis en place, ne le laissez pas ainsi : consultez immédiatement un service d’urgence.',
    'Si le dispositif se brise pendant l’utilisation, cessez, retirez-le et récupérez tous les fragments. Si un fragment demeure dans la zone d’utilisation, ou si vous ne pouvez pas confirmer que tous les fragments ont été récupérés, n’essayez pas de le retirer vous-même : consultez rapidement un médecin. N’utilisez plus un produit qui s’est brisé.',
    'Si vous constatez une rougeur, une irritation ou toute autre réaction cutanée, cessez l’utilisation.',
  ],
  next: 'Ouvrir le mode d’emploi, avertissements de sécurité et conditions de vente (PDF)',
  footer: '© Luca Bloom | Luca Bloom n’est pas un instrument médical.',
});

// ---------------- スペイン語（メキシコ）：PDF と同じく「usted」。用語は perilla・placa de liberación・tornillo de avance・eje ----------------
const ES = {
  skip: 'Ir al contenido',
  langName: 'Español',
  label: 'Soporte',
  hubTitle: 'Guía de uso e información de seguridad',
  hubDescription: (n) => `Soporte de Luca Bloom para ${n}: la guía ilustrada, las Instrucciones de uso, advertencias de seguridad y condiciones de venta (PDF) y qué hacer si el dispositivo no sale.`,
  h1: 'Lea esto antes de usarlo',
  lead: 'Elija lo que desea consultar.',
  manualCard: ['Guía ilustrada', 'Uso paso a paso, cuidado y almacenamiento, y liberación de emergencia'],
  pdfTitle: 'Instrucciones de uso, advertencias de seguridad y condiciones de venta',
  pdfCard: (n) => `PDF (${n} páginas) · requisito de edad, quién no debe usarlo, reglas de seguridad, devoluciones y contacto`,
  noticeH: 'Si el dispositivo no sale',
  notice: (e) => `No lo jale. Consulte la <a href="manual.html#emergency">liberación de emergencia</a>. Si siente dolor, congestión, hinchazón, entumecimiento o nota un cambio de color, deje de usarlo de inmediato y busque atención médica. ${e}`,
  contact: `Correo electrónico: ${MAIL}<br>También puede contactarnos por el sistema de mensajería de la plataforma donde compró el producto.`,
  product: 'Página del producto',
  change: 'Cambiar de país',
  home: 'Soporte',
  manualTitle: 'Guía de uso | Luca Bloom',
  manualDescription:
    'Guía ilustrada de Luca Bloom: lavado, aplicación de crema e inserción, giro de la perilla (máximo 30 minutos por sesión), retiro, almacenamiento, no hervir y liberación de emergencia.',
  manualLabel: 'Guía',
  manualH1: 'Guía de uso',
  manualLead: (pdf) => `Antes de usarlo, lea también las <a href="${pdf}" target="_blank" rel="noopener" type="application/pdf" class="on-navy">Instrucciones de uso, advertencias de seguridad y condiciones de venta (PDF)</a>.`,
  beforeH: 'Antes de empezar',
  before: (age) => [
    age,
    'Solo para uso externo en el prepucio. Nunca inserte los brazos en la uretra (el orificio urinario).',
    'Antes del primer uso, revise la lista «No use este producto si se aplica alguno de los siguientes casos» en el PDF (sección 4).',
  ],
  steps: [
    {
      img: 'step1', alt: 'Lavado del dispositivo con jabón y agua corriente',
      n: '① Antes y después de usarlo', h: 'Lávelo con un detergente suave',
      p: [
        'Antes del primer uso (obligatorio) y antes y después de cada uso, lávelo con agua y un detergente suave, y séquelo por completo. Para desinfectarlo, use alcohol isopropílico.',
        'Antes de cada uso, revise el producto, especialmente los brazos y la placa de liberación, en busca de grietas o daños. No use un producto dañado.',
      ],
    },
    {
      img: 'step2', alt: 'Aplicación de crema e inserción de las puntas de los brazos',
      n: '②', h: 'Aplique crema o aceite e inserte las puntas',
      p: ['Aplique suficiente crema o aceite en los brazos y en la piel. Con los brazos cerrados, inserte lentamente las puntas una corta distancia en la abertura del prepucio, solo hasta tocar su borde interior. Tenga cuidado de no pellizcar la piel o el vello.'],
    },
    {
      img: 'step3', alt: 'Giro de la perilla para separar los brazos, con una marca de 30 minutos y una advertencia de no abrir de más',
      n: '③ Máximo 30 minutos', h: 'Gire la perilla lentamente para abrir',
      p: [
        'Gire la perilla lentamente para separar los brazos y deténgase mucho antes de sentir dolor. Los brazos se quedan en esa apertura al soltar la perilla.',
        'Durante el uso, revise regularmente el glande y el prepucio en busca de un cambio de color (rojo violáceo o más oscuro). Deje de usarlo de inmediato si nota alguno.',
      ],
      warn: '<b>Límites de tiempo (por seguridad)</b> Máximo 30 minutos por sesión y máximo 1 hora en total en cualquier periodo de 24 horas. Nunca lo use mientras duerme.<br><b>No abra de más</b> Nunca abra al grado de causar dolor significativo (abajo a la derecha de la imagen).',
    },
    {
      img: 'step4', alt: 'Cierre de los brazos y retiro del dispositivo',
      n: '④', h: 'Cierre los brazos y luego retírelo',
      p: ['Gire la perilla en la dirección de la flecha CLOSE grabada en el costado del cuerpo para cerrar los brazos, y luego retire el dispositivo lentamente. Después de usarlo, lávelo como en el paso ①, incluidos los restos de crema en el tornillo de avance (la varilla roscada).'],
    },
    {
      img: 'storage', alt: 'Almacenamiento lejos de la luz solar directa',
      n: 'Almacenamiento', h: 'Lejos del sol, el calor y la humedad',
      p: ['Guárdelo a temperatura ambiente en un lugar limpio. Manténgalo fuera del alcance de los niños.'],
    },
    {
      img: 'no-boil', alt: 'Símbolo de prohibido hervir',
      n: 'No', h: 'No lo hierva ni use agua caliente',
      p: ['Hervirlo o usar agua caliente puede deformar el producto. Desinféctelo con alcohol isopropílico.'],
    },
    {
      img: 'emergency', alt: 'Emergencia: mover la placa de liberación, sacar el eje y separar el dispositivo',
      n: 'EMERGENCIA', h: 'Si no sale',
      p: [
        'No lo jale.',
        '<b>Si la perilla gira:</b> gírela en la dirección de la flecha CLOSE. Los brazos se juntan y la presión disminuye; en la mayoría de los casos, después podrá retirar el dispositivo normalmente.',
        '<b>Si la perilla no gira, o el dispositivo sigue sin salir:</b> no lo fuerce. Deslice la placa de liberación (la pieza plana en forma de ojo de cerradura, en el extremo derecho del cuerpo) en la dirección de la flecha RELEASE que muestra la imagen, para alinear la abertura redonda grande del ojo de cerradura con el eje. El eje pasa a través de ella y los brazos se liberan.',
      ],
      warn: (e) => `<b>Si aun así no sale</b>, no siga forzándolo. Busque atención médica de inmediato. ${e}`,
    },
  ],
  stopH: 'Deje de usarlo de inmediato',
  stop: [
    'Si siente dolor, congestión, hinchazón, entumecimiento, nota un cambio de color o cualquier problema inesperado, deténgase de inmediato y busque atención médica.',
    'Si siente incomodidad, primero gire la perilla en la dirección de la flecha CLOSE para reducir la presión. No jale el dispositivo.',
    'Si el prepucio retraído queda atrapado detrás del glande y no puede regresar a su posición normal, no lo deje así: busque atención médica de emergencia de inmediato.',
    'Si el dispositivo se rompe durante el uso, deténgase, retírelo y recupere todos los fragmentos. Si un fragmento permanece en el área de aplicación, o no puede confirmar que recuperó todos, no intente retirarlo usted mismo: busque atención médica de inmediato. No use un producto que se haya roto.',
    'Si nota enrojecimiento, irritación o cualquier otra reacción en la piel, deje de usarlo.',
  ],
  next: 'Abrir las Instrucciones de uso, advertencias de seguridad y condiciones de venta (PDF)',
  footer: '© Luca Bloom | Luca Bloom no es un dispositivo médico.',
};

// ---------------- 国の一覧（国選択ページの並び順） ----------------
// dir：サポートページの場所、lp：その国の商品ページ、pdf：免責事項（dir からの相対パス。カナダは英仏1冊を共有）
// src：元の PDF（アップロードされたファイル）は intl/{国}/terms.pdf としてコミットしてある
export const COUNTRIES = [
  {
    id: 'gb', hreflang: 'en-GB', lang: 'en-GB', name: 'United Kingdom', note: 'English', t: EN, dir: 'intl/gb/', lp: 'en/', pdf: 'terms.pdf', pages: 7,
    age: 'For adults aged 18 and over only.',
    emergency: 'In an emergency, call 999 or 112, or go to the nearest A&amp;E department. For urgent advice that is not an emergency, call NHS 111.',
  },
  {
    id: 'au', hreflang: 'en-AU', lang: 'en-AU', name: 'Australia', note: 'English', t: EN, dir: 'intl/au/', lp: 'en/', pdf: 'terms.pdf', pages: 6,
    age: 'For adults aged 18 and over only.',
    emergency: 'In an emergency, call 000 or go to the nearest hospital emergency department.',
    // 豪州の PDF に記載の電話（日本語のみ）。英語は メール・購入プラットフォームのメッセージで対応
    phone: 'Telephone: <a href="tel:+817038426430">+81&nbsp;70&nbsp;3842&nbsp;6430</a> (Japanese only, weekdays 10:00–17:00 Japan time). For enquiries in English, please use email or the platform messages.',
  },
  {
    id: 'us', hreflang: 'en-US', lang: 'en-US', name: 'United States', note: 'English', t: EN_US, dir: 'intl/us/', lp: 'us/', pdf: 'terms.pdf', pages: 6,
    age: 'For adults only: you must be at least 18, or the age of majority in your state, whichever is greater.',
    emergency: 'In an emergency, call 911 or go to the nearest emergency room.',
  },
  {
    id: 'ca', hreflang: 'en-CA', lang: 'en-CA', name: 'Canada', note: 'English', t: EN_CA, dir: 'intl/ca/', lp: 'ca/', pdf: 'terms.pdf', pages: 14,
    pdfNote: ' (French and English)',
    age: 'For adults only: you must be at least 18, or the age of majority in your province or territory, whichever is greater.',
    emergency: 'In an emergency, call 911 or your local emergency number, or go to the nearest emergency department.',
  },
  {
    id: 'ca-fr', hreflang: 'fr-CA', lang: 'fr-CA', name: 'Canada', note: 'Français', t: FR, dir: 'intl/ca/fr/', lp: 'ca/fr/', pdf: '../terms.pdf', pages: 14,
    age: frPunct('Réservé aux adultes : vous devez avoir au moins 18 ans, ou l’âge de la majorité dans votre province ou territoire s’il est plus élevé.'),
    emergency: 'En cas d’urgence, composez le 911 ou le numéro d’urgence de votre localité, ou rendez-vous à l’urgence la plus proche.',
  },
  {
    id: 'mx', hreflang: 'es-MX', lang: 'es-MX', name: 'México', note: 'Español', t: ES, dir: 'intl/mx/', lp: 'mx/', pdf: 'terms.pdf', pages: 7,
    age: 'Solo para adultos de 18 años o más.',
    emergency: 'En caso de emergencia, llame al 911 o acuda a la sala de urgencias más cercana.',
  },
];

// 生成するページ（テスト・サイトの検査で使う）
export const SUPPORT_PAGES = ['intl/', ...COUNTRIES.flatMap((c) => [c.dir, `${c.dir}manual.html`])];
// 免責事項の PDF（国ごと。カナダの英仏は同じファイル）
export const SUPPORT_PDFS = [...new Set(COUNTRIES.map((c) => new URL(c.pdf, `https://x/${c.dir}`).pathname.slice(1)))];

// hreflang：入口ページ同士・マニュアル同士を相互に指す（日本語版 /jp/ を含む）。入口の x-default は国の選択ページ
export function supportAlternates(kind) {
  const file = kind === 'manual' ? 'manual.html' : '';
  const list = [['ja', `${SITE}jp/${file}`], ...COUNTRIES.map((c) => [c.hreflang, SITE + c.dir + file])];
  if (kind === 'hub') list.push(['x-default', `${SITE}intl/`]);
  return list;
}
export const supportAlternateTags = (kind) =>
  supportAlternates(kind).map(([h, u]) => `<link rel="alternate" hreflang="${h}" href="${u}">`).join('\n');

// ---------------- HTML ----------------
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const GO = '<svg class="go" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="#161A29" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const IC_BOOK = '<span class="ic"><svg viewBox="0 0 30 30" aria-hidden="true"><rect x="5" y="3" width="20" height="24" rx="3" fill="none" stroke="#E3B34E" stroke-width="2.2"/><path d="M10 10h10M10 15h10M10 20h6" stroke="#EEF0F6" stroke-width="2.2" stroke-linecap="round"/></svg></span>';
const IC_SHIELD = '<span class="ic"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3l10 4v7c0 7-4.5 11-10 13C9.5 25 5 21 5 14V7z" fill="none" stroke="#E3B34E" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 9v7" stroke="#EEF0F6" stroke-width="2.4" stroke-linecap="round"/><circle cx="15" cy="20.5" r="1.5" fill="#EEF0F6"/></svg></span>';

function head({ lang, title, description, canonical, alternates = '', crumbs }) {
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
${alternates ? alternates + '\n' : ''}<meta property="og:type" content="website">
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
    ...COUNTRIES.map((c) => ({ href: `/${c.dir}`, lang: c.lang, cc: c.id.slice(0, 2).toUpperCase(), name: c.name, note: c.note })),
    { href: '/jp/', lang: 'ja', cc: 'JP', name: '日本', note: '日本語' },
  ];
  return `${head({
    lang: 'en',
    title: 'Instructions and safety information | Luca Bloom',
    description: 'Select your country to read the Luca Bloom illustrated user guide and the Instructions for Use, Safety Warnings & Terms of Sale.',
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
  <p class="multi"><span lang="fr">Choisissez votre pays</span><span lang="es">Seleccione su país</span><span lang="ja">国を選択してください</span></p>
</div></div>
</header>

<main id="main"><div class="wrap">
  <p class="lead">Instructions for use and safety information · <span lang="fr">Mode d’emploi et sécurité</span> · <span lang="es">Instrucciones y seguridad</span> · <span lang="ja">ご使用マニュアル・免責事項</span></p>
  <ul class="countries">
${items.map((i) => `    <li><a href="${i.href}" hreflang="${i.lang}" lang="${i.lang}"><span class="cc" aria-hidden="true">${i.cc}</span><span><b>${i.name}</b><span>${i.note}</span></span>${GO}</a></li>`).join('\n')}
  </ul>
  <p class="notice" lang="en"><b>If the device will not come off</b><br>Do not pull it. Open your country’s user guide and follow “If it will not come off”. If you notice pain, swelling, numbness or a change in colour, stop using it and seek medical care.</p>
  <p class="contact">Contact: ${MAIL}</p>
</div></main>

${foot('© Luca Bloom')}`;
}

// 国ごとの入口ページ（マニュアル・PDF・緊急時）
export function hubHtml(c) {
  const t = c.t;
  const url = SITE + c.dir;
  return `${head({
    lang: c.lang,
    title: `${t.hubTitle} (${c.name}) | Luca Bloom`,
    description: t.hubDescription(c.name),
    canonical: url,
    alternates: supportAlternateTags('hub'),
    crumbs: [['Luca Bloom', SITE + c.lp], [plain(t.label), url]],
  })}
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
<div class="head"><div class="wrap"><a class="logo" href="/${c.lp}">Luca Bloom</a><nav><a href="/intl/">${t.change}</a></nav></div></div>
<div class="hero"><div class="wrap">
  <p class="label">${t.label} · ${c.name}</p>
  <h1>${t.h1}</h1>
  <p>${t.lead}</p>
</div></div>
</header>

<main id="main"><div class="wrap">
  <div class="choices">
    <a class="choice" href="manual.html">
      ${IC_BOOK}
      <span><b>${t.manualCard[0]}</b><span>${t.manualCard[1]}</span></span>
      ${GO}
    </a>
    <a class="choice" href="${c.pdf}" target="_blank" rel="noopener" type="application/pdf">
      ${IC_SHIELD}
      <span><b>${t.pdfTitle}</b><span>${t.pdfCard(c.pages)}${c.pdfNote || ''}</span></span>
      ${GO}
    </a>
  </div>

  <p class="notice"><b>${t.noticeH}</b><br>${t.notice(c.emergency)}</p>

  <p class="contact">${t.contact}${c.phone ? `<br>${c.phone}` : ''}</p>
  <p class="contact"><a href="/${c.lp}">${t.product}</a> · <a href="/intl/">${t.change}</a></p>
</div></main>

${foot(t.footer)}`;
}

// 国ごとの図解マニュアル
export function manualHtml(c) {
  const t = c.t;
  const url = `${SITE}${c.dir}manual.html`;
  const warn = (w) => (typeof w === 'function' ? w(c.emergency) : w);
  return `${head({
    lang: c.lang,
    title: t.manualTitle.replace(' | ', ` (${c.name}) | `),
    description: t.manualDescription,
    canonical: url,
    alternates: supportAlternateTags('manual'),
    crumbs: [['Luca Bloom', SITE + c.lp], [plain(t.home), SITE + c.dir], [plain(t.manualH1)]],
  })}
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
<div class="head"><div class="wrap"><a class="logo" href="/${c.lp}">Luca Bloom</a><nav><a href="./">${t.home}</a></nav></div></div>
<div class="hero"><div class="wrap">
  <p class="label">${t.manualLabel} · ${c.name}</p>
  <h1>${t.manualH1}</h1>
  <p>${t.manualLead(c.pdf)}</p>
</div></div>
</header>

<main id="main"><div class="wrap">
  <h2 class="sec-h first">${t.beforeH}</h2>
  <ul class="rules">
${t.before(c.age).map((r) => `    <li>${r}</li>`).join('\n')}
  </ul>

  <ol class="steps">
${t.steps
  .map(
    (s) => `    <li class="step"${s.img === 'emergency' ? ' id="emergency"' : ''}>
      <figure><img src="/jp/img/${s.img}.png" width="${s.img === 'emergency' ? 732 : 730}" height="910" alt="${esc(s.alt)}" loading="lazy"></figure>
      <div class="tx"><p class="n">${s.n}</p><h2>${s.h}</h2>
${s.p.map((p) => `        <p>${p}</p>`).join('\n')}${s.warn ? `\n        <p class="warn">${warn(s.warn)}</p>` : ''}</div>
    </li>`,
  )
  .join('\n')}
  </ol>

  <h2 class="sec-h">${t.stopH}</h2>
  <ul class="rules">
${t.stop.map((r) => `    <li>${r}</li>`).join('\n')}
  </ul>

  <a class="next" href="${c.pdf}" target="_blank" rel="noopener" type="application/pdf">${t.next}</a>
</div></main>

${foot(t.footer)}`;
}

// 日本語版のサポートページの CSS に、国選択ページ用の見た目を足したもの
export const SUPPORT_EXTRA_CSS = `
/* intl（tools/i18n/support.mjs） */
html:not([lang="ja"]) body{letter-spacing:.01em}
.hero .multi{display:flex;flex-wrap:wrap;gap:4px 14px}
.lead{font-size:13.5px;color:var(--muted);margin-bottom:16px}
.countries{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.countries a{display:grid;grid-template-columns:48px 1fr 18px;gap:14px;align-items:center;background:var(--white);border:1px solid var(--line);border-radius:16px;padding:14px 16px;text-decoration:none;min-height:72px}
.countries .cc{width:48px;height:48px;border-radius:12px;background:var(--navy);color:var(--gold);display:flex;align-items:center;justify-content:center;font:700 15px/1 var(--font-en);letter-spacing:.08em}
.countries b{display:block;font-size:17px;font-weight:900;line-height:1.4}
.countries span span{display:block;font-size:13px;color:var(--muted)}
.countries .go{width:18px;height:18px}
.sec-h.first{margin-top:0}
.rules + .steps{margin-top:28px}
`;
