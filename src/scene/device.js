// Luca Bloom LP：本体一式の形状（本体・送りねじ・リリースプレート・アーム）とPOM樹脂の素材
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Path,
  PlaneGeometry,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import './common.js'; // 色の扱い（ColorManagement）の設定を、素材を作る前に確定させる

// ---------- 形状の部品 ----------
// POM樹脂（ナチュラル）：磁器のような白。clearcoat（薄い艶の層）と、ヒーローの環境光の映り込み・
// ACESトーンマッピング（白の階調をやわらかくする明るさ補正）で、原案に近い樹脂の質感を出す。
// ※ transmission（光の透過計算）は描画が約6倍重くなるため使わない（2026-09-30 計測）
const pom = (extra) =>
  new MeshPhysicalMaterial({
    color: 0xf3f1ea,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
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
export function upright(g, y0) {
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
export function buildDevice() {
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
  // 角は R1 の丸み（3分割）。成形品らしい柔らかいハイライトが角に出る
  {
    const R = 1;
    const s = new Shape();
    roundRect(s, -42.5 + R, -10 + R, 85 - 2 * R, 20 - 2 * R, 0.3, false);
    roundRect(s, -39 - R, -6.5 - R, 78 + 2 * R, 13 + 2 * R, 1.5, true);
    add(
      upright(
        new ExtrudeGeometry(s, {
          depth: 20 - 2 * R,
          bevelEnabled: true,
          bevelThickness: R,
          bevelSize: R,
          bevelSegments: 3,
          curveSegments: 6,
        }),
        R,
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
