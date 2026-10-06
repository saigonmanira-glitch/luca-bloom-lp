// SNS 用の製品画像（背景が透明な PNG）を描く。tools/sns/build-brand.mjs がブラウザ内で読み込む。
// 3Dモデル・光は LP・商品動画と同じ（src/scene/）。白い背景の上に置いたときに自然な、薄い影つき。
// window.renderProduct({ w, h, spin, gap }) → PNG の data URL
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
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

const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new Scene();
{
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
}
scene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.15 * LIGHT));
{
  const key = new DirectionalLight(0xffffff, 0.6 * LIGHT);
  key.position.set(-40, 160, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.25;
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 450 });
  scene.add(key);
  const fill = new DirectionalLight(0xdfe4ff, 0.25 * LIGHT);
  fill.position.set(120, 40, 60);
  scene.add(fill);
  const rim = new DirectionalLight(0xc6d0ff, 0.45 * LIGHT);
  rim.position.set(60, 60, -140);
  scene.add(rim);
  const ground = new Mesh(new PlaneGeometry(900, 900), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -57;
  ground.receiveShadow = true;
  scene.add(ground);
}
const model = new Group();
scene.add(model);
const device = buildDevice();
device.dev.position.x = 4;
model.add(device.dev);
const updateSleeve = buildSleeve(device);
device.dev.traverse((o) => {
  if (o.renderOrder === 2) o.visible = false; // 包皮のモデルは出さない
});
const cam = new PerspectiveCamera(24, 1, 1, 2000);

window.renderProduct = ({ w, h, spin = 340, gap = 22, dist = 250, elev = 0.32 }) => {
  renderer.setSize(w, h, false);
  cam.aspect = w / h;
  model.rotation.y = (spin * Math.PI) / 180;
  device.mover.position.x = gap;
  device.shaft.rotation.x = -gap * Math.PI;
  updateSleeve(gap);
  const look = new Vector3(0, -16, 0);
  cam.position.copy(look).addScaledVector(new Vector3(-0.3, elev, 0.88).normalize(), dist);
  cam.lookAt(look);
  cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
};
window.ready = renderer.compileAsync(scene, cam);
