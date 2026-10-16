// ヒーローの 3D が出るまで（または 3D を出さない端末で）表示する静止画を作る。
//   node tools/build-hero-still.mjs   → /hero-fallback.webp（1040px）・/hero-fallback-700.webp（700px）
// 実際の LP の 3D を、最初に描かれるのと同じ状態（真正面・アーム全閉・背景透明）で撮影するので、
// 静止画から 3D に切り替わっても見た目が変わらない。文字を含まないため、全言語のページで共用する。
// 必要なもの：Playwright の Chromium（CHROMIUM_PATH で指定可）
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 4199;
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
  reducedMotion: 'reduce', // 自動の動きを止め、最初の状態（真正面・全閉・不透明）で止める
  bypassCSP: true, // 撮影用に背景を消すスタイルを足すため（このツールの中だけ）
  storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'lb:3d', value: 'force' }] }] },
});
const page = await ctx.newPage();
await page.goto(`${origin}/`, { waitUntil: 'load' });
await page.locator('#stage canvas').waitFor({ timeout: 60_000 });
await page.waitForTimeout(1500);
// 背景（ページの色・本体の後ろの光）を消し、3D だけを透明な背景で撮る
await page.addStyleTag({ content: 'html,body,.hero{background:transparent!important}.hero .stage::before{display:none!important}#fb{display:none!important}' });
const png = await page.locator('#stage').screenshot({ omitBackground: true });

// ブラウザの画像変換で、透明を保ったまま WebP（2サイズ）にする
/* global document, Image */
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
  const file = w === 1040 ? 'hero-fallback.webp' : `hero-fallback-${w}.webp`;
  fs.writeFileSync(path.join(ROOT, file), Buffer.from(b64, 'base64'));
  console.log(`${file} ${w}×${h} ${Math.round(fs.statSync(path.join(ROOT, file)).size / 1024)}KB`);
}
await browser.close();
server.kill();
