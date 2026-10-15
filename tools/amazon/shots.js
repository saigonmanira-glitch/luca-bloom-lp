// Amazon 商品画像用の 3D 描画。tools/amazon/build-images.mjs がブラウザ内で読み込み、
// window.shot(設定) で本体・化粧箱を背景透明の PNG に描く。3Dモデルは LP と同じ src/scene/ の部品を使う。
import {
  ACESFilmicToneMapping,
  Box3,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TubeGeometry,
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

// ---------- 金色の立体の矢印（ハンドルの回転・アームの動き・膜を押し広げる向き） ----------
const GOLD = new MeshStandardMaterial({ color: 0xe3b34e, metalness: 0.65, roughness: 0.28, envMapIntensity: 1.3 });
const UP = new Vector3(0, 1, 0);
// 先端の円すい（位置 p、向き t）
const tip = (p, t, r, h) => {
  const m = new Mesh(new ConeGeometry(r, h, 32), GOLD);
  m.quaternion.setFromUnitVectors(UP, t.clone().normalize());
  m.position.copy(p).addScaledVector(t.clone().normalize(), h / 2);
  m.castShadow = true;
  return m;
};
// ハンドルの回転の矢印：ハンドルの軸（x 方向、高さ y=10）を囲む輪。手前側で上へ回る向き＝アームが開く向き
const turnArrow = new Group();
{
  const R = 19;
  const X = -50;
  const P = (f) => new Vector3(X, 10 + R * Math.sin(f), R * Math.cos(f));
  // 奥の上から下を回って手前を上がり、矢じりは手前で上を向く
  const f0 = (-235 * Math.PI) / 180;
  const f1 = (20 * Math.PI) / 180;
  const pts = [];
  for (let i = 0; i <= 80; i++) pts.push(P(f0 + ((f1 - f0) * i) / 80));
  const tube = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 160, 2, 20, false), GOLD);
  tube.castShadow = true;
  turnArrow.add(tube);
  turnArrow.add(tip(P(f1), new Vector3(0, Math.cos(f1), -Math.sin(f1)), 5, 11));
}
device.dev.add(turnArrow);
// 直線の矢印（a → b）
const straightArrow = (a, b, r = 1.6) => {
  const g = new Group();
  const d = b.clone().sub(a);
  const len = d.length() - 9;
  const shaft = new Mesh(new CylinderGeometry(r, r, len, 24), GOLD);
  shaft.quaternion.setFromUnitVectors(UP, d.clone().normalize());
  shaft.position.copy(a).addScaledVector(d.clone().normalize(), len / 2);
  shaft.castShadow = true;
  g.add(shaft);
  g.add(tip(a.clone().addScaledVector(d.clone().normalize(), len), d, r * 2.6, 9));
  return g;
};
// アームが開く向き（アームの前、高さ y=-28）
const moveArrow = straightArrow(new Vector3(-24, -28, 7), new Vector3(16, -28, 7));
device.dev.add(moveArrow);
// 膜を左右へ押し広げる向き（膜の口の高さ。位置は shot のたびにアームに合わせる）
const pushL = new Group();
const pushR = new Group();
device.dev.add(pushL, pushR);

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
  renderer.setPixelRatio(o.ss ?? 2); // 2倍の解像度で描いて縮小し、輪郭をなめらかにする
  renderer.setSize(W, H, false);
  if (o.kind === 'box') {
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    box.grp.rotation.y = ((o.yaw ?? 180) * Math.PI) / 180;
    box.pivot.rotation.x = -(o.lid ?? 0);
    box.grp.updateMatrixWorld(true);
    const cam = new PerspectiveCamera(o.fov ?? 26, W / H, 1, 3000);
    const look = new Vector3(...(o.look ?? [0, 30, 0]));
    cam.position.copy(look).addScaledVector(new Vector3(...(o.dir ?? [0.2, 0.55, 1])).normalize(), o.dist ?? 420);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
    renderer.render(bScene, cam);
    const pts = (o.points ?? []).map((p) => toScreen(cam, W, H, box.grp, p));
    return { url: renderer.domElement.toDataURL('image/png'), pts };
  }
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 0.9;
  const t = o.travel ?? 0;
  device.mover.position.x = t;
  device.shaft.rotation.x = -t * Math.PI;
  updateSleeve(t);
  sleeve.visible = !!o.sleeve;
  seeThrough(!!o.see);
  turnArrow.visible = !!o.turnArrow;
  moveArrow.visible = !!o.moveArrow;
  pushL.clear();
  pushR.clear();
  if (o.pushArrows) {
    const y = o.pushY ?? -22;
    const xl = -34.5 - 3.6; // 固定アームの外側（くびれ部）
    const xr = -34.5 + t + 3.6; // 駆動アームの外側
    pushL.add(straightArrow(new Vector3(xl - 2, y, 0), new Vector3(xl - 16, y, 0), 1.3));
    pushR.add(straightArrow(new Vector3(xr + 2, y, 0), new Vector3(xr + 16, y, 0), 1.3));
  }
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
