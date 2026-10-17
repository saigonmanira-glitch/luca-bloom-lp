// 米国・カナダ・メキシコは 2026年11月中旬に発売（米国の FBA に納品し、Amazon.com・Amazon.ca・Amazon.com.mx で同時に販売。遠隔フルフィルメント）。
// それまでは購入ボタンの代わりに、メールアドレスを入れるだけの事前登録フォームと、登録数（発売までの目標 target 件）を表示する。
// 送信先は Cloudflare Workers（worker/。https://luca-bloom.com/api/waitlist）で、登録は Cloudflare D1 に保存する。
// 件数はページを開いたときに /api/waitlist/count から最新の値を読み込む（読めないときは下の count を表示）。
// 登録した方には、発売したときに1回だけメールで知らせ、その後アドレスを削除する。
// 発売したら open を true にすると、購入ボタンに戻る。
export const WAITLIST = { open: false, target: 30, count: 0, updated: '2026-10-06' };

const MAIL = 'info@luca-bloom.com';
const enc = encodeURIComponent;
const mailto = (subject, body) => `mailto:${MAIL}?subject=${enc(subject)}&body=${enc(body)}`;
// 言語ごとの文面。country：国名、store：その国の Amazon
const TEXT = {
  en: (country, store) => ({
    buyNote: `On ${store} from mid-November`,
    barSmall: 'Mid-November',
    barAria: 'Pre-register for the launch',
    cta: 'Notify me at launch',
    short: 'Pre-register',
    label: 'Your email address',
    placeholder: 'you@example.com',
    consent: 'We’ll email you once when Luca Bloom goes on sale, then delete your address. Sent by Luca Bloom, Tokyo, Japan (info@luca-bloom.com). You can ask us to delete it at any time.',
    privacyLink: 'Privacy policy',
    sending: 'Sending…',
    ok: 'You’re on the list. We’ll email you once at launch.',
    dup: 'You’re already on the list. Thank you!',
    invalid: 'Please check your email address.',
    rate: 'Too many attempts. Please try again in an hour.',
    fail: 'We couldn’t send this. Please try again, or email info@luca-bloom.com.',
    refH: 'Share your personal link. Every pre-registration brings the launch price down.',
    copy: 'Copy',
    copied: 'Copied',
    live: 'Live count',
    goal: 'Launching mid-November 2026',
    votes: 'pre-registered',
    left: (n) => n > 0 ? `${n} more to our pre-launch goal` : 'Pre-launch goal reached',
    progress: (count, target) => `${count} of ${target} pre-registered`,
    deal: 'The more pre-registrations, the lower the launch price.',
    note: 'One sign-up per email address · No payment or commitment',
    alt: 'Prefer email? Write to',
    updated: (date) => `Count as of ${date}`,
    shareH: 'Know someone who needs this? Share this page',
    shareText: 'Luca Bloom launches in the US, Canada and Mexico in mid-November. Pre-register here:',
    mail: 'Email',
    subject: `I want Luca Bloom (${country})`,
    body: `Please let me know when Luca Bloom goes on sale.\n\nCountry: ${country}`,
    faq: `Luca Bloom is not on sale in ${country === 'United States' ? 'the United States' : country} yet. It goes on sale on ${store} in mid-November 2026. Pre-register with the form on this page and we will email you once when it goes on sale.`,
    available: [/Available on Amazon(\.com|\.ca)?\./g, `On ${store} from mid-November 2026.`],
    privacyH: 'Pre-registration and links to Amazon',
    privacy: `<p>If you pre-register with the form on this page, we store your email address, the page you used and the date in a database that Cloudflare, Inc. (United States) runs for us. We use your address only to count pre-registrations and to send you one email when Luca Bloom goes on sale. We do not use it for anything else, and we delete it after sending that email. You can ask us to delete it at any time. To stop automated or repeated sign-ups, we also keep a one-way code made from your IP address and the date, which cannot be turned back into your IP address. If you share your personal link, sign-ups made through it are linked to yours only to count referrals.</p><p>After the launch, the buy button will link to a product page on ${store}. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>`,
  }),
  fr: (country, store) => ({
    buyNote: `Sur ${store} dès la mi-novembre`,
    barSmall: 'Mi-novembre',
    barAria: 'Préinscription au lancement',
    cta: 'M’avertir au lancement',
    short: 'Préinscription',
    label: 'Votre adresse courriel',
    placeholder: 'vous@exemple.com',
    consent: 'Nous vous écrirons une seule fois, au lancement de Luca Bloom, puis supprimerons votre adresse. Expéditeur : Luca Bloom, Tokyo, Japon (info@luca-bloom.com). Vous pouvez demander sa suppression en tout temps.',
    privacyLink: 'Politique de confidentialité',
    sending: 'Envoi…',
    ok: 'C’est noté ! Nous vous écrirons une fois, au lancement.',
    dup: 'Vous êtes déjà inscrit. Merci !',
    invalid: 'Vérifiez votre adresse courriel.',
    rate: 'Trop d’essais. Réessayez dans une heure.',
    fail: 'Envoi impossible. Réessayez ou écrivez à info@luca-bloom.com.',
    refH: 'Partagez votre lien personnel : chaque préinscription fait baisser le prix de lancement.',
    copy: 'Copier',
    copied: 'Copié',
    live: 'Nombre en direct',
    goal: 'Lancement à la mi-novembre 2026',
    votes: 'préinscrits',
    left: (n) => n > 0 ? `Encore ${n} pour notre objectif avant le lancement` : 'Objectif atteint',
    progress: (count, target) => `${count} préinscrits sur ${target}`,
    deal: 'Plus il y a de préinscriptions, plus le prix de lancement baisse.',
    note: 'Une inscription par adresse · Aucun paiement ni engagement',
    alt: 'Vous préférez le courriel ? Écrivez à',
    updated: (date) => `Nombre au ${date}`,
    shareH: 'Vous connaissez quelqu’un que ça aiderait ? Partagez cette page',
    shareText: 'Luca Bloom arrive aux États-Unis, au Canada et au Mexique à la mi-novembre. Préinscription ici :',
    mail: 'Courriel',
    subject: `Je veux Luca Bloom (${country})`,
    body: `Merci de m’avertir quand Luca Bloom sera en vente.\n\nPays : ${country}`,
    faq: `Luca Bloom n’est pas encore en vente au ${country}. La vente sur ${store} commencera à la mi-novembre 2026. Préinscrivez-vous avec le formulaire de cette page : nous vous écrirons une fois, au lancement.`,
    available: [/Disponible sur Amazon\.ca\./g, `Sur ${store} dès la mi-novembre 2026.`],
    privacyH: 'Préinscription et liens vers Amazon',
    privacy: `<p>Si vous vous préinscrivez avec le formulaire de cette page, nous conservons votre adresse courriel, la page utilisée et la date dans une base de données exploitée pour nous par Cloudflare, Inc. (États-Unis). Nous utilisons votre adresse uniquement pour compter les préinscriptions et vous envoyer un courriel au lancement. Nous ne l’utilisons à aucune autre fin et la supprimons après cet envoi. Vous pouvez nous demander de la supprimer en tout temps. Pour empêcher les inscriptions automatisées ou répétées, nous conservons aussi un code à sens unique calculé à partir de votre adresse IP et de la date, qui ne permet pas de retrouver votre adresse IP. Si vous partagez votre lien personnel, les inscriptions faites par ce lien sont associées à la vôtre uniquement pour compter les recommandations.</p><p>Après le lancement, le bouton d’achat renverra vers une page produit d’${store}. Lors d’un achat, Amazon traite vos nom, adresse et données de paiement selon sa propre politique de confidentialité. Nous ne recevons pas ces renseignements par le Site.</p>`,
  }),
  es: (country, store) => ({
    buyNote: `En ${store} desde mediados de noviembre`,
    barSmall: 'Mediados de noviembre',
    barAria: 'Preregistro para el lanzamiento',
    cta: 'Avísame al lanzamiento',
    short: 'Preregistro',
    label: 'Tu correo electrónico',
    placeholder: 'tu@ejemplo.com',
    consent: 'Te escribiremos una sola vez cuando Luca Bloom salga a la venta y después eliminaremos tu dirección. Remitente: Luca Bloom, Tokio, Japón (info@luca-bloom.com). Puedes pedirnos que la eliminemos en cualquier momento.',
    privacyLink: 'Aviso de privacidad',
    sending: 'Enviando…',
    ok: '¡Listo! Te escribiremos una vez, al lanzamiento.',
    dup: 'Ya estás en la lista. ¡Gracias!',
    invalid: 'Revisa tu correo electrónico.',
    rate: 'Demasiados intentos. Inténtalo de nuevo en una hora.',
    fail: 'No se pudo enviar. Inténtalo de nuevo o escribe a info@luca-bloom.com.',
    refH: 'Comparte tu enlace personal: cada preregistro ayuda a bajar el precio de lanzamiento.',
    copy: 'Copiar',
    copied: 'Copiado',
    live: 'Conteo en vivo',
    goal: 'Lanzamiento a mediados de noviembre de 2026',
    votes: 'preregistros',
    left: (n) => n > 0 ? `Faltan ${n} para nuestra meta antes del lanzamiento` : 'Meta alcanzada',
    progress: (count, target) => `${count} de ${target} preregistros`,
    deal: 'Entre más preregistros, más bajo el precio de lanzamiento.',
    note: 'Un registro por correo · Sin pago ni compromiso',
    alt: '¿Prefieres el correo? Escribe a',
    updated: (date) => `Conteo al ${date}`,
    shareH: '¿Conoces a alguien a quien le sirva? Comparte esta página',
    shareText: 'Luca Bloom llega a Estados Unidos, Canadá y México a mediados de noviembre. Preregístrate aquí:',
    mail: 'Correo',
    subject: `Quiero Luca Bloom (${country})`,
    body: `Avísenme cuando Luca Bloom salga a la venta.\n\nPaís: ${country}`,
    faq: `Luca Bloom todavía no está a la venta en ${country}. Saldrá a la venta en ${store} a mediados de noviembre de 2026. Preregístrate con el formulario de esta página y te avisaremos una sola vez cuando salga a la venta.`,
    available: [/Disponible en Amazon México\./g, `En ${store} desde mediados de noviembre de 2026.`],
    privacyH: 'Preregistro y enlaces a Amazon',
    privacy: `<p>Si te preregistras con el formulario de esta página, guardamos tu correo electrónico, la página que usaste y la fecha en una base de datos que Cloudflare, Inc. (Estados Unidos) opera por nuestra cuenta. Usamos tu dirección únicamente para contar los preregistros y enviarte un correo cuando Luca Bloom salga a la venta. No la usamos para ninguna otra finalidad y la eliminamos después de ese envío. Puedes pedirnos que la eliminemos en cualquier momento. Para evitar registros automáticos o repetidos, también guardamos un código de un solo sentido calculado a partir de tu dirección IP y la fecha, que no permite recuperar tu dirección IP. Si compartes tu enlace personal, los registros hechos con él se asocian al tuyo solo para contar recomendaciones.</p><p>Después del lanzamiento, el botón de compra enlazará a una página de producto de ${store}. Al comprar, Amazon trata tu nombre, domicilio y datos de pago conforme a su propio aviso de privacidad. Nosotros no recibimos esa información a través del Sitio.</p>`,
  }),
};

// 発売前の国：言語ファイルに、受付の文面・メールのリンクを加え、販売中を示す文言を差し替える
const PRE = {
  'en-US': ['en', 'United States', 'Amazon.com', 'us'],
  'en-CA': ['en', 'Canada', 'Amazon.ca', 'ca'],
  'fr-CA': ['fr', 'Canada', 'Amazon.ca', 'ca-fr'],
  'es-MX': ['es', 'México', 'Amazon México', 'mx'],
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
  const [lang, country, store, market] = PRE[L.code];
  const w = lang === 'fr' ? frPunct(TEXT[lang](country, store)) : TEXT[lang](country, store);
  const [re, to] = w.available;
  const fix = (s) => s.replace(re, to);
  const faq = L.t.faq.slice(0, -1).concat([[L.t.faq.at(-1)[0], w.faq]]); // 最後の質問が「どこで買えるか」
  return {
    ...L,
    waitlist: { ...w, market, href: mailto(w.subject, w.body), address: MAIL },
    t: { ...L.t, description: fix(L.t.description), buyNote: w.buyNote, barSmall: w.barSmall, barAria: w.barAria, faq },
    privacy: {
      ...L.privacy,
      sections: L.privacy.sections.map(([h, body]) => (/Amazon/.test(h) ? [h.replace(/^(\d+\. ).*/, `$1${w.privacyH}`), w.privacy] : [h, body])),
    },
  };
}
