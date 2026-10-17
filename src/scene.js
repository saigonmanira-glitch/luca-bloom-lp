// Luca Bloom LP：3D表示の入口（ヒーローの本体モデル・化粧箱モデル）
// three.js r186。部品は src/scene/ 以下に役割ごとに分けている。
//   common.js  描画器・WebGL判定・ドラッグなど共通処理
//   device.js  本体一式の形状と素材
//   sleeve.js  半透明の膜
//   hero.js    ヒーローの本体モデル
//   box.js     化粧箱（box-foam.js は梱包材の図面座標）
//   assembly.js 構造の欄（部品が組み上がる演出）
import { initHero } from './scene/hero.js';
import { initBox } from './scene/box.js';
import { initAssembly } from './scene/assembly.js';

// ヒーローはすぐに、構造の欄と化粧箱は表示領域が画面に近づいてから（400px手前）作る。
// 読み込み直後の処理量とGPUメモリを減らし、操作への反応（INP）を妨げない
export function initScenes(state) {
  initHero(state);
  whenNear('asmstage', initAssembly);
  whenNear('boxstage', initBox);
}

// 表示領域が画面に近づいたら（400px手前）作る
function whenNear(id, init) {
  const st = document.getElementById(id);
  if (!st) return;
  if (!('IntersectionObserver' in window)) {
    init();
    return;
  }
  const io = new IntersectionObserver(
    (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      init();
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(st);
}
