// 米国・カナダ・メキシコは、発売を希望するメールが3か国合計で目標数（30件）に達したら、
// 米国の FBA に納品して Amazon.com・Amazon.ca・Amazon.com.mx で同時に発売する（遠隔フルフィルメント）。
// それまでは購入ボタンの代わりに「欲しい」をメールで1票として送るボタンと、目標までの票数・シェアの呼びかけを表示する。
// こちらからメールは送らない（送り漏れを防ぐため。発売はこのページで知らせる）。
//
// 件数の更新：届いたメール（同じアドレスからの2通目は数えない）の合計を count に、数えた日を updated に入れ、
// npm run build を実行してコミットする。発売したら OPEN を true にすると、購入ボタンに戻る。
export const WAITLIST = { open: false, target: 30, count: 0, updated: '2026-10-06' };

const MAIL = 'lucabloom65@gmail.com';
const mailto = (subject, body) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// 言語ごとの文面。country：国名、store：その国の Amazon
// メールは「欲しい」の1票として数えるだけで、こちらからは送らない（発売はこのページで知らせる）
const TEXT = {
  en: (country, store) => ({
    buyNote: `Coming soon to ${store}`,
    barSmall: 'Coming soon',
    barAria: 'Vote for the launch',
    cta: 'Vote by email: I want one',
    short: 'Vote',
    goal: 'Our goal: launch in 2026',
    votes: 'votes',
    left: (n) => `${n} more to launch`,
    progress: (count, target) => `${count} of ${target} votes`,
    note: 'Send us one email to vote. When votes from the United States, Canada and Mexico reach 30 in total, we will start selling on Amazon. We will not email you: check this page for the count and the launch. One email per person, please. No payment or commitment.',
    updated: (date) => `Count as of ${date}`,
    shareH: 'Help us get there: share this page',
    shareText: 'Luca Bloom launches in the US, Canada and Mexico once 30 people vote. Add your vote:',
    mail: 'Email',
    subject: `I want Luca Bloom (${country})`,
    body: `I would like to buy Luca Bloom when it launches.\n\nCountry: ${country}`,
    faq: `Luca Bloom is not on sale in ${country === 'United States' ? 'the United States' : country} yet. We will start selling on ${store} once votes from the United States, Canada and Mexico reach 30 in total; our goal is to launch in 2026. Vote with the email button on this page, and check this page for the count.`,
    available: [/Available on Amazon(\.com|\.ca)?\./g, `Coming soon to ${store}.`],
    privacyH: 'Launch votes and links to Amazon',
    privacy: `<p>If you email us to vote for the launch, we use your email address only to count votes. We do not send you any emails about the launch, we do not use your address for anything else, and we delete it once Luca Bloom goes on sale. You can ask us to delete it at any time.</p><p>After the launch, the buy button will link to a product page on ${store}. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>`,
  }),
  fr: (country, store) => ({
    buyNote: `Bientôt sur ${store}`,
    barSmall: 'Bientôt offert',
    barAria: 'Voter pour le lancement',
    cta: 'Voter par courriel : j’en veux un',
    short: 'Voter',
    goal: 'Notre objectif : lancement en 2026',
    votes: 'votes',
    left: (n) => `Encore ${n} pour lancer`,
    progress: (count, target) => `${count} votes sur ${target}`,
    note: 'Envoyez-nous un seul courriel pour voter. Quand les votes des États-Unis, du Canada et du Mexique atteindront 30 au total, nous commencerons la vente sur Amazon. Nous ne vous écrirons pas : suivez le nombre et le lancement sur cette page. Un courriel par personne, s’il vous plaît. Aucun paiement ni engagement.',
    updated: (date) => `Nombre au ${date}`,
    shareH: 'Aidez-nous à y arriver : partagez cette page',
    shareText: 'Luca Bloom sera lancé aux États-Unis, au Canada et au Mexique quand 30 personnes auront voté. Ajoutez votre vote :',
    mail: 'Courriel',
    subject: `Je veux Luca Bloom (${country})`,
    body: `J’aimerais acheter Luca Bloom à son lancement.\n\nPays : ${country}`,
    faq: `Luca Bloom n’est pas encore en vente au ${country}. La vente sur ${store} commencera quand les votes des États-Unis, du Canada et du Mexique atteindront 30 au total; notre objectif est un lancement en 2026. Votez avec le bouton courriel de cette page et suivez le nombre ici.`,
    available: [/Disponible sur Amazon\.ca\./g, `Bientôt sur ${store}.`],
    privacyH: 'Votes pour le lancement et liens vers Amazon',
    privacy: `<p>Si vous nous écrivez pour voter pour le lancement, nous utilisons votre adresse courriel uniquement pour compter les votes. Nous ne vous envoyons aucun courriel au sujet du lancement, n’utilisons votre adresse à aucune autre fin et la supprimons dès que Luca Bloom est en vente. Vous pouvez nous demander de la supprimer en tout temps.</p><p>Après le lancement, le bouton d’achat renverra vers une page produit d’${store}. Lors d’un achat, Amazon traite vos nom, adresse et données de paiement selon sa propre politique de confidentialité. Nous ne recevons pas ces renseignements par le Site.</p>`,
  }),
  es: (country, store) => ({
    buyNote: `Muy pronto en ${store}`,
    barSmall: 'Muy pronto',
    barAria: 'Votar por el lanzamiento',
    cta: 'Vota por correo: lo quiero',
    short: 'Votar',
    goal: 'Nuestra meta: lanzar en 2026',
    votes: 'votos',
    left: (n) => `Faltan ${n} para lanzar`,
    progress: (count, target) => `${count} de ${target} votos`,
    note: 'Mándanos un solo correo para votar. Cuando los votos de Estados Unidos, Canadá y México sumen 30, empezaremos a vender en Amazon. No te enviaremos correos: consulta el conteo y el lanzamiento en esta página. Un correo por persona, por favor. Sin pago ni compromiso.',
    updated: (date) => `Conteo al ${date}`,
    shareH: 'Ayúdanos a lograrlo: comparte esta página',
    shareText: 'Luca Bloom se lanzará en Estados Unidos, Canadá y México cuando 30 personas voten. Suma tu voto:',
    mail: 'Correo',
    subject: `Quiero Luca Bloom (${country})`,
    body: `Me gustaría comprar Luca Bloom cuando salga a la venta.\n\nPaís: ${country}`,
    faq: `Luca Bloom todavía no está a la venta en ${country}. Empezaremos a venderla en ${store} cuando los votos de Estados Unidos, Canadá y México sumen 30; nuestra meta es lanzarla en 2026. Vota con el botón de correo de esta página y consulta aquí el conteo.`,
    available: [/Disponible en Amazon México\./g, `Muy pronto en ${store}.`],
    privacyH: 'Votos para el lanzamiento y enlaces a Amazon',
    privacy: `<p>Si nos escribes para votar por el lanzamiento, usamos tu correo electrónico únicamente para contar los votos. No te enviamos correos sobre el lanzamiento, no usamos tu dirección para ninguna otra finalidad y la eliminamos en cuanto Luca Bloom esté a la venta. Puedes pedirnos que la eliminemos en cualquier momento.</p><p>Después del lanzamiento, el botón de compra enlazará a una página de producto de ${store}. Al comprar, Amazon trata tu nombre, domicilio y datos de pago conforme a su propio aviso de privacidad. Nosotros no recibimos esa información a través del Sitio.</p>`,
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
