// ESLint（JavaScriptの文法・不具合チェック）の設定
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['assets/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
  },
  {
    // サポートページ用のスクリプト（ビルドせずそのまま配信する通常のスクリプト）
    files: ['jp/**/*.js'],
    languageOptions: { ecmaVersion: 2020, sourceType: 'script', globals: globals.browser },
  },
  {
    // Amazon 用動画の描画（ブラウザ内で実行）
    files: ['tools/video/scene.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['tools/**/*.mjs', '*.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
  {
    // テストと動画の書き出しは、ブラウザ内で実行するコードも含む
    files: ['tests/**/*.mjs', 'tools/video/render.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
