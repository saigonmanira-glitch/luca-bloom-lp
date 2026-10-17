// テスト共通の設定：外部の集計（Cloudflare Web Analytics・Google アナリティクス）には実際に通信せず、空の応答を返す
// （テスト環境はインターネットに出られないため。計測タグがあることと CSP の許可は quality.spec.mjs で確かめる）
import { test as base, expect } from '@playwright/test';
import { WAITLIST } from '../tools/i18n/waitlist.mjs';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(/cloudflareinsights\.com|googletagmanager\.com|google-analytics\.com|analytics\.google\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    // 事前登録の件数（本番は Cloudflare Workers が返す。テストのサーバーには無いので、ページに書いてある件数と同じ値を返す）
    await context.route('**/api/waitlist/count', (r) => r.fulfill({ json: { count: WAITLIST.count, target: WAITLIST.target } }));
    await use(context);
  },
});
export { expect };
