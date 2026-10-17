// Luca Bloom LP：構造の欄。部品（本体・駆動アーム・送りねじとハンドル・リリースプレート）が離れた状態から、
// 欄が画面に半分入ったときに1回だけ自動で組み上がる（約2.6秒。スクロール量には連動させない＝操作は不要）。
// 組み上がった後は止まり、横にドラッグすると向きを変えられる。「もう一度」で再生し直せる。
// 動きを減らす設定の端末では、最初から組み上がった状態で表示する。
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  HemisphereLight,
  PMREMGenerator,
  PerspectiveCamera,
  Box3,
  Scene,
  Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIGHT, addDrag, createRenderer, onContextLost, prefersReducedMotion, smoothstep, whenCompiled } from './common.js';
import { buildDevice } from './device.js';

const DURATION = 2.6; // 秒
// 部品ごとの動き（開始・終了の秒）と、離れた位置（mm）
const MOVER = [0.15, 0.95]; // 駆動アーム：下から上がってはまる
const SHAFT = [0.75, 1.75]; // 送りねじ：左から回りながら差し込まれる
const PLATE = [1.6, 2.2]; // リリースプレート：右から留まる
// 駆動アームは固定アームと重ならないよう、下だけでなく右にもずらす
const FAR = { moverX: 28, moverY: -30, shaft: -52, spin: Math.PI * 6, plate: 20 };

export function initAssembly() {
  const stage = document.getElementById('asmstage');
  if (!stage) return;
  const fallback = document.getElementById('asmfb');
  const replay = document.getElementById('asmreplay');
  const steps = [...document.querySelectorAll('.asm-parts li')];
  const renderer = createRenderer(stage);
  if (!renderer) return;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.domElement.style.display = 'none'; // 最初の描画までは静止画を表示したまま

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 1, 3000);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  scene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.15 * LIGHT));
  const key = new DirectionalLight(0xffffff, 0.6 * LIGHT);
  key.position.set(-40, 160, 120);
  scene.add(key);
  const fill = new DirectionalLight(0xdfe4ff, 0.25 * LIGHT);
  fill.position.set(120, 40, 60);
  scene.add(fill);
  const rim = new DirectionalLight(0xc6d0ff, 0.45 * LIGHT);
  rim.position.set(60, 60, -140);
  scene.add(rim);

  const model = new Group();
  scene.add(model);
  const device = buildDevice();
  model.add(device.dev);
  const BASE_YAW = -0.42; // 斜め前から（部品の重なりが見える向き）
  let yaw = BASE_YAW;

  const reduce = prefersReducedMotion();
  let t = 0; // 再生位置（秒）
  let view = null;
  let playing = false;
  let alive = true;
  let running = false;
  let last = 0;
  let aspect = 1;

  const ease = (r) => smoothstep(r[0], r[1], t);
  function pose() {
    const m = ease(MOVER);
    const s = ease(SHAFT);
    const p = ease(PLATE);
    device.mover.position.set(FAR.moverX * (1 - m), FAR.moverY * (1 - m), 0);
    device.shaft.position.x = FAR.shaft * (1 - s);
    device.shaft.rotation.x = FAR.spin * (1 - s);
    device.plate.position.x = 42.8 + FAR.plate * (1 - p);
    model.rotation.y = yaw;
    // カメラ：分解した状態の全体 → 組み上がった本体へ寄る（それぞれの外形の箱から、画面に収まる距離を求める）
    if (view) {
      const k = smoothstep(1.4, DURATION, t);
      const c = view.apart.c.clone().lerp(view.done.c, k);
      const sz = view.apart.s.clone().lerp(view.done.s, k);
      const tan = Math.tan((camera.fov * Math.PI) / 360);
      const d = 1.02 * Math.max(sz.y / (2 * tan), sz.x / (2 * tan * aspect)) + sz.z / 2;
      camera.position.set(c.x, c.y + d * 0.3, c.z + d * 0.95);
      camera.lookAt(c);
    }
    // 部品名の強調：いま動いている部品（終わったら全部）
    const i = t >= DURATION ? -1 : t < MOVER[0] ? 0 : t < SHAFT[0] ? 1 : t < PLATE[0] ? 2 : 3;
    steps.forEach((li, n) => li.classList.toggle('on', i === -1 || n === i));
  }

  // 分解した状態と組み上がった状態の外形（画面の枠に収めるため）
  const box = () => {
    const b = new Box3().setFromObject(model);
    return { c: b.getCenter(new Vector3()), s: b.getSize(new Vector3()) };
  };
  pose();
  const apart = box();
  t = DURATION;
  pose();
  view = { apart, done: box() };
  t = reduce ? DURATION : 0;

  const drag = addDrag(stage, (dx) => {
    yaw += dx * 0.012;
    go();
  });

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
    last = now;
    if (playing) {
      t = Math.min(DURATION, t + dt);
      if (t >= DURATION) {
        playing = false;
        if (replay) replay.hidden = false;
      }
    }
    pose();
    renderer.render(scene, camera);
    if ((playing || drag.on) && !document.hidden) requestAnimationFrame(frame);
    else {
      running = false;
      last = 0;
    }
  }
  function go() {
    if (alive && !running && !document.hidden) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  function play() {
    if (reduce) return;
    t = 0;
    playing = true;
    if (replay) replay.hidden = true;
    go();
  }
  function resize() {
    if (!alive) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    pose();
    renderer.render(scene, camera);
    renderer.domElement.style.display = '';
    if (fallback) fallback.style.display = 'none';
  }

  if (replay) replay.addEventListener('click', play);
  // 動作確認・静止画の書き出し用（tools/build-assembly-still.mjs）。自動操作のブラウザでだけ使える
  if (navigator.webdriver) window.__lbAssembly = { seek: (s) => { t = s; playing = false; pose(); renderer.render(scene, camera); } };

  onContextLost(renderer, () => { alive = false; }, fallback);
  whenCompiled(renderer, scene, camera).then(() => {
    if (!alive) return;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    resize();
    if (reduce) {
      if (replay) replay.hidden = true;
      return;
    }
    // 欄が画面に半分入ったら1回だけ再生する
    if (!('IntersectionObserver' in window)) return play();
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        play();
      },
      { threshold: 0.5 },
    );
    io.observe(stage);
  });
}
