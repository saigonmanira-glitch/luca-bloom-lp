// Luca Bloom LP：ヒーローのスクロール連動カメラ（3場面）と引き出し線
//   01 全景 → 02 内部構造（外箱を透過・送りねじとリリースプレートを指す）→ 03 開き幅（アームを指す）
// ヒーローの3D表示を画面に固定（position: sticky）し、その下の空き領域（1.5画面分）を
// スクロールした量で場面を切り替える。描画パスは増やさず、カメラの位置と注視点を動かすだけ。
// 「動きを減らす」設定・overflow: clip 非対応のブラウザでは使わない（CSS で空き領域が 0 になる）。
import { Vector3 } from 'three';
import { smoothstep } from './common.js';

const FRONT = (340 * Math.PI) / 180; // 場面2・3で本体を向ける角度（初期表示と同じ340°）

// カメラ：look＝注視点（本体の座標。null はヒーローの基準注視点）、dir＝注視点からカメラへの向き、k＝基準距離に対する倍率
const SHOTS = [
  { look: null, dir: [-0.3, 0.36, 0.88], k: 1 },
  { look: [0, 6, 0], dir: [-0.25, 0.5, 0.83], k: 0.9 },
  { look: [-6, -24, 0], dir: [-0.15, 0.22, 0.96], k: 0.92 },
];

// 引き出し線の指す位置（本体の座標）と表示する範囲（スクロール進み具合 0〜1）
const POINTS = [
  { key: 'screw', at: [8, 10, 0], from: 0.3, to: 0.64 },
  { key: 'plate', at: [43.4, 12, 0], from: 0.3, to: 0.64 },
  { key: 'arm', at: [-37, -30, 0], from: 0.78, to: 1.01 },
];

// 場面の切り替え位置：0→1 は 0.15〜0.35、1→2 は 0.6〜0.8
const A = [0.15, 0.35];
const B = [0.6, 0.8];

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)); // -π〜π に丸める

export function createTour(stage, base) {
  const root = document.getElementById('tour');
  const space = root && root.querySelector('.tour-space');
  const sticky = root && root.querySelector('.tour-sticky');
  if (!root || !space || !sticky || space.offsetHeight === 0) return null;
  stage.classList.add('tour-on');

  const caps = [...stage.querySelectorAll('.tour-cap li')];
  const marks = POINTS.map((p) => ({ ...p, el: stage.querySelector(`.co[data-k="${p.key}"]`), shown: -1 }));
  const v = new Vector3();
  const look = new Vector3();
  const dir = new Vector3();
  const tmp = new Vector3();
  let p = 0; // 表示中の進み具合（なめらかに追従）
  let cap = -1;
  let w = 0;
  let h = 0;

  const progress = () => {
    const top = parseFloat(sticky.style.top) || 0;
    const r = root.getBoundingClientRect();
    return Math.min(1, Math.max(0, (top - r.top) / space.offsetHeight));
  };

  const shot = (i, device, out) => {
    const s = SHOTS[i];
    if (s.look) device.dev.localToWorld(out.set(...s.look));
    else out.copy(base.look);
    return out;
  };

  return {
    // 画面サイズ変更時：3D表示ブロックを画面の縦中央に固定する
    resize(width, height) {
      w = width;
      h = height;
      sticky.style.top = `${Math.max(0, Math.round((window.innerHeight - sticky.offsetHeight) / 2))}px`;
    },
    // 回転：場面2・3では本体を正面（340°）へ寄せる。戻り値は新しい回転角
    spin(spin, dt) {
      const a = smoothstep(A[0], A[1], p);
      return a > 0.001 ? spin + wrap(FRONT - spin) * Math.min(1, dt * 3 * a) : spin;
    },
    // 自動回転を止めるか（場面2・3の間）
    get holding() {
      return p > A[0];
    },
    // 外箱を透過させる強さ（場面2で1）
    get see() {
      return smoothstep(A[0], A[1], p) * (1 - smoothstep(B[0], B[1], p));
    },
    // 毎フレーム：カメラを置き、引き出し線と場面名を更新する
    update(dt, camera, device) {
      p += (progress() - p) * Math.min(1, dt * 6);
      const a = smoothstep(A[0], A[1], p);
      const b = smoothstep(B[0], B[1], p);
      device.dev.updateWorldMatrix(true, false);
      look.copy(shot(0, device, tmp)).lerp(shot(1, device, v), a).lerp(shot(2, device, v), b);
      dir.fromArray(SHOTS[0].dir).lerp(tmp.fromArray(SHOTS[1].dir), a).lerp(tmp.fromArray(SHOTS[2].dir), b).normalize();
      const k = SHOTS[0].k + (SHOTS[1].k - SHOTS[0].k) * a + (SHOTS[2].k - SHOTS[1].k) * b;
      camera.position.copy(look).addScaledVector(dir, base.dist * k);
      camera.lookAt(look);
      camera.updateMatrixWorld();

      for (const m of marks) {
        const o = smoothstep(m.from, m.from + 0.06, p) * (1 - smoothstep(m.to - 0.06, m.to, p));
        const on = o > 0.01;
        if (on) {
          device.dev.localToWorld(v.set(...m.at)).project(camera);
          m.el.style.transform = `translate(${((v.x + 1) / 2) * w}px,${((1 - v.y) / 2) * h}px)`;
        }
        if (Math.abs(o - m.shown) > 0.01 || (on && m.shown <= 0.01)) {
          m.shown = o;
          m.el.style.opacity = o.toFixed(2);
        }
      }

      const c = p < 0.25 ? 0 : p < 0.7 ? 1 : 2;
      if (c !== cap) {
        cap = c;
        caps.forEach((li, i) => li.classList.toggle('on', i === c));
      }
    },
    disable() {
      stage.classList.remove('tour-on');
      root.classList.add('tour-off');
    },
  };
}
