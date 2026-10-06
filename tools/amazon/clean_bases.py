"""Amazon の商品画像（日本語版 amazon/ja/）から日本語の文字だけを消し、海外版の下地（amazon/base/）を作る。
   python3 tools/amazon/clean_bases.py
文字を消した部分は、周りの背景（紺のグラデーション・カードの地・図の白地）で埋める。
図・3Dの描画・数字だけのラベル・英語の表記はそのまま残す。英語の文字は tools/amazon/build-images.mjs で重ねる。
"""
import cv2
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# 消す範囲（x0, y0, x1, y1, 埋め方）。smooth＝四辺の背景からなめらかにつなぐ、flat＝図の白地の色で塗る
KICKER = (115, 262, 1110, 336, 'smooth')  # 金色の小見出し
FOOT = (115, 1835, 1900, 1942, 'smooth')  # いちばん下の注記
MASKS = {
    '01-main': [
        KICKER, (115, 360, 1100, 652, 'smooth'), FOOT,
        (1520, 112, 1880, 200, 'smooth'),  # 右上の「実用新案出願済み」
        (285, 1250, 962, 1466, 'smooth'), (1168, 1250, 1846, 1466, 'smooth'),
        (285, 1532, 962, 1748, 'smooth'), (1168, 1532, 1846, 1748, 'smooth'),
    ],
    '02-size-spec': [
        KICKER, (115, 360, 1720, 492, 'smooth'), FOOT,
        (800, 596, 1120, 640, 'flat'), (895, 648, 1092, 681, 'flat'), (780, 1286, 1128, 1331, 'flat'),
        (115, 1394, 1900, 1780, 'smooth'),
    ],
    '03-arm-design': [
        KICKER, (115, 360, 1720, 496, 'smooth'), FOOT,
        (160, 588, 935, 772, 'flat'), (1045, 588, 1822, 772, 'flat'),
        (633, 1284, 925, 1442, 'flat'), (633, 1560, 850, 1654, 'flat'),
        (1285, 1452, 1515, 1500, 'flat'), (1165, 1558, 1720, 1622, 'flat'),
    ],
    '04-stepless': [
        KICKER, (115, 360, 1720, 652, 'smooth'), FOOT,
        (300, 1292, 1660, 1478, 'smooth'),
        (155, 1545, 667, 1745, 'smooth'), (745, 1545, 1255, 1745, 'smooth'), (1333, 1545, 1843, 1745, 'smooth'),
    ],
}


def fill(img, x0, y0, x1, y1, how):
    out = img.astype(np.float32)
    k = 4  # 境界の外側4画素の中央値を、その辺の色とする
    top = np.median(out[y0 - k:y0, x0:x1], axis=0)
    bottom = np.median(out[y1:y1 + k, x0:x1], axis=0)
    left = np.median(out[y0:y1, x0 - k:x0], axis=1)
    right = np.median(out[y0:y1, x1:x1 + k], axis=1)
    if how == 'flat':
        # 図の白地：周り12画素の帯でいちばん多い色（寸法線などの細い線に引っぱられない）
        ring = np.concatenate([
            out[y0 - 12:y0, x0 - 12:x1 + 12].reshape(-1, 3), out[y1:y1 + 12, x0 - 12:x1 + 12].reshape(-1, 3),
            out[y0:y1, x0 - 12:x0].reshape(-1, 3), out[y0:y1, x1:x1 + 12].reshape(-1, 3),
        ])
        q = (ring // 4).astype(int)
        keys, counts = np.unique(q[:, 0] * 65536 + q[:, 1] * 256 + q[:, 2], return_counts=True)
        mode = keys[counts.argmax()]
        pick = ring[(q[:, 0] * 65536 + q[:, 1] * 256 + q[:, 2]) == mode]
        out[y0:y1, x0:x1] = pick.mean(axis=0)
        return out.astype(np.uint8)
    # 四辺の色から内側をなめらかに補間する（クーンズ面：横の補間＋縦の補間−四隅の双線形）
    h, w = y1 - y0, x1 - x0
    u = np.linspace(0, 1, w)[None, :, None]
    v = np.linspace(0, 1, h)[:, None, None]
    H = left[:, None] * (1 - u) + right[:, None] * u
    V = top[None] * (1 - v) + bottom[None] * v
    c00, c10, c01, c11 = top[0], top[-1], bottom[0], bottom[-1]
    B = c00 * (1 - u) * (1 - v) + c10 * u * (1 - v) + c01 * (1 - u) * v + c11 * u * v
    out[y0:y1, x0:x1] = H + V - B
    return np.clip(out, 0, 255).astype(np.uint8)


for name, masks in MASKS.items():
    img = cv2.imread(str(ROOT / 'amazon/ja' / f'{name}.jpg'))
    for m in masks:
        img = fill(img, *m)
    # なめらかに埋めた部分の段差（バンディング）を目立たなくする、ごく弱いノイズ
    noise = np.random.default_rng(1).normal(0, 0.6, img.shape)
    img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(str(ROOT / 'amazon/base' / f'{name}.png'), img)
    print(f'amazon/base/{name}.png')
