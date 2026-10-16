// テスト共通の設定：外部の集計（Cloudflare Web Analytics）には実際に通信せず、空の応答を返す
// （テスト環境はインターネットに出られないため。計測タグがあることと CSP の許可は quality.spec.mjs で確かめる）
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(/cloudflareinsights\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await use(context);
  },
});
export { expect };
