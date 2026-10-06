// Amazon 商品動画（1920×1080）の描画。tools/video/render.mjs がブラウザ内で読み込み、
// window.renderAt(秒) で指定時刻の1コマを描く（実時間に依存しないので、毎回同じ映像になる）。
// 3Dモデルは LP と同じ src/scene/ の部品を使う。
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  NoToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIGHT } from '../../src/scene/common.js';
import { buildDevice } from '../../src/scene/device.js';
import { buildSleeve } from '../../src/scene/sleeve.js';
import { buildBox } from '../../src/scene/box.js';
import { BOX_IN, OUTRO, TIMELINE } from './timeline.mjs';

const W = 1920;
const H = 1080;
const ss = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// キーフレーム [[秒, 値, 'lin'?], ...] の補間。'lin' の区間は等速、それ以外はなめらかに加減速
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1, mode] = keys[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * (mode === 'lin' ? u : ss(u));
    }
  }
  return keys[keys.length - 1][1];
}

const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.outputColorSpace = SRGBColorSpace;
document.getElementById('gl').appendChild(renderer.domElement);

// ---------- 本体のシーン（LP のヒーローと同じ光の設定） ----------
const dScene = new Scene();
{
  const pmrem = new PMREMGenerator(renderer);
  dScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  dScene.environmentIntensity = 0.6;
  pmrem.dispose();
}
dScene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.15 * LIGHT));
{
  const key = new DirectionalLight(0xffffff, 0.6 * LIGHT);
  key.position.set(-40, 160, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.25;
  key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 450 });
  dScene.add(key);
  const fill = new DirectionalLight(0xdfe4ff, 0.25 * LIGHT);
  fill.position.set(120, 40, 60);
  dScene.add(fill);
  const rim = new DirectionalLight(0xc6d0ff, 0.45 * LIGHT);
  rim.position.set(60, 60, -140);
  dScene.add(rim);
  const ground = new Mesh(new PlaneGeometry(900, 900), new ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -57;
  ground.receiveShadow = true;
  dScene.add(ground);
}
const model = new Group();
dScene.add(model);
const device = buildDevice();
device.dev.position.x = 4;
model.add(device.dev);
const updateSleeve = buildSleeve(device);
let sleeve;
device.dev.traverse((o) => {
  if (o.renderOrder === 2) sleeve = o;
});
const dCam = new PerspectiveCamera(24, W / H, 1, 2000);

// 外箱の透過（0＝不透明、1＝透過）。LP の createSeeThrough と同じ見え方
function seeThrough(xv) {
  const { housing, decal } = device;
  const see = xv > 0.001;
  if (housing.transparent !== see) {
    housing.transparent = see;
    housing.needsUpdate = true;
  }
  housing.opacity = 1 - 0.8 * xv;
  housing.depthWrite = xv < 0.5;
  decal.opacity = 1 - xv;
}

// ---------- 化粧箱のシーン（LP の化粧箱と同じ光の設定） ----------
const bScene = new Scene();
bScene.add(new HemisphereLight(0xffffff, 0x2a3150, 0.6 * LIGHT));
{
  const key = new DirectionalLight(0xffffff, 0.95 * LIGHT);
  key.position.set(-120, 260, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.25;
  key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 800 });
  bScene.add(key);
  const fill = new DirectionalLight(0xdfe6ff, 0.35 * LIGHT);
  fill.position.set(220, 90, 120);
  bScene.add(fill);
  const rim = new DirectionalLight(0xbfd0ff, 0.55 * LIGHT);
  rim.position.set(80, 140, -280);
  bScene.add(rim);
  const ground = new Mesh(new PlaneGeometry(1600, 1600), new ShadowMaterial({ opacity: 0.3 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  bScene.add(ground);
}
const box = buildBox();
bScene.add(box.grp);
const bCam = new PerspectiveCamera(28, W / H, 1, 3000);

// ---------- 動きの設定（秒） ----------
const K = TIMELINE;

// カメラ：注視点 look、距離 d、高さの比 e、画面上の横ずらし o（画面幅に対する割合。正で右へ）
function placeCamera(cam, look, d, e, o) {
  const dir = new Vector3(-0.3, e, 0.88).normalize();
  cam.position.copy(look).addScaledVector(dir, d);
  cam.lookAt(look);
  cam.setViewOffset(W, H, -o * W, 0, W, H);
  cam.updateProjectionMatrix();
}

// 画面の文字：data-t="表示開始,表示終了"（秒）の要素を、0.5秒でふわっと出し入れする
const blocks = [...document.querySelectorAll('[data-t]')].map((el) => {
  const [a, b] = el.dataset.t.split(',').map(Number);
  return { el, a, b };
});
const mm = document.getElementById('mm');
const unit = document.getElementById('mmunit');

window.renderAt = (t) => {
  for (const { el, a, b } of blocks) {
    const op = Math.min(ss((t - a) / 0.5), ss((b - t) / 0.4));
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translateY(${((1 - ss((t - a) / 0.6)) * 28).toFixed(1)}px)`;
  }
  document.getElementById('title').style.opacity = (1 - ss((t - K.titleOut) / 0.6)).toFixed(3);
  document.getElementById('outro').style.opacity = ss((t - OUTRO) / 0.6).toFixed(3);

  const gl = renderer.domElement;
  if (t < BOX_IN) {
    gl.style.opacity = ss((BOX_IN - t) / 0.4).toFixed(3);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    const travel = track(K.travel, t);
    model.rotation.y = (track(K.spin, t) * Math.PI) / 180;
    device.mover.position.x = travel;
    device.shaft.rotation.x = -travel * Math.PI;
    updateSleeve(travel);
    sleeve.visible = track(K.sleeve, t) > 0.5;
    seeThrough(track(K.see, t));
    placeCamera(
      dCam,
      new Vector3(track(K.lookX, t), track(K.lookY, t), 0),
      track(K.dist, t),
      track(K.elev, t),
      track(K.offset, t),
    );
    const w = 10 + travel;
    mm.textContent = travel < 0.5 ? mm.dataset.closed : String(Math.round(w));
    unit.style.visibility = travel < 0.5 ? 'hidden' : 'visible';
    renderer.render(dScene, dCam);
  } else {
    gl.style.opacity = ss((t - BOX_IN) / 0.4).toFixed(3);
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    const ang = track(K.boxAng, t);
    box.grp.rotation.y = ang;
    box.pivot.rotation.x = -1.85 * ss((Math.cos(ang) - 0.2) / 0.6);
    placeCamera(bCam, new Vector3(0, 52, 0), 500, 0.5, 0.2);
    renderer.render(bScene, bCam);
  }
};

// フォントの読み込みとシェーダーのコンパイルが終わったら準備完了
Promise.all([document.fonts.ready, renderer.compileAsync(dScene, dCam), renderer.compileAsync(bScene, bCam)]).then(() => {
  window.renderAt(0);
  window.renderAt(BOX_IN + 1);
  window.ready = true;
});
