// Amazon 商品画像用の 3D 描画。tools/amazon/build-images.mjs がブラウザ内で読み込み、
// window.shot(設定) で本体・化粧箱を背景透明の PNG に描く。3Dモデルは LP と同じ src/scene/ の部品を使う。
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
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

const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.outputColorSpace = SRGBColorSpace;
document.getElementById('gl').appendChild(renderer.domElement);

// ---------- 本体（LP のヒーローと同じ光の設定） ----------
const dScene = new Scene();
{
  const pmrem = new PMREMGenerator(renderer);
  dScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  dScene.environmentIntensity = 0.6;
  pmrem.dispose();
}
dScene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.15 * LIGHT));
const key = new DirectionalLight(0xffffff, 0.6 * LIGHT);
key.position.set(-40, 160, 120);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.25;
key.shadow.radius = 6;
Object.assign(key.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 450 });
dScene.add(key);
const fill = new DirectionalLight(0xdfe4ff, 0.25 * LIGHT);
fill.position.set(120, 40, 60);
dScene.add(fill);
const rim = new DirectionalLight(0xc6d0ff, 0.45 * LIGHT);
rim.position.set(60, 60, -140);
dScene.add(rim);
const ground = new Mesh(new PlaneGeometry(900, 900), new ShadowMaterial({ opacity: 0.14 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -50;
ground.receiveShadow = true;
dScene.add(ground);

const model = new Group();
dScene.add(model);
const device = buildDevice({ backArrowUp: true }); // LP のヒーローと同じ（背面の矢印は上向き）
model.add(device.dev);
const updateSleeve = buildSleeve(device);
let sleeve;
device.dev.traverse((o) => {
  if (o.renderOrder === 2) sleeve = o;
});
// アームの部品（開き幅の寸法線に使う）：固定アーム＝本体に直接付いた x=-34.5 の部品、駆動アーム＝mover の最初の部品
const fixedArm = device.dev.children.find((o) => o.isMesh && Math.abs(o.position.x + 34.5) < 1e-6);
const moverArm = device.mover.children[0];

function seeThrough(on) {
  const { housing, decal, decalBack } = device;
  housing.transparent = on;
  housing.opacity = on ? 0.2 : 1;
  housing.depthWrite = !on;
  housing.needsUpdate = true;
  decal.opacity = on ? 0 : 1;
  decalBack.opacity = on ? 0 : 1;
}

// ---------- 化粧箱（LP の化粧箱と同じ光の設定） ----------
const bScene = new Scene();
bScene.add(new HemisphereLight(0xffffff, 0x2a3150, 0.6 * LIGHT));
{
  const k = new DirectionalLight(0xffffff, 0.95 * LIGHT);
  k.position.set(-120, 260, 200);
  k.castShadow = true;
  k.shadow.mapSize.set(2048, 2048);
  k.shadow.bias = -0.0004;
  k.shadow.normalBias = 0.25;
  k.shadow.radius = 6;
  Object.assign(k.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 800 });
  bScene.add(k);
  const f = new DirectionalLight(0xdfe6ff, 0.35 * LIGHT);
  f.position.set(220, 90, 120);
  bScene.add(f);
  const r = new DirectionalLight(0xbfd0ff, 0.55 * LIGHT);
  r.position.set(80, 140, -280);
  bScene.add(r);
  const g = new Mesh(new PlaneGeometry(1600, 1600), new ShadowMaterial({ opacity: 0.25 }));
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  bScene.add(g);
}
const box = buildBox();
bScene.add(box.grp);

// 3D の点（本体の座標、mm）を画面の座標（px）へ
const toScreen = (cam, w, h, obj, p) => {
  const v = new Vector3(...p);
  obj.localToWorld(v);
  v.project(cam);
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
};

// 設定：w・h（px）、travel（駆動アームの移動量 mm。開き幅＝10＋travel）、yaw・pitch（本体の向き、度）、
// view：'front'（真正面・平行投影、scale＝1mmあたりのpx、look＝画面中央に来る点）または
//       'persp'（dir＝カメラの向き、dist＝距離、fov）、sleeve（ピンクの膜）、see（外箱を透かす）、shadow（床の影）
window.shot = (o) => {
  const W = o.w;
  const H = o.h;
  renderer.setSize(W, H, false);
  if (o.kind === 'box') {
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    box.grp.rotation.y = ((o.yaw ?? 180) * Math.PI) / 180;
    box.pivot.rotation.x = -(o.lid ?? 0);
    const cam = new PerspectiveCamera(o.fov ?? 26, W / H, 1, 3000);
    const look = new Vector3(...(o.look ?? [0, 30, 0]));
    cam.position.copy(look).addScaledVector(new Vector3(...(o.dir ?? [0.2, 0.55, 1])).normalize(), o.dist ?? 420);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
    renderer.render(bScene, cam);
    return { url: renderer.domElement.toDataURL('image/png') };
  }
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 0.9;
  const t = o.travel ?? 0;
  device.mover.position.x = t;
  device.shaft.rotation.x = -t * Math.PI;
  updateSleeve(t);
  sleeve.visible = !!o.sleeve;
  seeThrough(!!o.see);
  ground.visible = o.shadow !== false;
  model.rotation.set(((o.pitch ?? 0) * Math.PI) / 180, ((o.yaw ?? 0) * Math.PI) / 180, 0);
  model.updateMatrixWorld(true);

  let cam;
  const look = new Vector3(...(o.look ?? [0, -10, 0]));
  if (o.view === 'front') {
    const s = o.scale;
    cam = new OrthographicCamera(-W / 2 / s, W / 2 / s, H / 2 / s, -H / 2 / s, 1, 2000);
    cam.position.set(look.x, look.y, look.z + 600);
    cam.lookAt(look);
  } else {
    cam = new PerspectiveCamera(o.fov ?? 24, W / H, 1, 3000);
    cam.position.copy(look).addScaledVector(new Vector3(...(o.dir ?? [-0.3, 0.36, 0.88])).normalize(), o.dist ?? 260);
    cam.lookAt(look);
  }
  cam.updateProjectionMatrix();
  renderer.render(dScene, cam);

  const pts = (o.points ?? []).map((p) => toScreen(cam, W, H, device.dev, p));
  // 両アームの外側の端（左右）と先端の高さ
  const b1 = new Box3().setFromObject(fixedArm);
  const b2 = new Box3().setFromObject(moverArm);
  const arms = {
    left: toScreen(cam, W, H, dScene, [b1.min.x, b1.min.y, 0]),
    right: toScreen(cam, W, H, dScene, [b2.max.x, b2.min.y, 0]),
  };
  return { url: renderer.domElement.toDataURL('image/png'), pts, arms };
};

Promise.all([
  renderer.compileAsync(dScene, new PerspectiveCamera()),
  renderer.compileAsync(bScene, new PerspectiveCamera()),
]).then(() => {
  window.ready = true;
});
