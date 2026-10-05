// カナダ向け英語（/ca/）。フランス語版（/ca/fr/）と対。英国版（en-GB）の文章をカナダ式に直す
// （colour・odour・millimetre は英国式のまま、moisturize などの -ize と inquiry は米国式）。
// 規制：カナダ保健省（医療機器規則）、競争法（広告）、個人情報は PIPEDA とケベック州法25号。
import base from './en-GB.mjs';

const ASIN = 'B0HHXQ1X4C';
const MAIL = '<a href="mailto:lucabloom65@gmail.com">lucabloom65@gmail.com</a>';

const CA = [
  [/\bmoisturise/g, 'moisturize'], [/\bMoisturise/g, 'Moisturize'],
  [/\bunauthorised/g, 'unauthorized'], [/\benquir(y|ies)\b/g, 'inquir$1'],
  [/\bstraight away\b/g, 'right away'], [/\bparcel\b/g, 'package'],
  [/Amazon UK and Amazon Australia/g, 'Amazon.ca'],
];
const canadianize = (v) =>
  typeof v === 'string' ? CA.reduce((s, [a, b]) => s.replace(a, b), v)
    : Array.isArray(v) ? v.map(canadianize)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, canadianize(x)]))
        : v;

const t = canadianize(base.t);

export default {
  code: 'en-CA',
  lang: 'en-CA',
  dir: 'ca/',
  ogLocale: 'en_CA',
  support: '/intl/ca/', // マニュアル・免責事項（QR コードと同じサポートページ）
  claims: 'en',
  stores: [{ href: `https://www.amazon.ca/dp/${ASIN}`, cta: 'Buy on Amazon.ca', short: 'Buy on Amazon' }],
  og: base.og,
  t: {
    ...t,
    faq: t.faq.map(([q, a]) => (q === 'Where can I buy it?' ? [q, 'Luca Bloom is available on Amazon.ca in Canada.'] : [q, a])),
  },
  privacy: {
    title: 'Privacy policy | Luca Bloom',
    description: 'How the Luca Bloom website handles personal information: what we collect, why, how long we keep it, our service providers and your rights (PIPEDA and Quebec Law 25).',
    label: 'Privacy Policy',
    h1: 'Privacy policy',
    intro: 'This policy explains how Luca Bloom (“we”, “us”) collects and uses personal information on its official website (https://luca-bloom.com/, the “Site”), in line with the Personal Information Protection and Electronic Documents Act (PIPEDA) and Quebec’s Act respecting the protection of personal information in the private sector (Law 25).',
    sections: [
      ['1. Who we are', `<dl><dt>Organization</dt><dd>Luca Bloom</dd><dt>Address</dt><dd>S-Building 3F, 2-1-19 Roppongi, Minato-ku, Tokyo 106-0032, Japan</dd><dt>Person in charge of the protection of personal information</dt><dd>The operator of Luca Bloom, ${MAIL}</dd></dl>`],
      ['2. What we collect', '<ul><li>If you email us: your email address, your name (if you give it) and the content of your message.</li><li>When you visit the Site: technical data that your browser sends automatically, such as your IP address, browser type, referring page and the date and time of access. These are recorded on the servers of the hosting service listed in section 5.</li></ul><p>The Site does not use cookies or analytics tools. There are no accounts or purchases on the Site, and we do not collect your name, address or payment details through it.</p>'],
      ['3. Purposes and consent', '<p>We use your information only to answer your inquiries, to run the Site securely and to meet our legal obligations. By emailing us, you consent to our using your information to reply to you. You can withdraw your consent at any time by contacting us.</p>'],
      ['4. How long we keep it', '<p>We keep inquiry emails for as long as needed to deal with your inquiry and any follow-up, and no longer than 3 years, after which we delete them.</p>'],
      ['5. Service providers and transfers outside Canada', '<p>The Site is hosted on GitHub Pages (GitHub, Inc., United States), which receives technical data such as your IP address when you view a page. We are based in Japan. Your information may therefore be processed in the United States and Japan and be subject to the laws of those countries. We do not sell personal information.</p>'],
      ['6. Links to Amazon', '<p>The “Buy on Amazon.ca” button links to a product page on Amazon.ca. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>'],
      ['7. Your rights', `<p>You can ask to access or correct your personal information, or withdraw your consent. Quebec residents can also ask for their information in a structured, commonly used technological format. Email us at ${MAIL}; we will respond within 30 days. You can complain to the Office of the Privacy Commissioner of Canada or, in Quebec, to the Commission d’accès à l’information.</p>`],
      ['8. Security', '<p>We take reasonable measures to protect your information against loss, misuse or unauthorized disclosure.</p>'],
      ['9. Changes to this policy', '<p>We may update this policy. The updated policy applies from the time it is published on this page.</p>'],
      ['10. Contact', `<p>Luca Bloom<br>${MAIL}</p>`],
    ],
    date: 'Effective date: October 5, 2026',
  },
};
