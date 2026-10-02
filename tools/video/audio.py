"""Amazon 商品動画の BGM を作り、out/luca-bloom-amazon.mp4 に入れる（ナレーションなし）。

  python3 tools/video/audio.py            （先に npm run video で映像を作っておく）

・曲はこのスクリプトが音を一から合成する（既存曲を使わないので著作権の問題がない）
・明るい曲調：ニ長調（Dメジャー）・116BPM・長調のコードだけ（D→A→G→A）。
  ウクレレ風のストローク、鉄琴（グロッケン）のメロディ、弾むベース、手拍子
・全体の音量を配信向けの -16 LUFS にそろえる。BGM だけの out/bgm.wav も出力する

必要なもの：pip install numpy soundfile、ffmpeg（環境変数 FFMPEG で指定可）
"""
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'out')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
SR = 48000
DURATION = 52.0

BPM = 116
BEAT = 60 / BPM  # 約0.52秒
EIGHTH = BEAT / 2
BAR = BEAT * 4  # 約2.07秒
BARS = int(np.ceil(DURATION / BAR))  # 26小節

# コード（ルート音, ストロークで鳴らす4音）。数字は MIDI ノート番号（60＝ド）
D = (50, [62, 66, 69, 74])
A = (45, [61, 64, 69, 73])
G = (43, [62, 67, 71, 74])
PROGRESSION = [D, A, G, A, D, A, G, D]  # 8小節でひと回り（短調のコードは使わない）

# 鉄琴のメロディ（8分音符×8／小節、None＝休み）。D メジャーペンタトニック中心
MELODY = [
    [78, None, 81, None, 83, 81, 78, None],
    [76, None, None, 76, 78, 76, 73, None],
    [74, None, 76, 78, None, 83, 81, None],
    [81, None, None, None, 76, None, None, None],
    [78, None, 81, None, 86, None, 83, 81],
    [81, None, 76, None, 78, None, 76, None],
    [74, None, 76, None, 78, None, 83, None],
    [86, None, None, None, None, None, None, None],
]

# ストロークの型：8分音符の位置と向き（d＝ダウン、u＝アップ）。「ダン・ダダ・ダダダ」と弾む
STRUM = [(0, 'd'), (2, 'd'), (3, 'u'), (5, 'u'), (6, 'd'), (7, 'u')]

rng = np.random.default_rng(11)


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(buf, t0, sig, gain=1.0):
    s = int(round(t0 * SR))
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += gain * sig[: e - s]


def pluck(freq, dur, bright=0.6):
    # 撥弦（Karplus-Strong 法）：ノイズを短い周期で繰り返し減衰させて、弦をはじいた音を作る
    n = int(dur * SR)
    period = max(2, int(SR / freq))
    noise = rng.uniform(-1, 1, period)
    for _ in range(int((1 - bright) * 4)):  # 回数が多いほど柔らかい音
        noise = 0.5 * (noise + np.roll(noise, 1))
    out = np.zeros(n + period)
    out[:period] = noise
    for s in range(period, n, period):
        prev = out[s - period: s]
        shifted = np.concatenate(([out[s - period - 1] if s - period - 1 >= 0 else 0.0], prev[:-1]))
        out[s: s + period] = 0.996 * 0.5 * (prev + shifted)
    out = out[:n]
    # 周期を整数にした分の音程のずれを、再サンプリングで正確な高さに直す
    actual = SR / (period + 0.5)  # 実際に鳴る高さ（目的の高さより少し高い）
    idx = np.arange(n) * (freq / actual)  # ゆっくり読み出して目的の高さに下げる
    idx = idx[idx < n - 1]
    return np.interp(idx, np.arange(n), out)


def glock(freq, dur, vel):
    # 鉄琴：基音＋高い倍音（2.76倍・5.4倍）が速く消える、きらっとした音
    t = np.arange(int(dur * SR)) / SR
    sig = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.0)
           + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 9)
           + 0.12 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 18))
    return vel * sig * np.minimum(1, t / 0.002)


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.006) * np.exp(-t * 5) * np.minimum(1, (dur - t) / 0.03)
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    return env * np.tanh(1.5 * s)


def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 48 + 90 * np.exp(-t * 35)
    return np.exp(-t * 13) * np.sin(2 * np.pi * np.cumsum(f) / SR)


def clap():
    # 手拍子：短いノイズを3回重ね、高めの帯域だけ残す
    t = np.arange(int(0.25 * SR)) / SR
    out = np.zeros(len(t))
    for k, d in enumerate((0, 0.011, 0.022)):
        s = int(d * SR)
        seg = rng.standard_normal(len(t) - s) * np.exp(-t[: len(t) - s] * (60 if k < 2 else 18))
        out[s:] += seg
    out = np.diff(out, prepend=0)
    return 0.5 * out / np.max(np.abs(out))


def shaker():
    t = np.arange(int(0.07 * SR)) / SR
    n = np.diff(np.diff(rng.standard_normal(len(t)), prepend=0), prepend=0)
    return 0.1 * np.exp(-t * 55) * n


def reverb(x, seconds=1.6, mix=0.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):  # 左右で異なる残響にして広がりを出す
        ir = rng.standard_normal(n) * np.exp(-t * 4.0)
        ir[: int(0.015 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[: len(x)]
        out.append((1 - mix) * x + mix * wet)
    return np.stack(out, axis=1)


def bgm():
    n = int(DURATION * SR)
    uke = np.zeros(n)
    bell = np.zeros(n)
    low = np.zeros(n)
    drums = np.zeros(n)
    last = BARS - 1
    for b in range(BARS):
        t0 = b * BAR
        root, notes = PROGRESSION[b % 8]
        intro = b < 2  # 最初の約4秒（タイトル）はウクレレだけ
        quiet = 20 <= b < 23  # 化粧箱の場面は少し控えめに
        if b == last:
            # 最後は D のコードを1回鳴らして余韻で終わる
            root, notes = D
            for i, m in enumerate(notes):
                add(uke, t0 + i * 0.018, pluck(hz(m), 3.0, 0.7), 0.9)
            add(bell, t0, glock(hz(86), 3.0, 0.8))
            add(low, t0, bass(hz(root), 2.5))
            add(drums, t0, kick(), 0.8)
            continue

        # ウクレレのストローク（次のストロークで前の音を止める）
        for k, (pos, way) in enumerate(STRUM):
            start = t0 + pos * EIGHTH
            nxt = STRUM[k + 1][0] if k + 1 < len(STRUM) else 8
            dur = (nxt - pos) * EIGHTH + 0.04
            order = notes if way == 'd' else notes[::-1]
            vel = (0.9 if way == 'd' else 0.6) * (1.0 if pos in (0, 6) else 0.85)
            for i, m in enumerate(order):
                sig = pluck(hz(m), dur, 0.65 if way == 'd' else 0.75)
                sig *= np.minimum(1, (dur - np.arange(len(sig)) / SR) / 0.03).clip(0, 1)
                add(uke, start + i * 0.012 + rng.uniform(0, 0.004), sig, vel)
        if intro:
            continue

        # メロディ（全体で2回まわし、化粧箱の場面は休む）
        if 2 <= b < 18 and not quiet:
            for k, m in enumerate(MELODY[(b - 2) % 8]):
                if m is not None:
                    add(bell, t0 + k * EIGHTH, glock(hz(m), 1.2, 0.75 if k % 2 == 0 else 0.6))
        # ベース：1拍目・2拍目のウラ・3拍目・4拍目で弾む
        for pos, oct_ in ((0, 0), (3, 12), (4, 0), (6, 12)):
            add(low, t0 + pos * EIGHTH, bass(hz(root + oct_), EIGHTH * 1.6), 0.8 if oct_ else 1.0)
        # リズム：キック（1・3拍）、手拍子（2・4拍）、シェイカー（16分音符）
        add(drums, t0, kick())
        add(drums, t0 + 2 * BEAT, kick(), 0.8)
        if not quiet:
            add(drums, t0 + BEAT, clap(), 0.55)
            add(drums, t0 + 3 * BEAT, clap(), 0.55)
        for k in range(16):
            add(drums, t0 + k * BEAT / 4, shaker(), 1.0 if k % 2 else 0.5)

    dry = 0.42 * uke + 0.30 * bell + 0.40 * low + 0.45 * drums
    st = reverb(dry)
    # 定位：ウクレレをやや左、鉄琴をやや右に
    st[:, 0] += 0.06 * uke - 0.04 * bell
    st[:, 1] += 0.06 * bell - 0.04 * uke
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.4) * np.minimum(1, (DURATION - t) / 2.0)
    st *= fade[:, None]
    return st / np.max(np.abs(st)) * 0.8


def main():
    os.makedirs(OUT, exist_ok=True)
    video = os.path.join(OUT, 'luca-bloom-amazon.mp4')
    if not os.path.exists(video):
        sys.exit('先に npm run video で映像を作ってください。')
    music = bgm().astype(np.float32)
    wav = os.path.join(OUT, 'bgm.wav')
    sf.write(wav, music, SR)

    tmp = os.path.join(OUT, 'tmp-with-audio.mp4')
    subprocess.run(
        [FFMPEG, '-y', '-loglevel', 'error', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a',
         '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
         '-shortest', '-movflags', '+faststart', tmp],
        check=True,
    )
    os.replace(tmp, video)
    print('完成：out/luca-bloom-amazon.mp4（BGM入り）、out/bgm.wav（BGMのみ）')


if __name__ == '__main__':
    main()
