// Luca Bloom LP：3D表示（ヒーローの本体モデル・化粧箱モデル）
// three.js r186。旧版（r128）と同じ見た目になるよう、色の扱いと光の強さを合わせている。
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ColorManagement,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  MeshStandardMaterial,
  Path,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Shape,
  ShadowMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- 旧版（r128）との見た目合わせ ----------
// ・r128 は色指定（0xe8e4da など）を変換せずに使っていた → 色の自動変換を切る
// ・r128 の光は内部で π 倍されていた → 強さに π を掛ける
ColorManagement.enabled = false;
const LIGHT = Math.PI;

const prefersReducedMotion = () =>
  !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 0〜1 のなめらかな補間
function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// WebGL の描画器を作る。使えない端末では null
function createRenderer(container) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;
  container.appendChild(renderer.domElement);
  return renderer;
}

// WebGL が強制終了された時（メモリ不足など）に、描画を止めて静止画に戻す
function onContextLost(renderer, stop, fallback) {
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stop();
    renderer.domElement.remove();
    if (fallback) fallback.style.display = '';
  });
}

// ドラッグで横回転させる。onMove(dx) に移動量(px)を渡す
function addDrag(el, onMove) {
  const d = { on: false, x: 0 };
  el.addEventListener('pointerdown', (e) => {
    d.on = true;
    d.x = e.clientX;
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {
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

// ---------- 形状の部品 ----------
// POM樹脂（ナチュラル）：乳白色で、薄い部分ほど光が少し透ける半透明の白。
// transmission で光の透過を、attenuation で厚い部分ほど白く濁る様子を、clearcoat で薄い艶を表現する
// sheen（布や蝋のような柔らかい反射）で、POM特有のしっとりした表面を出す
const pom = (extra) =>
  new MeshPhysicalMaterial({
    color: 0xebe7df,
    roughness: 0.38,
    metalness: 0,
    transmission: 0.55,
    thickness: 2.5,
    ior: 1.48,
    attenuationColor: 0xe4dccb,
    attenuationDistance: 3.5,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: 0xffffff,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    side: DoubleSide,
    ...extra,
  });
const POM = pom();
const POM_FLAT = pom({ flatShading: true });

// 角丸長方形をシェイプ（または穴）として追加
function roundRect(shape, x, y, w, h, r, hole) {
  const p = hole ? new Path() : shape;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  if (hole) shape.holes.push(p);
}

// 押し出し方向を上(+Y)に向け、y0 だけ持ち上げる
function upright(g, y0) {
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

// アームの側面形状（DXF：駆動アーム図 3:1、本体図 1:1）。内側の直線面 x=0、本体下面 y=0
function armOutline(top) {
  const P = [[0, top]];
  const L = (x, y) => P.push([x, y]);
  const A = (cx, cy, r, a0, a1) => {
    for (let i = 1; i <= 24; i++) {
      const t = ((a0 + ((a1 - a0) * i) / 24) * Math.PI) / 180;
      P.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
  };
  L(0, -39);
  A(1, -39, 1, 180, 270);
  L(1.394, -40);
  A(1.394, -38, 2, 270, 303.7);
  L(3.664, -38.891);
  L(4.387, -38.211);
  A(2, -36.394, 3, 322.7, 360);
  L(5, -35.475);
  A(-15, -35.475, 20, 0, 8.4);
  L(2.522, -17.293);
  A(4.5, -17, 2, 188.4, 90);
  L(7, -15);
  A(7, -14, 1, 270, 360);
  L(8, top);
  return P;
}

// 輪郭 P を高さ y で切った時の x の範囲 [左, 右]
function spanAt(P, y) {
  let lo = 1e9;
  let hi = -1e9;
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    const q = P[(i + 1) % P.length];
    if ((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) {
      const x = p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]);
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
  }
  return lo <= hi ? [lo, hi] : null;
}

// アーム：上部15mmは幅8、段差（くぼみ）の後、幅2.5→5へ太くなる刃部（逆テーパー）、先端R3。
// 厚み方向(z)は6mm、先端は半径3の丸、角R1。fillet=true で本体との付け根 R5
function armGeometry(dir, top, fillet) {
  const P = armOutline(top);
  const yb = Math.min(...P.map((p) => p[1]));
  const ys = [];
  for (let y = top; y > yb + 0.05; y -= 0.1) ys.push(y + 0.0137);
  ys.push(yb + 0.02);

  const CK = 6;
  const pos = [];
  const idx = [];
  const center = [];
  let rings = 0;
  ys.forEach((yy) => {
    const sp = spanAt(P, yy);
    if (!sp) return;
    const yc = yb + 3;
    let hz = 3;
    if (yy < yc) hz = Math.sqrt(Math.max(0.0004, 9 - (yy - yc) * (yy - yc)));
    if (fillet) {
      if (yy > 0) hz = 8;
      else if (yy > -5) hz = 8 - Math.sqrt(25 - (yy + 5) * (yy + 5));
    }
    const cx = (sp[0] + sp[1]) / 2;
    const ax = Math.max(0.02, (sp[1] - sp[0]) / 2);
    const lim = Math.min(ax, hz) * 0.95;
    const rIn = Math.min(1, lim);
    const rOut = Math.min(yy < -15 ? 2 : 1, lim);
    for (let q = 0; q < 4; q++) {
      const sx = q === 0 || q === 3 ? 1 : -1;
      const sz = q < 2 ? 1 : -1;
      const r = sx > 0 ? rOut : rIn;
      for (let k = 0; k < CK; k++) {
        const th = ((q + k / (CK - 1)) * Math.PI) / 2;
        pos.push(dir * (cx + sx * (ax - r) + r * Math.cos(th)), yy, sz * (hz - r) + r * Math.sin(th));
      }
    }
    center.push([dir * cx, yy]);
    rings++;
  });

  const N = CK * 4;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < N; j++) {
      const a = i * N + j;
      const b = i * N + ((j + 1) % N);
      idx.push(a, a + N, b, b, a + N, b + N);
    }
  }
  const t0 = pos.length / 3;
  pos.push(center[0][0], top, 0);
  for (let j = 0; j < N; j++) idx.push(t0, j, (j + 1) % N);
  const t1 = pos.length / 3;
  const lc = center[rings - 1];
  pos.push(lc[0], yb, 0);
  for (let j = 0; j < N; j++) idx.push((rings - 1) * N + ((j + 1) % N), (rings - 1) * N + j, t1);

  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------- 本体一式（本体・シャフト・留め具・固定アーム・駆動アーム）。ヒーローと箱の中で共用 ----------
function buildDevice() {
  const dev = new Group();
  const housing = POM.clone(); // 本体の外箱。内部構造を見せる時に透明にする
  const add = (g, mat, parent) => {
    const m = new Mesh(g, mat || POM);
    m.castShadow = true;
    m.receiveShadow = true;
    (parent || dev).add(m);
    return m;
  };

  // 本体 85×20×20：上面に78×13の開口、底面に69×6のスリット、底板3.5
  {
    const s = new Shape();
    roundRect(s, -42, -9.5, 84, 19, 0.3, false);
    roundRect(s, -39.5, -7, 79, 14, 1.5, true);
    add(
      upright(
        new ExtrudeGeometry(s, {
          depth: 19,
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.5,
          bevelSegments: 1,
          curveSegments: 6,
        }),
        0.5,
      ),
      housing,
    );
    const b = new Shape();
    roundRect(b, -39.5, -7, 79, 14, 1, false);
    roundRect(b, -34.5, -3, 69, 6, 2.9, true);
    add(upright(new ExtrudeGeometry(b, { depth: 3.5, bevelEnabled: false, curveSegments: 8 }), 0), housing);
  }

  // 刻印「↓CLOSE」（側面2か所）。キャンバス 1mm=20px、範囲：本体左端から x 3〜15mm、下面から y 1〜19mm
  let decal;
  {
    const c = document.createElement('canvas');
    c.width = 240;
    c.height = 360;
    const g = c.getContext('2d');
    const X = (mm) => (mm - 3) * 20;
    const Y = (mm) => (19 - mm) * 20;
    g.strokeStyle = '#8c877b';
    g.lineWidth = 5;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(X(5), Y(18));
    g.lineTo(X(5), Y(8));
    g.lineTo(X(3.5), Y(8));
    g.lineTo(X(6), Y(2));
    g.lineTo(X(8.5), Y(8));
    g.lineTo(X(7), Y(8));
    g.lineTo(X(7), Y(18));
    g.closePath();
    g.stroke();
    g.save();
    g.translate(X(9.95), Y(18.7));
    g.rotate(Math.PI / 2);
    g.font = '700 100px Quicksand, Arial, sans-serif';
    g.textBaseline = 'alphabetic';
    const w = g.measureText('CLOSE').width;
    g.scale(348 / w, 1);
    g.lineWidth = 5;
    g.strokeText('CLOSE', 0, 0);
    g.restore();
    decal = new MeshBasicMaterial({
      map: new CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const p1 = new Mesh(new PlaneGeometry(12, 18), decal);
    p1.position.set(-42.5 + 9, 10, 10.02);
    dev.add(p1);
    const p2 = p1.clone();
    p2.rotation.y = Math.PI;
    p2.position.z = -10.02;
    dev.add(p2);
  }

  // シャフト（回転部）：Tr8×2 1条、ハンドル18角＋頂点面取り5×5×5
  const shaft = new Group();
  shaft.position.set(0, 10, 0);
  dev.add(shaft);
  {
    const cyl = (rTop, rBottom, len, seg, rotZ, x) => {
      const g = new CylinderGeometry(rTop, rBottom, len, seg);
      g.rotateZ(rotZ);
      add(g, POM, shaft).position.x = x;
    };
    cyl(3.25, 3.25, 84, 24, Math.PI / 2, 0.5); // 軸
    cyl(2, 2, 2.4, 20, Math.PI / 2, 43.6); // 溝
    const pts = [];
    const turns = 38;
    const seg = turns * 20;
    for (let k = 0; k <= seg; k++) {
      const t = k / seg;
      const a = t * turns * Math.PI * 2;
      pts.push(new Vector3(-38 + t * turns * 2, Math.cos(a) * 3.4, Math.sin(a) * 3.4));
    }
    add(new TubeGeometry(new CatmullRomCurve3(pts), seg, 0.62, 6, false), POM, shaft); // ねじ山
    cyl(5, 5, 4, 32, Math.PI / 2, -42.5); // 首
    cyl(6, 6, 1, 32, Math.PI / 2, -43.7); // つば
    cyl(2, 3, 1, 24, -Math.PI / 2, 46.25); // 先端
    cyl(3, 3, 1, 24, Math.PI / 2, 45.25);

    // ハンドル：内側端 x=-44 → 外側端 x=-54（長さ10）、断面18×18、外側4隅を5mm頂点面取り
    const A = -44;
    const B = -54;
    const M = -49;
    const h = 9;
    const c = 4;
    const v = [];
    const tri = (p, q, r) => v.push(...p, ...q, ...r);
    const poly = (ps) => {
      for (let i = 1; i < ps.length - 1; i++) tri(ps[0], ps[i], ps[i + 1]);
    };
    poly([[A, -h, -h], [A, h, -h], [A, h, h], [A, -h, h]]);
    poly([[B, h, -c], [B, h, c], [B, c, h], [B, -c, h], [B, -h, c], [B, -h, -c], [B, -c, -h], [B, c, -h]]);
    poly([[A, h, -h], [A, h, h], [M, h, h], [B, h, c], [B, h, -c], [M, h, -h]]); // 上面 y=+9
    poly([[A, -h, -h], [A, -h, h], [M, -h, h], [B, -h, c], [B, -h, -c], [M, -h, -h]]); // 下面 y=-9
    poly([[A, -h, h], [A, h, h], [M, h, h], [B, c, h], [B, -c, h], [M, -h, h]]); // 手前 z=+9
    poly([[A, -h, -h], [A, h, -h], [M, h, -h], [B, c, -h], [B, -c, -h], [M, -h, -h]]); // 奥 z=-9
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((s) => {
      tri([M, s[0] * h, s[1] * h], [B, s[0] * h, s[1] * c], [B, s[0] * c, s[1] * h]); // 面取り三角
    });
    const kg = new BufferGeometry();
    kg.setAttribute('position', new Float32BufferAttribute(v, 3));
    kg.computeVertexNormals();
    add(kg, POM_FLAT, shaft);
  }

  // リリースプレート（キーホール留め具）：図面（尺度5:1）どおり。
  // 外形 10.5×14.25 の長円、厚み1.75。鍵穴形の抜き＝幅4mmのスロット（送りねじの溝 φ4 にはまる）と φ6.5 の穴を R0.5 でつなぐ。
  // 穴のふちは両面とも C0.5 の面取り（表裏0.5mmの層は穴を0.5mm大きく、中央0.75mmの層は図面の寸法）。
  // 組付け：スロットの端が送りねじの中心（y=10）に来る向き（大きい穴が下）。
  {
    const AXIS = 10; // 送りねじの中心の高さ
    const outline = () => {
      const s = new Shape();
      s.moveTo(-5.25, 5);
      s.absarc(0, 5, 5.25, Math.PI, 2 * Math.PI, false);
      s.lineTo(5.25, 8.75);
      s.absarc(0, 8.75, 5.25, 0, Math.PI, false);
      s.lineTo(-5.25, 5);
      return s;
    };
    // 鍵穴：スロット半幅 rs（先端は半円）、大きい穴の半径 rb（中心 y=5）、つなぎの丸み rf
    const keyhole = (rs, rb, rf) => {
      const h = new Path();
      const yc = 5 + Math.sqrt((rb + rf) ** 2 - (rs + rf) ** 2); // つなぎの円の中心の高さ
      const ang = Math.atan2(5 - yc, rs + rf); // つなぎの円から大きい穴への接点方向
      h.absarc(0, AXIS, rs, 0, Math.PI, false); // スロットの先端（上）
      h.lineTo(-rs, yc);
      h.absarc(-(rs + rf), yc, rf, 0, ang, true);
      const tl = Math.atan2(yc + rf * Math.sin(ang) - 5, -(rs + rf) + rf * Math.cos(ang));
      h.absarc(0, 5, rb, tl, Math.PI - tl + 2 * Math.PI, false); // 大きい穴（下側をぐるりと）
      h.absarc(rs + rf, yc, rf, Math.PI - ang, Math.PI, true);
      h.lineTo(rs, AXIS);
      return h;
    };
    const layer = (hole, z0, depth) => {
      const s = outline();
      s.holes.push(hole);
      const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 32 });
      g.translate(0, 0, z0);
      g.rotateY(Math.PI / 2);
      return g;
    };
    const plate = new Group();
    plate.position.set(42.8, 0, 0);
    dev.add(plate);
    add(layer(keyhole(2.5, 3.75, 1), 0, 0.5), POM, plate); // 本体側の面（面取り分だけ穴が大きい）
    add(layer(keyhole(2, 3.25, 0.5), 0.5, 0.75), POM, plate); // 中央（図面の寸法）
    add(layer(keyhole(2.5, 3.75, 1), 1.25, 0.5), POM, plate); // 外側の面
  }

  // アーム
  const INNER = -34.5; // 両アームの内側面（本体左端から8mm。最小時は2本が接する）
  add(armGeometry(-1, 2, true)).position.x = INNER; // 固定アーム（ハンドル側、本体と一体）
  const mover = new Group();
  dev.add(mover);
  add(armGeometry(1, 4, false), POM, mover).position.x = INNER; // 駆動アーム（ナット下面から44mm）
  const nut = new BoxGeometry(12, 12, 12);
  nut.translate(INNER + 6, 10, 0);
  add(nut, POM, mover);

  const outline = armOutline(4);
  return {
    dev,
    mover,
    shaft,
    housing,
    decal,
    width(y) {
      const sp = spanAt(outline, y);
      return sp ? sp[1] : 0;
    },
  };
}

// ---------- 狭い穴に見立てた半透明の膜 ----------
// くぼみ部より下（y=-24）に口があり、アームの先端側を包む。開き幅に合わせて口が横に伸び、膜は薄く明るくなる。
// 戻り値 update(current) を毎フレーム呼ぶ
function buildSleeve(device) {
  const INNER = -34.5;
  const CLR = 0.7;
  const R0 = 4.6;
  const B = 3.7;
  const YT = -24;
  const YB = -38;
  const RL = 0.8;
  const K = 14;
  const S = 6;
  const LN = 12;
  const CN = 10;

  const cols = [];
  for (let i = 0; i <= K; i++) cols.push([-Math.PI / 2 + (Math.PI * i) / K, 1]); // 駆動アーム側の半円
  for (let i = 1; i <= S; i++) cols.push([Math.PI / 2, 1 - (2 * i) / (S + 1)]); // 手前の直線部
  for (let i = 0; i <= K; i++) cols.push([Math.PI / 2 + (Math.PI * i) / K, -1]); // 固定アーム側の半円
  for (let i = 1; i <= S; i++) cols.push([Math.PI * 1.5, -1 + (2 * i) / (S + 1)]); // 奥の直線部

  const N = cols.length;
  const ROWS = LN + 1 + (YT - YB) + CN;
  const pos = new Float32Array(N * ROWS * 3);
  const idx = [];
  for (let r = 0; r < ROWS - 1; r++) {
    for (let j = 0; j < N; j++) {
      const a = r * N + j;
      const b = r * N + ((j + 1) % N);
      idx.push(a, a + N, b, b, a + N, b + N);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setIndex(idx);

  const C0 = new Color(0xe58e9e).convertSRGBToLinear();
  const C1 = new Color(0xf6c3cc).convertSRGBToLinear();
  const mat = new MeshStandardMaterial({
    color: C0.clone(),
    roughness: 0.3,
    metalness: 0,
    transparent: true,
    opacity: 0.6,
    side: DoubleSide,
    depthWrite: false,
  });
  const mesh = new Mesh(g, mat);
  mesh.renderOrder = 2;
  device.dev.add(mesh);

  let current = 0;
  const section = (y) => {
    const a = current / 2 + device.width(y) + CLR;
    const s = Math.max(0, a - R0);
    return [Math.max(a, R0), B + (R0 - B) * Math.exp(-s / 3)];
  };

  let prev = -1;
  return function update(travel) {
    if (travel === prev) return;
    prev = travel;
    current = travel;
    const cx = INNER + current / 2;
    const rows = [];
    let sc = section(YT);
    for (let k = 0; k <= LN; k++) {
      const ph = ((-150 + (330 * k) / LN) * Math.PI) / 180;
      rows.push([YT + RL * Math.sin(ph), sc[0], sc[1], RL + RL * Math.cos(ph)]); // 口の縁（丸まったふち）
    }
    for (let y = YT - 1; y >= YB; y--) {
      sc = section(y);
      rows.push([y, sc[0], sc[1], 0]);
    }
    const cap = 5 + 0.3 * (sc[0] - R0); // 先端より下は丸く閉じる
    for (let k = 1; k <= CN; k++) {
      const t = k / CN;
      const f = Math.sqrt(Math.max(0, 1 - t * t));
      rows.push([YB - cap * t, sc[0] * f, sc[1] * f, 0]);
    }
    let p = 0;
    rows.forEach((R) => {
      const L = R[1] - R[2];
      const rr = R[2] + R[3];
      cols.forEach((c) => {
        pos[p++] = cx + L * c[1] + rr * Math.cos(c[0]);
        pos[p++] = R[0];
        pos[p++] = rr * Math.sin(c[0]);
      });
    });
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const e = current / 60;
    mat.color.copy(C0).lerp(C1, e);
    mat.opacity = 0.6 - 0.22 * e;
  };
}

// ================= 外箱の透過（内部の送りねじ・ナットを見せる） =================
// 回転に合わせて自動で「不透明 → 透過 → 不透明」を繰り返す。
// 正面・背面を向いている時は不透明、横を向いている時（長い側面が見える時）に透過する。1回転で2往復。
function createSeeThrough(device) {
  const { housing, decal } = device;
  const ss = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return (spin) => {
    const xv = ss(0.25, 0.85, (1 - Math.cos(2 * spin)) / 2); // 0 = 不透明、1 = 透過
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
function initHero(state) {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const fallback = document.getElementById('fb');
  const renderer = createRenderer(stage);
  if (!renderer) return;
  renderer.toneMapping = NeutralToneMapping; // 白の階調（半透明の白の陰影）を白飛びさせずに残す
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(24, 1, 1, 2000);
  const LOOK = new Vector3(0, -14, 0);

  // 周囲の映り込み（室内を模した環境光）。艶と陰影の立体感を出す
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.15;
  pmrem.dispose();
  scene.add(new HemisphereLight(0xffffff, 0x3a4160, 0.35 * LIGHT));
  const key = new DirectionalLight(0xffffff, 0.85 * LIGHT);
  key.position.set(-40, 160, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004; // 面に出る細かい縞（影の計算誤差）を防ぐ
  key.shadow.normalBias = 0.25;
  Object.assign(key.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 10, far: 450 });
  scene.add(key);
  const fill = new DirectionalLight(0xdfe4ff, 0.35 * LIGHT);
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
  let spin = 0;
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
    seeThrough(spin);
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
    seeThrough(spin);
    place();
    renderer.render(scene, camera);
    if (fallback) fallback.style.display = 'none'; // 3Dの描画が始まったら静止画を隠す
    state.kick();
  }

  onContextLost(renderer, () => { alive = false; }, fallback);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) state.kick(); // タブが非表示の間は描画を止め、戻ったら再開
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) state.kick();
    }).observe(stage);
  }
  resize();
}

// ================= 化粧箱（boxA・packageA図面）：内寸122×91×32、PANTONE 289 C、文字 Cool Gray 1 C =================
// 36秒で1周。正面を向くとフタが開き、背面の文字が見える向きでは閉じる
function initBox() {
  const st = document.getElementById('boxstage');
  if (!st) return;
  const fallback = document.getElementById('boxfb');
  const renderer = createRenderer(st);
  if (!renderer) return;
  if (fallback) fallback.style.display = 'none';

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

  const NAVY = new MeshStandardMaterial({ color: 0x0c2340, roughness: 0.72, metalness: 0.02 }); // PANTONE 289 C
  const NAVY_IN = new MeshStandardMaterial({ color: 0x0e2747, roughness: 0.85 });
  const NOTCH = new MeshStandardMaterial({ color: 0x061429, roughness: 0.9 });
  const FOAM = new MeshStandardMaterial({ color: 0x151515, roughness: 0.96 }); // 黒色 高密度EVA
  [NAVY, NAVY_IN, NOTCH, FOAM].forEach((m) => m.color.convertSRGBToLinear()); // 指定色をsRGBとして扱う

  const grp = new Group();
  scene.add(grp);
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
    go();
  }

  onContextLost(renderer, () => { alive = false; }, fallback);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) go();
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(st);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) go();
    }).observe(st);
  }
  resize();
}

export function initScenes(state) {
  initHero(state);
  initBox();
}

// 梱包材のくり抜き形状（図面座標、mm）
const HOLE_A = [[13.47,-26.3],[13.07,-28.4],[12.43,-30.0],[11.53,-31.46],[10.22,-32.91],[8.64,-34.08],[7.1,-34.83],[5.21,-35.35],[3.25,-35.5],[1.31,-35.26],[-0.33,-34.74],[-2.06,-33.81],[-3.4,-32.74],[-4.53,-31.46],[-5.54,-29.78],[-6.14,-28.17],[-6.47,-26.3],[-38.9,-26.3],[-39.28,-26.21],[-39.61,-25.88],[-39.7,-24.89],[-40.02,-25.21],[-40.4,-25.3],[-50.4,-25.3],[-51.02,-25.01],[-51.2,-24.5],[-51.14,-6.19],[-50.84,-5.83],[-50.4,-5.7],[-40.4,-5.7],[-40.02,-5.79],[-39.7,-6.11],[-39.7,8.5],[-39.61,9.05],[-39.24,9.71],[-38.56,10.17],[-37.99,10.3],[-35.14,10.33],[-34.61,10.59],[-34.25,11.17],[-34.22,11.69],[-36.5,27.06],[-36.69,29.22],[-36.69,31.11],[-36.5,32.12],[-35.93,33.19],[-35.06,34.02],[-33.66,34.94],[-32.85,35.24],[-31.69,35.29],[-30.9,35.0],[-30.11,35.29],[-28.97,35.25],[-28.14,34.94],[-26.74,34.02],[-25.87,33.19],[-25.3,32.1],[-25.1,30.99],[-25.23,27.69],[-27.6,11.42],[-27.36,10.78],[-26.9,10.41],[-26.49,10.3],[-23.41,10.23],[-22.65,9.79],[-22.2,9.1],[-22.1,8.5],[-22.1,-4.7],[-6.5,-4.7],[-6.31,-2.55],[-5.74,-0.67],[-4.81,1.06],[-3.57,2.57],[-2.06,3.81],[-0.33,4.74],[1.55,5.31],[3.5,5.5],[5.45,5.31],[7.33,4.74],[9.06,3.81],[10.57,2.57],[11.81,1.06],[12.74,-0.67],[13.31,-2.55],[13.5,-4.7],[45.52,-4.7],[46.02,-4.45],[47.85,-4.45],[48.23,-4.54],[48.52,-4.81],[48.65,-5.25],[48.65,-11.7],[50.51,-11.72],[50.86,-11.88],[51.09,-12.19],[51.15,-18.58],[50.97,-19.01],[50.66,-19.24],[48.65,-19.3],[48.59,-19.81],[48.23,-20.21],[46.9,-20.3],[46.9,-25.58],[46.54,-26.17],[46.1,-26.3]];
const HOLE_B = [[13.47,-26.3],[13.07,-28.4],[12.43,-30.0],[11.53,-31.46],[10.22,-32.91],[8.64,-34.08],[7.1,-34.83],[5.21,-35.35],[3.25,-35.5],[1.31,-35.26],[-0.33,-34.74],[-2.06,-33.81],[-3.4,-32.74],[-4.53,-31.46],[-5.54,-29.78],[-6.14,-28.17],[-6.47,-26.3],[-38.9,-26.3],[-39.28,-26.21],[-39.61,-25.88],[-39.7,-24.89],[-40.02,-25.21],[-40.4,-25.3],[-50.63,-25.27],[-51.07,-24.94],[-51.2,-24.5],[-51.17,-6.27],[-50.84,-5.83],[-50.4,-5.7],[-40.4,-5.7],[-40.02,-5.79],[-39.7,-6.11],[-39.61,-5.12],[-39.34,-4.83],[-38.9,-4.7],[-6.5,-4.7],[-6.35,-2.79],[-5.83,-0.9],[-4.95,0.85],[-3.74,2.4],[-2.26,3.68],[-0.55,4.64],[1.31,5.26],[3.25,5.5],[5.21,5.35],[7.1,4.83],[9.06,3.81],[10.57,2.57],[11.81,1.06],[12.74,-0.67],[13.31,-2.55],[13.5,-4.7],[45.52,-4.7],[46.02,-4.45],[47.85,-4.45],[48.23,-4.54],[48.52,-4.81],[48.65,-5.25],[48.65,-11.7],[50.51,-11.72],[50.86,-11.88],[51.09,-12.19],[51.15,-18.58],[50.97,-19.01],[50.66,-19.24],[48.65,-19.3],[48.59,-19.81],[48.23,-20.21],[46.9,-20.3],[46.9,-25.58],[46.54,-26.17],[46.1,-26.3]];
