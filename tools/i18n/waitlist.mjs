// 米国・カナダ・メキシコは 2026年11月中旬に発売（米国の FBA に納品し、Amazon.com・Amazon.ca・Amazon.com.mx で同時に販売。遠隔フルフィルメント）。
// それまでは購入ボタンの代わりに、メールで事前登録するボタンと、登録数（発売までの目標 target 件）を表示する。
// 登録した方には、発売したときに1回だけメールで知らせ、その後アドレスを削除する。
//
// 件数の更新：届いたメール（同じアドレスからの2通目は数えない）の合計を count に、数えた日を updated に入れ、
// npm run build を実行してコミットする。発売したら OPEN を true にすると、購入ボタンに戻る。
export const WAITLIST = { open: false, target: 30, count: 0, updated: '2026-10-06' };

const MAIL = 'lucabloom65@gmail.com';
const enc = encodeURIComponent;
const mailto = (subject, body) => `mailto:${MAIL}?subject=${enc(subject)}&body=${enc(body)}`;
// メールアプリが開かない環境（Instagram・X などのアプリ内ブラウザ、メールアプリ未設定のパソコン）向けに、
// ブラウザで開く Gmail・Outlook の作成画面と、アドレスそのものを並べて出す
const webMail = (subject, body) => [
  ['Gmail', `https://mail.google.com/mail/?view=cm&fs=1&to=${MAIL}&su=${enc(subject)}&body=${enc(body)}`],
  ['Outlook', `https://outlook.live.com/mail/0/deeplink/compose?to=${MAIL}&subject=${enc(subject)}&body=${enc(body)}`],
];

// 言語ごとの文面。country：国名、store：その国の Amazon
// メールは「欲しい」の1票として数えるだけで、こちらからは送らない（発売はこのページで知らせる）
const TEXT = {
  en: (country, store) => ({
    buyNote: `On ${store} from mid-November`,
    barSmall: 'Mid-November',
    barAria: 'Pre-register for the launch',
    cta: 'Pre-register by email',
    short: 'Pre-register',
    goal: 'Launching mid-November 2026',
    votes: 'pre-registered',
    left: (n) => n > 0 ? `${n} more to our pre-launch goal` : 'Pre-launch goal reached',
    progress: (count, target) => `${count} of ${target} pre-registered`,
    deal: 'The more pre-registrations, the lower the launch price.',
    note: 'One email per person · No payment or commitment',
    alt: 'Email app not opening? Use',
    or: 'or write to',
    updated: (date) => `Count as of ${date}`,
    shareH: 'Know someone who needs this? Share this page',
    shareText: 'Luca Bloom launches in the US, Canada and Mexico in mid-November. Pre-register here:',
    mail: 'Email',
    subject: `I want Luca Bloom (${country})`,
    body: `Please let me know when Luca Bloom goes on sale.\n\nCountry: ${country}`,
    faq: `Luca Bloom is not on sale in ${country === 'United States' ? 'the United States' : country} yet. It goes on sale on ${store} in mid-November 2026. Pre-register with the email button on this page and we will email you once when it goes on sale.`,
    available: [/Available on Amazon(\.com|\.ca)?\./g, `On ${store} from mid-November 2026.`],
    privacyH: 'Pre-registration and links to Amazon',
    privacy: `<p>If you email us to pre-register, we use your email address only to count pre-registrations and to send you one email when Luca Bloom goes on sale. We do not use your address for anything else, and we delete it after sending that email. You can ask us to delete it at any time.</p><p>After the launch, the buy button will link to a product page on ${store}. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>`,
  }),
  fr: (country, store) => ({
    buyNote: `Sur ${store} dès la mi-novembre`,
    barSmall: 'Mi-novembre',
    barAria: 'Préinscription au lancement',
    cta: 'Se préinscrire par courriel',
    short: 'Préinscription',
    goal: 'Lancement à la mi-novembre 2026',
    votes: 'préinscrits',
    left: (n) => n > 0 ? `Encore ${n} pour notre objectif avant le lancement` : 'Objectif atteint',
    progress: (count, target) => `${count} préinscrits sur ${target}`,
    deal: 'Plus il y a de préinscriptions, plus le prix de lancement baisse.',
    note: 'Un courriel par personne · Aucun paiement ni engagement',
    alt: 'Votre application de courriel ne s’ouvre pas ? Utilisez',
    or: 'ou écrivez à',
    updated: (date) => `Nombre au ${date}`,
    shareH: 'Vous connaissez quelqu’un que ça aiderait ? Partagez cette page',
    shareText: 'Luca Bloom arrive aux États-Unis, au Canada et au Mexique à la mi-novembre. Préinscription ici :',
    mail: 'Courriel',
    subject: `Je veux Luca Bloom (${country})`,
    body: `Merci de m’avertir quand Luca Bloom sera en vente.\n\nPays : ${country}`,
    faq: `Luca Bloom n’est pas encore en vente au ${country}. La vente sur ${store} commencera à la mi-novembre 2026. Préinscrivez-vous avec le bouton courriel de cette page : nous vous écrirons une fois, au lancement.`,
    available: [/Disponible sur Amazon\.ca\./g, `Sur ${store} dès la mi-novembre 2026.`],
    privacyH: 'Préinscription et liens vers Amazon',
    privacy: `<p>Si vous nous écrivez pour vous préinscrire, nous utilisons votre adresse courriel uniquement pour compter les préinscriptions et vous envoyer un courriel au lancement. Nous ne l’utilisons à aucune autre fin et la supprimons après cet envoi. Vous pouvez nous demander de la supprimer en tout temps.</p><p>Après le lancement, le bouton d’achat renverra vers une page produit d’${store}. Lors d’un achat, Amazon traite vos nom, adresse et données de paiement selon sa propre politique de confidentialité. Nous ne recevons pas ces renseignements par le Site.</p>`,
  }),
  es: (country, store) => ({
    buyNote: `En ${store} desde mediados de noviembre`,
    barSmall: 'Mediados de noviembre',
    barAria: 'Preregistro para el lanzamiento',
    cta: 'Preregístrate por correo',
    short: 'Preregistro',
    goal: 'Lanzamiento a mediados de noviembre de 2026',
    votes: 'preregistros',
    left: (n) => n > 0 ? `Faltan ${n} para nuestra meta antes del lanzamiento` : 'Meta alcanzada',
    progress: (count, target) => `${count} de ${target} preregistros`,
    deal: 'Entre más preregistros, más bajo el precio de lanzamiento.',
    note: 'Un correo por persona · Sin pago ni compromiso',
    alt: '¿No se abre tu app de correo? Usa',
    or: 'o escribe a',
    updated: (date) => `Conteo al ${date}`,
    shareH: '¿Conoces a alguien a quien le sirva? Comparte esta página',
    shareText: 'Luca Bloom llega a Estados Unidos, Canadá y México a mediados de noviembre. Preregístrate aquí:',
    mail: 'Correo',
    subject: `Quiero Luca Bloom (${country})`,
    body: `Avísenme cuando Luca Bloom salga a la venta.\n\nPaís: ${country}`,
    faq: `Luca Bloom todavía no está a la venta en ${country}. Saldrá a la venta en ${store} a mediados de noviembre de 2026. Preregístrate con el botón de correo de esta página y te avisaremos una sola vez cuando salga a la venta.`,
    available: [/Disponible en Amazon México\./g, `En ${store} desde mediados de noviembre de 2026.`],
    privacyH: 'Preregistro y enlaces a Amazon',
    privacy: `<p>Si nos escribes para preregistrarte, usamos tu correo electrónico únicamente para contar los preregistros y enviarte un correo cuando Luca Bloom salga a la venta. No usamos tu dirección para ninguna otra finalidad y la eliminamos después de ese envío. Puedes pedirnos que la eliminemos en cualquier momento.</p><p>Después del lanzamiento, el botón de compra enlazará a una página de producto de ${store}. Al comprar, Amazon trata tu nombre, domicilio y datos de pago conforme a su propio aviso de privacidad. Nosotros no recibimos esa información a través del Sitio.</p>`,
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
    waitlist: { ...w, href: mailto(w.subject, w.body), web: webMail(w.subject, w.body), address: MAIL },
    t: { ...L.t, description: fix(L.t.description), buyNote: w.buyNote, barSmall: w.barSmall, barAria: w.barAria, faq },
    privacy: {
      ...L.privacy,
      sections: L.privacy.sections.map(([h, body]) => (/Amazon/.test(h) ? [h.replace(/^(\d+\. ).*/, `$1${w.privacyH}`), w.privacy] : [h, body])),
    },
  };
}
