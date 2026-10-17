// 構造の欄の静止画（部品が離れた状態の分解図）を作る。3D を出さない端末と、3D の読み込み前に表示する。
//   node tools/build-assembly-still.mjs   → /asm-fallback.webp（1040px）・/asm-fallback-700.webp（700px）
// 実際の LP の 3D（src/scene/assembly.js）を、再生前と同じ状態・背景透明で撮影する。文字を含まないため全言語で共用。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）
/* global document, Image, window */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 4198;
const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const origin = `http://localhost:${PORT}`;
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce', // 自動の再生をしない（撮影する瞬間を固定する）
  bypassCSP: true, // 撮影用に背景を消すスタイルを足すため（このツールの中だけ）
  storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'lb:3d', value: 'force' }] }] },
});
const page = await ctx.newPage();
await page.route(/cloudflareinsights|googletagmanager/, (r) => r.fulfill({ status: 200, body: '' }));
await page.goto(`${origin}/`, { waitUntil: 'load' });
await page.locator('#asmstage').scrollIntoViewIfNeeded();
await page.locator('#asmstage canvas').waitFor({ timeout: 60_000 });
await page.waitForFunction(() => window.__lbAssembly, null, { timeout: 60_000 });
await page.addStyleTag({ content: 'html,body,.structure{background:transparent!important}#asmfb,.asm-stage::before{display:none!important}' });
await page.evaluate(() => window.__lbAssembly.seek(0));
await page.waitForTimeout(800);
const png = await page.locator('#asmstage').screenshot({ omitBackground: true });

const out = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  return [1040, 700].map((w) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.round((img.height * w) / img.width);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    return [w, c.height, c.toDataURL('image/webp', 0.86).split(',')[1]];
  });
}, png.toString('base64'));
for (const [w, h, b64] of out) {
  const file = w === 1040 ? 'asm-fallback.webp' : `asm-fallback-${w}.webp`;
  fs.writeFileSync(path.join(ROOT, file), Buffer.from(b64, 'base64'));
  console.log(`${file} ${w}×${h} ${Math.round(fs.statSync(path.join(ROOT, file)).size / 1024)}KB`);
}
await browser.close();
server.kill();
