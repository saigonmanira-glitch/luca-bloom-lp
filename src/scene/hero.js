// Luca Bloom LP：ヒーローの3D：本体モデル（自動開閉・回転・時間で外箱が透ける）
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIGHT, addDrag, createRenderer, onContextLost, prefersReducedMotion, whenCompiled } from './common.js';
import { buildDevice } from './device.js';
import { buildSleeve } from './sleeve.js';

// ================= 外箱の透過（内部の送りねじ・ナットを見せる） =================
// 時間で自動的に「不透明 → 透過 → 不透明」を繰り返す（回転の向きとは無関係）。
// 1周期 10秒：不透明 4秒 → 1秒で透ける → 透過 4秒 → 1秒で戻る。
const SEE = { period: 10, opaque: 4, fade: 1, clear: 4 };
function createSeeThrough(device) {
  const { housing, decal } = device;
  const ss = (x) => x * x * (3 - 2 * x);
  let t = 0;
  let prev = -1;
  // dt 秒ぶん時間を進めて透過度を反映する。reduce（動きを減らす設定）では不透明のまま
  return (dt, reduce) => {
    if (!reduce) t = (t + dt) % SEE.period;
    let xv = 0; // 0 = 不透明、1 = 透過
    if (!reduce) {
      const a = SEE.opaque;
      const b = a + SEE.fade;
      const c = b + SEE.clear;
      if (t >= a && t < b) xv = ss((t - a) / SEE.fade);
      else if (t >= b && t < c) xv = 1;
      else if (t >= c) xv = 1 - ss((t - c) / SEE.fade);
    }
    if (xv === prev) return;
    prev = xv;
    const see = xv > 0.001;
    if (housing.transparent !== see) {
      housing.transparent = see;
      housing.needsUpdate = true;
    }
    housing.opacity = 1 - 0.8 * xv;
    housing.depthWrite = xv < 0.5;
    decal.opacity = 1 - xv;
  };
}

// ================= ヒーロー：本体モデル =================
// ・本体は40秒で1周のペースでゆっくり回転（横ドラッグで向きを変えられる）
// ・アームは全閉⇄最大(70mm)を自動で往復。ハンドルは1回転=2mmなので、
//   アーム移動 2.5mm/秒 ＝ ハンドル 1.25回転/秒。端で1.5秒かけて加減速し、2秒止まる。
export function initHero(state) {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const fallback = document.getElementById('fb');
  const renderer = createRenderer(stage);
  if (!renderer) return;
  renderer.toneMapping = ACESFilmicToneMapping; // 白の階調をやわらかく（磁器のような白）
  renderer.toneMappingExposure = 1.0;

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 1, 2000);
  const LOOK = new Vector3(0, -14, 0);

  // 周囲の映り込み（室内を模した環境光）。艶と陰影の立体感を出す
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  scene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.15 * LIGHT));
  const key = new DirectionalLight(0xffffff, 0.6 * LIGHT);
  key.position.set(-40, 160, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004; // 面に出る細かい縞（影の計算誤差）を防ぐ
  key.shadow.normalBias = 0.25;
  Object.assign(key.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 450 });
  scene.add(key);
  const fill = new DirectionalLight(0xdfe4ff, 0.25 * LIGHT);
  fill.position.set(120, 40, 60);
  scene.add(fill);
  const rim = new DirectionalLight(0xc6d0ff, 0.45 * LIGHT);
  rim.position.set(60, 60, -140);
  scene.add(rim);
  const ground = new Mesh(new PlaneGeometry(700, 700), new ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -57;
  ground.receiveShadow = true;
  scene.add(ground);

  const model = new Group();
  scene.add(model);
  const device = buildDevice();
  device.dev.position.x = 4; // 全体の中心を回転軸に合わせる
  model.add(device.dev);
  const updateSleeve = buildSleeve(device);
  const seeThrough = createSeeThrough(device);

  // 1回転(2π)=2mm。閉じる向き＝側面の矢印が下へ動く向き
  const place = () => {
    device.mover.position.x = state.current;
    device.shaft.rotation.x = -state.current * Math.PI;
    updateSleeve(state.current);
  };

  const SPIN = (Math.PI * 2) / 40;
  const V = 2.5;
  const TA = 1.5;
  const HOLD = 2;
  const USERV = 10;
  const reduce = prefersReducedMotion();
  // 回転の開始位置：340°から始める
  let spin = (340 * Math.PI) / 180;
  let dir = 1;
  let vel = 0;
  let hold = 1;
  let idle = 0;
  let running = false;
  let visible = true;
  let alive = true;
  let last = 0;

  const drag = addDrag(stage, (dx) => {
    spin += dx * 0.012;
    state.kick();
  });
  state.slider.addEventListener('input', () => {
    idle = 6; // 手動操作後6秒で自動に戻る
    vel = 0;
  });

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
    last = now;
    const anim = !reduce;
    if (anim && !drag.on) spin += SPIN * dt;

    if (!state.demo) {
      // 手動：スライダーの値へ最大10mm/秒で追従
      const d = state.target - state.current;
      const step = USERV * dt;
      state.current = Math.abs(d) <= step ? state.target : state.current + Math.sign(d) * step;
      idle -= dt;
      if (anim && idle <= 0 && state.current === state.target) {
        state.demo = true;
        dir = state.current < 60 ? 1 : -1;
        hold = 1;
        vel = 0;
      }
    } else if (anim) {
      // 自動：全閉⇄最大
      if (hold > 0) {
        hold -= dt;
      } else {
        const goal = dir > 0 ? 60 : 0;
        const dist = Math.abs(goal - state.current);
        const acc = V / TA;
        vel = Math.min(vel + acc * dt, V, Math.sqrt(2 * acc * dist) + acc * dt);
        const mv = vel * dt;
        if (mv >= dist) {
          state.current = goal;
          vel = 0;
          dir = -dir;
          hold = HOLD;
        } else {
          state.current += dir * mv;
        }
      }
      state.target = state.current;
      state.show(state.current);
      state.slider.value = 10 + state.current;
    }

    model.rotation.y = spin;
    seeThrough(dt, reduce);
    place();
    renderer.render(scene, camera);
    if (visible && !document.hidden && (anim || state.current !== state.target)) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      last = 0;
    }
  }

  state.kick = () => {
    if (alive && !running && visible && !document.hidden) {
      running = true;
      requestAnimationFrame(frame);
    }
  };

  function resize() {
    if (!alive) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const d = w / h < 1.1 ? 268 : 246;
    camera.position.set(LOOK.x - d * 0.3, LOOK.y + d * 0.36, d * 0.88);
    camera.lookAt(LOOK);
    camera.updateProjectionMatrix();
    seeThrough(0, reduce);
    place();
    renderer.render(scene, camera);
    if (fallback) fallback.style.display = 'none'; // 3Dの描画が始まったら静止画を隠す
    state.kick();
  }

  onContextLost(renderer, () => { alive = false; }, fallback);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) state.kick(); // タブが非表示の間は描画を止め、戻ったら再開
  });
  whenCompiled(renderer, scene, camera).then(() => {
    if (!alive) return;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        visible = es[0].isIntersecting;
        if (visible) state.kick();
      }).observe(stage);
    }
    resize();
  });
}
