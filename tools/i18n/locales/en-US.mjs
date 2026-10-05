// 米国向け（/us/）。英国版（en-GB）の文章を米国式のつづり・言い回しに直し、販売先・数値（インチ併記）・
// プライバシーポリシー（米国の州法に合わせた内容）を差し替える。
// 規制：FDA（医療機器の用途表示）・FTC（広告）。病名・効果をうたう語は tools/claims.mjs で検出する。
import base from './en-GB.mjs';

const ASIN = 'B0HHXQ1X4C';

// 英国式 → 米国式のつづり・言い回し（単語単位）
const US = [
  [/\bcolour/g, 'color'], [/\bColour/g, 'Color'],
  [/\bmoisturise/g, 'moisturize'], [/\bMoisturise/g, 'Moisturize'],
  [/\bunauthorised/g, 'unauthorized'], [/\bodour/g, 'odor'],
  [/\btowards\b/g, 'toward'], [/\bstraight away\b/g, 'right away'],
  [/\bparcel\b/g, 'package'], [/\benquir(y|ies)\b/g, 'inquir$1'],
];
const americanize = (v) =>
  typeof v === 'string' ? US.reduce((s, [a, b]) => s.replace(a, b), v)
    : Array.isArray(v) ? v.map(americanize)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, americanize(x)]))
        : v;

const t = americanize(base.t);

export default {
  code: 'en-US',
  lang: 'en-US',
  dir: 'us/',
  ogLocale: 'en_US',
  support: '/intl/us/', // マニュアル・免責事項（QR コードと同じサポートページ）
  claims: 'en',
  stores: [{ href: `https://www.amazon.com/dp/${ASIN}`, cta: 'Buy on Amazon', short: 'Buy on Amazon' }],
  og: { for: 'Foreskin care tool', lines: ['A private concern,', 'in your own hands.'], chips: ['Opens up to <b>70 mm</b>', 'Stepless', 'Stays where you stop'] },
  t: {
    ...t,
    description:
      'Luca Bloom is a foreskin care tool. Turn the handle and the arms open smoothly up to 70 mm (2.8 in), then stay exactly where you stop, even when you let go. Discreet packaging. Available on Amazon.',
    title: 'Luca Bloom | Foreskin care tool that opens up to 70 mm (2.8 in)',
    props: [['Maximum opening', '70 mm (2.8 in)'], ['Neck width (closed)', '5 mm (0.2 in)'], ['Body size', '85 × 20 × 20 mm (3.3 × 0.8 × 0.8 in)']],
    heroLead: 'Just turn the handle. The arms are shaped not to slip, and they won’t spring back when you let go. Open up to 70 mm (2.8 in), as gradually as you like.',
    badges: [['Up to 70 mm', 'opening width (2.8 in)'], ['Stepless', 'stops where you want'], ['Checked in Japan', 'cleaned &amp; assembled<br>made in China']],
    buyNote: 'Available on Amazon.com',
    worries: [
      'Your foreskin feels tight.',
      'Asking anyone about it feels embarrassing.',
      'Other tools slipped, felt uncomfortable or were hard to stick with.',
      'You don’t want anyone at home to see what’s in the package.',
    ],
    r4: { ...t.r4, h3: 'Opens up to 70 mm (2.8 in)', p: 'One tool covers every width up to 70 mm (2.8 in), so you can choose what suits you. The two arms stay parallel all the way, opening evenly from base to tip.' },
    faq: t.faq.map(([q, a]) => (q === 'Where can I buy it?' ? [q, 'Luca Bloom is available on Amazon.com in the United States.'] : [q, a])),
  },
  privacy: {
    title: 'Privacy policy | Luca Bloom',
    description: 'How the Luca Bloom website handles personal information: what we collect, how we use it, who we share it with and your choices.',
    label: 'Privacy Policy',
    h1: 'Privacy policy',
    intro: 'This policy explains how Luca Bloom (“we”, “us”) collects and uses personal information on its official website (https://luca-bloom.com/, the “Site”).',
    sections: [
      ['1. Who we are', '<dl><dt>Business</dt><dd>Luca Bloom</dd><dt>Address</dt><dd>S-Building 3F, 2-1-19 Roppongi, Minato-ku, Tokyo 106-0032, Japan</dd><dt>Contact</dt><dd><a href="mailto:lucabloom65@gmail.com">lucabloom65@gmail.com</a></dd></dl>'],
      ['2. Information we collect', '<ul><li>If you email us: your email address, your name (if you give it) and the content of your message.</li><li>When you visit the Site: technical data that your browser sends automatically, such as your IP address, browser type, referring page and the date and time of access. These are recorded on the servers of the hosting service listed in section 4.</li></ul><p>The Site does not use cookies, advertising trackers or analytics. There are no accounts or purchases on the Site, and we do not collect your name, address or payment details through it.</p>'],
      ['3. How we use it', '<ul><li>To answer your inquiries.</li><li>To run the Site securely and protect it against misuse.</li><li>To comply with the law.</li></ul>'],
      ['4. Sharing', '<p>We do not sell personal information, and we do not share it for targeted advertising. To deliver the Site we use GitHub Pages (GitHub, Inc., United States), which receives technical data such as your IP address when you view a page. We may disclose information if the law requires it.</p>'],
      ['5. Links to Amazon', '<p>The “Buy on Amazon” button links to a product page on Amazon.com. When you buy, Amazon handles your name, address and payment details under its own privacy notice. We do not receive this information through the Site.</p>'],
      ['6. Your choices and rights', '<p>Depending on the state you live in (for example, California under the CCPA/CPRA), you may have the right to know what personal information we hold about you, to get a copy, to correct it and to delete it. We will not treat you differently for using these rights. To make a request, email us at the address below; we will verify your identity and respond within 45 days. The Site does not track you across websites, so it does not change its behavior in response to Global Privacy Control or Do Not Track signals.</p>'],
      ['7. Children', '<p>The Site and the product are intended for adults aged 18 and over. We do not knowingly collect personal information from children under 13.</p>'],
      ['8. How long we keep it, and security', '<p>We keep inquiry emails for as long as needed to deal with your inquiry and any follow-up, and no longer than 3 years. We take reasonable measures to protect the information we hold.</p>'],
      ['9. Changes to this policy', '<p>We may update this policy. The updated policy applies from the time it is published on this page.</p>'],
      ['10. Contact', '<p>Luca Bloom<br><a href="mailto:lucabloom65@gmail.com">lucabloom65@gmail.com</a></p>'],
    ],
    date: 'Effective date: October 5, 2026',
  },
};
