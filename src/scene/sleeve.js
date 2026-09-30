// Luca Bloom LP：狭い穴に見立てた半透明の膜（開き幅に合わせて口が伸びる）
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import './common.js'; // 色の扱い（ColorManagement）の設定を、素材を作る前に確定させる

// ---------- 狭い穴に見立てた半透明の膜 ----------
// くぼみ部より下（y=-24）に口があり、アームの先端側を包む。開き幅に合わせて口が横に伸び、膜は薄く明るくなる。
// 戻り値 update(current) を毎フレーム呼ぶ
export function buildSleeve(device) {
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
