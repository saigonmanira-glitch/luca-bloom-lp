// ブラウザ動作テストの設定（Playwright）
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    ...devices['Pixel 7'],
    // テスト環境は GPU がなく CPU で描く（SwiftShader）。本番ではこの環境に 3D を出さないため、
    // 動作テストでは localStorage の lb:3d=force で 3D を必ず表示させる（src/app.js の canRender3D）
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'lb:3d', value: 'force' }] }] },
    launchOptions: {
      // GPUのない環境でも3D（WebGL）を描画できるようにする
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    },
  },
  webServer: {
    command: `node tools/serve.mjs`,
    env: { PORT: String(PORT), ...(process.env.SITE_ROOT ? { SITE_ROOT: process.env.SITE_ROOT } : {}) },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
