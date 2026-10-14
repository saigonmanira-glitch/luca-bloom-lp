// Luca Bloom LP：化粧箱の3D（フタの開閉・梱包材・背面の文字）
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShadowMaterial,
  Vector3,
} from 'three';
import { LIGHT, addDrag, createRenderer, onContextLost, prefersReducedMotion, smoothstep, whenCompiled } from './common.js';
import { buildDevice, upright } from './device.js';
import { HOLE_A, HOLE_B } from './box-foam.js';

// ================= 化粧箱（boxA・packageA図面）：内寸122×91×32、PANTONE 289 C、文字 Cool Gray 1 C =================
// 36秒で1周。正面を向くとフタが開き、背面の文字が見える向きでは閉じる
export function initBox() {
  const st = document.getElementById('boxstage');
  if (!st) return;
  const fallback = document.getElementById('boxfb');
  const renderer = createRenderer(st);
  if (!renderer) return;
  renderer.domElement.style.display = 'none'; // 最初の描画までは図（SVG）を表示したまま

  const scene = new Scene();
  const cam = new PerspectiveCamera(28, 1, 1, 3000);
  const LK = new Vector3(0, 48, 0);
  scene.add(new HemisphereLight(0xffffff, 0x2a3150, 0.6 * LIGHT));
  const key = new DirectionalLight(0xffffff, 0.95 * LIGHT);
  key.position.set(-120, 260, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004; // 面に出る細かい縞（影の計算誤差）を防ぐ
  key.shadow.normalBias = 0.25;
  Object.assign(key.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 800 });
  scene.add(key);
  const fill = new DirectionalLight(0xdfe6ff, 0.35 * LIGHT);
  fill.position.set(220, 90, 120);
  scene.add(fill);
  const rim = new DirectionalLight(0xbfd0ff, 0.55 * LIGHT);
  rim.position.set(80, 140, -280);
  scene.add(rim);
  const ground = new Mesh(new PlaneGeometry(1400, 1400), new ShadowMaterial({ opacity: 0.42 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const { grp, pivot } = buildBox();
  scene.add(grp);

  // 動き
  const reduce = prefersReducedMotion();
  let ang = Math.PI * 0.8;
  let running = false;
  let visible = true;
  let alive = true;
  let last = 0;

  const pose = () => {
    grp.rotation.y = ang;
    pivot.rotation.x = -1.85 * smoothstep(0.2, 0.8, Math.cos(ang));
  };
  const drag = addDrag(st, (dx) => {
    ang += dx * 0.012;
    go();
  });

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0);
    last = now;
    if (!reduce && !drag.on) ang += ((Math.PI * 2) / 36) * dt;
    pose();
    renderer.render(scene, cam);
    if (visible && !reduce && !document.hidden) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      last = 0;
    }
  }
  function go() {
    if (alive && !running && visible && !document.hidden) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  function resize() {
    if (!alive) return;
    const w = st.clientWidth;
    const h = st.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const d = w / h < 1.15 ? 400 : 370;
    cam.position.set(0, LK.y + d * 0.36, d * 0.93);
    cam.lookAt(LK);
    cam.updateProjectionMatrix();
    pose();
    renderer.render(scene, cam);
    renderer.domElement.style.display = '';
    if (fallback) fallback.style.display = 'none'; // 3Dの描画が始まったら図を隠す
    go();
  }

  onContextLost(renderer, () => { alive = false; }, fallback);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) go();
  });
  whenCompiled(renderer, scene, cam).then(() => {
    if (!alive) return;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(st);
    else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        visible = es[0].isIntersecting;
        if (visible) go();
      }).observe(st);
    }
    resize();
  });
}

// 化粧箱一式（箱・梱包材・収納した本体・フタ・背面の文字）。LP と Amazon 用動画（tools/video）で共用。
// grp の原点は箱の底面中央。pivot.rotation.x を負にするとフタが開く
export function buildBox() {
  const NAVY = new MeshStandardMaterial({ color: 0x0c2340, roughness: 0.72, metalness: 0.02 }); // PANTONE 289 C
  const NAVY_IN = new MeshStandardMaterial({ color: 0x0e2747, roughness: 0.85 });
  const NOTCH = new MeshStandardMaterial({ color: 0x061429, roughness: 0.9 });
  const FOAM = new MeshStandardMaterial({ color: 0x151515, roughness: 0.96 }); // 黒色 高密度EVA
  [NAVY, NAVY_IN, NOTCH, FOAM].forEach((m) => m.color.convertSRGBToLinear()); // 指定色をsRGBとして扱う

  const grp = new Group();
  const box = (w, h, d, x, y, z, m, parent) => {
    const me = new Mesh(new BoxGeometry(w, h, d), m);
    me.position.set(x, y, z);
    me.castShadow = true;
    me.receiveShadow = true;
    (parent || grp).add(me);
    return me;
  };

  // 外形（内寸122×91＋板厚2）
  const L = 126;
  const DP = 95;
  const T = 2;
  const HT = 34;
  box(L, T, DP, 0, T / 2, 0, NAVY);
  box(L, HT - T, T, 0, T + (HT - T) / 2, DP / 2 - T / 2, NAVY);
  box(L, HT - T, T, 0, T + (HT - T) / 2, -DP / 2 + T / 2, NAVY);
  box(T, HT - T, DP - 2 * T, -L / 2 + T / 2, T + (HT - T) / 2, 0, NAVY);
  box(T, HT - T, DP - 2 * T, L / 2 - T / 2, T + (HT - T) / 2, 0, NAVY);

  // 梱包材：底板t5・中板t7・上板t18（完成形t30）。上板は本体の形、中板は本体胴部と指かけR10をくり抜き
  const foamLayer = (hole, y0, depth) => {
    const sh = new Shape();
    sh.moveTo(-61, -45.5);
    sh.lineTo(61, -45.5);
    sh.lineTo(61, 45.5);
    sh.lineTo(-61, 45.5);
    sh.lineTo(-61, -45.5);
    if (hole) {
      const p = new Path();
      hole.forEach((q, i) => {
        if (i) p.lineTo(q[0], -q[1]);
        else p.moveTo(q[0], -q[1]);
      });
      p.closePath();
      sh.holes.push(p);
    }
    const me = new Mesh(upright(new ExtrudeGeometry(sh, { depth, bevelEnabled: false }), y0), FOAM);
    me.castShadow = true;
    me.receiveShadow = true;
    grp.add(me);
  };
  foamLayer(null, T, 5);
  foamLayer(HOLE_B, T + 5, 7);
  foamLayer(HOLE_A, T + 12, 18);

  // 本体を横向きに収納（アームは全閉）
  const dv = buildDevice().dev;
  dv.rotation.x = -Math.PI / 2;
  dv.position.set(3.6, 19, -5.5);
  grp.add(dv);

  // フタ：背面の上辺で開閉。天板＋前面を覆うフラップ、内側に名刺ポケット96×60（R10の切り欠き）
  const pivot = new Group();
  pivot.position.set(0, HT, -DP / 2);
  grp.add(pivot);
  box(L, T, DP, 0, T / 2, DP / 2, NAVY, pivot);
  box(L, HT + T, T, 0, -(HT + T) / 2 + T, DP + T / 2, NAVY, pivot);
  box(96, 0.6, 60, 0, -0.3, DP / 2, NAVY_IN, pivot);
  const notch = new Mesh(new CylinderGeometry(10, 10, 0.7, 32, 1, false, Math.PI / 2, Math.PI), NOTCH);
  notch.position.set(0, -0.36, DP / 2 + 30);
  pivot.add(notch);

  // 背面の文字「Luca Bloom」：幅50mm・高さ6.5mm、中央合わせ（Sweet Sans Pro Thin の代替として Montserrat 200）
  const tc = document.createElement('canvas');
  tc.width = 1024;
  tc.height = 160;
  const tex = new CanvasTexture(tc);
  tex.anisotropy = 4;
  const drawText = () => {
    const g = tc.getContext('2d');
    g.clearRect(0, 0, 1024, 160);
    g.fillStyle = '#D9D9D6';
    g.font = '200 124px Montserrat, Quicksand, sans-serif';
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    const w = g.measureText('Luca Bloom').width;
    g.save();
    g.translate(512, 84);
    g.scale(1000 / w, 1);
    g.fillText('Luca Bloom', 0, 0);
    g.restore();
    tex.needsUpdate = true;
  };
  drawText();
  if (document.fonts && document.fonts.load) document.fonts.load('200 124px Montserrat').then(drawText, () => {});
  const label = new Mesh(
    new PlaneGeometry(51.2, 8),
    new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  label.rotation.y = Math.PI;
  label.position.set(0, 18, -DP / 2 - 0.08);
  grp.add(label);

  return { grp, pivot };
}
