// Luca Bloom LP：共通の部品：描画器の作成・WebGL判定・強制終了時の静止画復帰・ドラッグ回転
import {
  ColorManagement,
  PCFShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

// ---------- 旧版（r128）との見た目合わせ ----------
// ・r128 は色指定（0xe8e4da など）を変換せずに使っていた → 色の自動変換を切る
// ・r128 の光は内部で π 倍されていた → 強さに π を掛ける
ColorManagement.enabled = false;
export const LIGHT = Math.PI;

export const prefersReducedMotion = () =>
  !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 0〜1 のなめらかな補間
export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// WebGL が使えるかを事前に確認（使えない端末で three.js がコンソールにエラーを出すのを防ぐ）
let webglOK;
function hasWebGL() {
  if (webglOK === undefined) {
    try {
      const c = document.createElement('canvas');
      webglOK = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      webglOK = false;
    }
  }
  return webglOK;
}

// WebGL の描画器を作る。使えない端末では null
export function createRenderer(container) {
  if (!hasWebGL()) return null;
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); // 1.5倍を上限に（2倍比で描画量を44%削減）
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;
  container.appendChild(renderer.domElement);
  return renderer;
}

// シェーダーを並行コンパイル（KHR_parallel_shader_compile）してから描画を始める。
// 最初の描画で画面が固まる時間を減らす。未対応のブラウザではすぐに進む
export function whenCompiled(renderer, scene, camera) {
  return renderer.compileAsync ? renderer.compileAsync(scene, camera).catch(() => {}) : Promise.resolve();
}

// WebGL が強制終了された時（メモリ不足など）に、描画を止めて静止画に戻す
export function onContextLost(renderer, stop, fallback) {
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    renderer.domElement.remove();
    if (fallback) fallback.style.display = '';
  });
}

// ドラッグで横回転させる。onMove(dx) に移動量(px)を渡す
export function addDrag(el, onMove) {
  const d = { on: false, x: 0 };
  el.addEventListener('pointerdown', (e) => {
    d.on = true;
    d.x = e.clientX;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* 取得できない端末では無視 */
    }
  });
  el.addEventListener('pointermove', (e) => {
    if (!d.on) return;
    onMove(e.clientX - d.x);
    d.x = e.clientX;
  });
  ['pointerup', 'pointercancel'].forEach((n) => {
    el.addEventListener(n, () => {
      d.on = false;
    });
  });
  return d;
}
