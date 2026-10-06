// 米国・カナダ・メキシコは、発売を希望するメールが3か国合計で目標数（30件）に達したら、
// 米国の FBA に納品して Amazon.com・Amazon.ca・Amazon.com.mx で同時に発売する（遠隔フルフィルメント）。
// それまでは購入ボタンの代わりに「発売時にメールで知らせてほしい」ボタンと、目標までの残り件数を表示する。
//
// 件数の更新：届いたメール（同じアドレスからの2通目は数えない）の合計を count に、数えた日を updated に入れ、
// npm run build を実行してコミットする。発売したら OPEN を true にすると、購入ボタンに戻る。
export const WAITLIST = { open: false, target: 30, count: 0, updated: '2026-10-06' };

const MAIL = 'lucabloom65@gmail.com';
const mailto = (subject, body) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// 言語ごとの文面。country：国名、store：その国の Amazon
const TEXT = {
  en: (country, store) => ({
    buyNote: `Coming soon to ${store}`,
    barSmall: 'Coming soon',
    barAria: 'Launch notification',
    cta: 'Email me when it launches',
    short: 'Notify me',
    head: (left) => `Launching after 30 requests: <b>${left}</b> to go`,
    progress: (count, target) => `${count} of ${target} requests`,
    note: 'Send us one email if you would like Luca Bloom. When requests from the United States, Canada and Mexico reach 30 in total, we will start selling on Amazon and email you once to let you know. One email per person, please. No payment or commitment.',
    updated: (date) => `Count as of ${date}`,
    subject: `Notify me: Luca Bloom (${country})`,
    body: `Please email me once when Luca Bloom goes on sale on Amazon.\n\nCountry: ${country}`,
    faq: `Luca Bloom is not on sale in ${country === 'United States' ? 'the United States' : country} yet. We will start selling on ${store} once requests from the United States, Canada and Mexico reach 30 in total. Use the button on this page to email us, and we will let you know once.`,
    available: [/Available on Amazon(\.com|\.ca)?\./g, `Coming soon to ${store}.`],
    privacyH: 'Launch notifications and links to Amazon',
    privacy: `<p>If you email us to be notified of the launch, we use your email address only to count requests and to send you one email when Luca Bloom goes on sale on ${store}. We do not use it for anything else, and we delete it after sending that email. You can withdraw at any time by replying “stop” or emailing us. That email will include our address and a way to opt out.</p><p>After the launch, the buy button will link to a product page on ${store}. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>`,
  }),
  fr: (country, store) => ({
    buyNote: `Bientôt sur ${store}`,
    barSmall: 'Bientôt offert',
    barAria: 'Avis de lancement',
    cta: 'M’avertir au lancement',
    short: 'M’avertir',
    head: (left) => `Lancement après 30 demandes : encore <b>${left}</b>`,
    progress: (count, target) => `${count} demandes sur ${target}`,
    note: 'Envoyez-nous un seul courriel si Luca Bloom vous intéresse. Quand les demandes des États-Unis, du Canada et du Mexique atteindront 30 au total, nous commencerons la vente sur Amazon et vous écrirons une fois pour vous avertir. Un courriel par personne, s’il vous plaît. Aucun paiement ni engagement.',
    updated: (date) => `Nombre au ${date}`,
    subject: `M’avertir : Luca Bloom (${country})`,
    body: `Veuillez m’écrire une fois lorsque Luca Bloom sera en vente sur Amazon.\n\nPays : ${country}`,
    faq: `Luca Bloom n’est pas encore en vente au ${country}. La vente sur ${store} commencera quand les demandes des États-Unis, du Canada et du Mexique atteindront 30 au total. Écrivez-nous avec le bouton de cette page : nous vous avertirons une fois.`,
    available: [/Disponible sur Amazon\.ca\./g, `Bientôt sur ${store}.`],
    privacyH: 'Avis de lancement et liens vers Amazon',
    privacy: `<p>Si vous nous écrivez pour être averti du lancement, nous utilisons votre adresse courriel uniquement pour compter les demandes et vous envoyer un seul courriel lorsque Luca Bloom sera en vente sur ${store}. Nous ne l’utilisons à aucune autre fin et la supprimons après l’envoi de ce courriel. Vous pouvez retirer votre consentement en tout temps en répondant « stop » ou en nous écrivant. Ce courriel indiquera notre adresse et un moyen de vous désabonner.</p><p>Après le lancement, le bouton d’achat renverra vers une page produit d’${store}. Lors d’un achat, Amazon traite vos nom, adresse et données de paiement selon sa propre politique de confidentialité. Nous ne recevons pas ces renseignements par le Site.</p>`,
  }),
  es: (country, store) => ({
    buyNote: `Muy pronto en ${store}`,
    barSmall: 'Muy pronto',
    barAria: 'Aviso de lanzamiento',
    cta: 'Avísame por correo al lanzar',
    short: 'Avísame',
    head: (left) => `Lanzamiento al llegar a 30 solicitudes: faltan <b>${left}</b>`,
    progress: (count, target) => `${count} de ${target} solicitudes`,
    note: 'Mándanos un solo correo si quieres Luca Bloom. Cuando las solicitudes de Estados Unidos, Canadá y México sumen 30, empezaremos a vender en Amazon y te escribiremos una vez para avisarte. Un correo por persona, por favor. Sin pago ni compromiso.',
    updated: (date) => `Conteo al ${date}`,
    subject: `Avísame: Luca Bloom (${country})`,
    body: `Por favor, avísenme una vez cuando Luca Bloom esté a la venta en Amazon.\n\nPaís: ${country}`,
    faq: `Luca Bloom todavía no está a la venta en ${country}. Empezaremos a venderla en ${store} cuando las solicitudes de Estados Unidos, Canadá y México sumen 30. Escríbenos con el botón de esta página y te avisaremos una vez.`,
    available: [/Disponible en Amazon México\./g, `Muy pronto en ${store}.`],
    privacyH: 'Avisos de lanzamiento y enlaces a Amazon',
    privacy: `<p>Si nos escribes para que te avisemos del lanzamiento, usamos tu correo electrónico únicamente para contar las solicitudes y enviarte un solo correo cuando Luca Bloom esté a la venta en ${store}. No lo usamos para ninguna otra finalidad y lo eliminamos después de enviar ese correo. Puedes revocar tu consentimiento en cualquier momento respondiendo “baja” o escribiéndonos. Ese correo incluirá nuestro domicilio y una forma de darte de baja.</p><p>Después del lanzamiento, el botón de compra enlazará a una página de producto de ${store}. Al comprar, Amazon trata tu nombre, domicilio y datos de pago conforme a su propio aviso de privacidad. Nosotros no recibimos esa información a través del Sitio.</p>`,
  }),
};

// 発売前の国：言語ファイルに、受付の文面・メールのリンクを加え、販売中を示す文言を差し替える
const PRE = {
  'en-US': ['en', 'United States', 'Amazon.com'],
  'en-CA': ['en', 'Canada', 'Amazon.ca'],
  'fr-CA': ['fr', 'Canada', 'Amazon.ca'],
  'es-MX': ['es', 'México', 'Amazon México'],
};

// フランス語の約物：コロンの前と « » の内側に改行しない空白（U+00A0）
const frPunct = (v) =>
  typeof v === 'string' ? v.replace(/ ([?!;])/g, '$1').replace(/ :/g, '\u00a0:').replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»')
    : typeof v === 'function' ? (...a) => frPunct(v(...a))
      : Array.isArray(v) ? v.map(frPunct)
        : v && typeof v === 'object' && !(v instanceof RegExp) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, frPunct(x)]))
          : v;

export function prelaunch(L) {
  if (WAITLIST.open || !PRE[L.code]) return L;
  const [lang, country, store] = PRE[L.code];
  const w = lang === 'fr' ? frPunct(TEXT[lang](country, store)) : TEXT[lang](country, store);
  const [re, to] = w.available;
  const fix = (s) => s.replace(re, to);
  const faq = L.t.faq.slice(0, -1).concat([[L.t.faq.at(-1)[0], w.faq]]); // 最後の質問が「どこで買えるか」
  return {
    ...L,
    waitlist: { ...w, href: mailto(w.subject, w.body) },
    t: { ...L.t, description: fix(L.t.description), buyNote: w.buyNote, barSmall: w.barSmall, barAria: w.barAria, faq },
    privacy: {
      ...L.privacy,
      sections: L.privacy.sections.map(([h, body]) => (/Amazon/.test(h) ? [h.replace(/^(\d+\. ).*/, `$1${w.privacyH}`), w.privacy] : [h, body])),
    },
  };
}
