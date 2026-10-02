"""Amazon 商品動画の音声（ナレーション＋BGM）を作り、out/luca-bloom-amazon.mp4 に入れる。

  python3 tools/video/audio.py            （先に npm run video で映像を作っておく）

・ナレーション：Kokoro（音声合成モデル。Apache-2.0 ライセンスで商用利用可・表記不要）の日本語音声 jf_alpha
・BGM：このスクリプトが音を一から合成する（既存曲を使わないので著作権の問題がない）
・ナレーションの間は BGM を自動で下げ（ダッキング）、全体の音量を配信向けの -16 LUFS にそろえる

必要なもの：pip install kokoro-onnx misaki fugashi mojimoji pyopenjtalk-plus unidic-lite soundfile numpy
（unidic-lite が入らない場合は SETUPTOOLS_USE_DISTUTILS=stdlib を付けて実行）、ffmpeg（環境変数 FFMPEG で指定可）
モデル（約350MB）は初回に .cache/tts へ自動ダウンロードする。
"""
import os
import subprocess
import sys
import urllib.request

import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'out')
CACHE = os.path.join(ROOT, '.cache', 'tts')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
SR = 48000
DURATION = 52.0
VOICE = os.environ.get('VOICE', 'jf_alpha')  # 男性の声にする場合は jm_kumo

# ---------- ナレーション（開始秒, 文）----------
# 読み間違いを防ぐため、数字や読みが分かれる語はかなで書く（方→かた、1回30分→いっかい さんじゅっぷん）
# 薬機法・Amazon 規約：効果効能・価格・比較表現は入れない
NARRATION = [
    (0.5, 'ルカブルーム。包皮が狭いかたのための、セルフケアツールです。'),
    (4.8, 'ハンドルを回すだけ。閉じたアームを入れて、内側から、ゆっくり広げます。'),
    (11.6, '開き幅は、最大ななじゅうミリ。無段階だから、痛みを感じない、ちょうどいい幅で止められます。'),
    (20.6, '内部の送りねじで固定されるから、手を離しても、戻りません。'),
    (27.9, '先端に向かって太くなる、逆テーパーアーム。ずれにくい形です。'),
    (33.8, '使い方は、3ステップ。なじませて、入れて、回すだけ。いっかい、さんじゅっぷん以内で、お使いください。'),
    (41.7, '化粧箱の表記は、ブランド名だけ。届いても、誰にもわかりません。'),
    (47.4, 'ルカブルーム。今日から、自分のペースで。'),
]
# 各文が次の場面までに終わるよう、話す速さの上限をここで決める（1.0＝標準）
SPEED = 1.05


def model_files():
    os.makedirs(CACHE, exist_ok=True)
    base = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
    paths = []
    for name in ('kokoro-v1.0.onnx', 'voices-v1.0.bin'):
        p = os.path.join(CACHE, name)
        if not os.path.exists(p):
            print(f'ダウンロード中：{name}')
            urllib.request.urlretrieve(base + name, p)
        paths.append(p)
    return paths


def resample(x, sr_in, sr_out):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def narration():
    from kokoro_onnx import Kokoro
    from misaki import ja

    g2p = ja.JAG2P()
    tts = Kokoro(*model_files())
    track = np.zeros(int(DURATION * SR))
    spans = []
    for i, (start, text) in enumerate(NARRATION):
        ps, _ = g2p(text)
        voice, sr = tts.create(ps, voice=VOICE, speed=SPEED, is_phonemes=True)
        voice = resample(np.asarray(voice, dtype=np.float64), sr, SR)
        # 前後の無音を切る
        idx = np.where(np.abs(voice) > 0.01)[0]
        voice = voice[max(0, idx[0] - 480): idx[-1] + 2400]
        end = start + len(voice) / SR
        limit = NARRATION[i + 1][0] if i + 1 < len(NARRATION) else DURATION - 0.6
        print(f'{start:5.1f}〜{end:5.1f}秒（上限 {limit:.1f}）{text}')
        if end > limit:
            sys.exit(f'ナレーションが次の場面にかかります：{text}')
        s = int(start * SR)
        track[s: s + len(voice)] += voice
        spans.append((start, end))
    track /= np.max(np.abs(track)) / 0.7
    return track, spans


# ---------- BGM：やわらかいエレピ（電子ピアノ）のアルペジオ＋パッド＋ベース＋控えめなリズム ----------
BPM = 80
BEAT = 60 / BPM  # 0.75秒
BAR = BEAT * 4  # 3秒
# コード進行（1小節ずつ）：Fmaj9 → G6 → Em7 → Am7（明るく落ち着いた響き）。数字は MIDI ノート番号
CHORDS = [
    (41, [57, 60, 64, 67, 69]),  # F：A C E G A
    (43, [55, 59, 62, 64, 67]),  # G：G B D E G
    (40, [55, 59, 62, 64, 67]),  # Em：G B D E G
    (45, [57, 60, 64, 67, 72]),  # Am：A C E G C
]


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(buf, t0, sig):
    s = int(t0 * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s]


def epiano(freq, dur, vel):
    # FM 合成で、鐘のような立ち上がりのある電子ピアノの音を作る
    t = np.arange(int(dur * SR)) / SR
    index = 1.6 * np.exp(-t * 6) + 0.25
    mod = np.sin(2 * np.pi * freq * t) * index
    env = np.exp(-t * 2.2) * np.minimum(1, t / 0.004)
    tail = np.minimum(1, (dur - t) / 0.08)
    return vel * env * tail * np.sin(2 * np.pi * freq * t + mod)


def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.9)
    sig = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        for det in (-0.12, 0.12):  # わずかにずらした2音で広がりを出す
            ff = f * 2 ** (det / 12)
            sig += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(4 * np.pi * ff * t)
    return env * sig / (len(notes) * 4)


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.02) * np.exp(-t * 0.9) * np.minimum(1, (dur - t) / 0.1)
    return env * (np.sin(2 * np.pi * freq * t) + 0.15 * np.sin(4 * np.pi * freq * t))


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.exp(-t * 11) * np.sin(2 * np.pi * np.cumsum(f) / SR)


def shaker(rng):
    t = np.arange(int(0.09 * SR)) / SR
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # 高い音だけ残す
    return 0.18 * np.exp(-t * 45) * n


def reverb(x, rng, seconds=2.4, mix=0.28):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):  # 左右で異なる残響にして広がりを出す
        ir = rng.standard_normal(n) * np.exp(-t * 3.2)
        ir[: int(0.02 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[: len(x)]
        out.append((1 - mix) * x + mix * wet)
    return np.stack(out, axis=1)


def bgm():
    rng = np.random.default_rng(7)
    n = int(DURATION * SR)
    keys = np.zeros(n)
    pads = np.zeros(n)
    low = np.zeros(n)
    drums = np.zeros(n)
    bars = int(np.ceil(DURATION / BAR))
    # アルペジオの順番（8分音符×8）
    order = [0, 2, 4, 3, 1, 3, 2, 4]
    for b in range(bars):
        t0 = b * BAR
        root, notes = CHORDS[b % 4]
        pads_on = True
        full = 1 <= b <= 15  # 3〜48秒は全パート
        add(pads, t0, pad(notes, BAR + 0.6) if pads_on else np.zeros(1))
        for k, j in enumerate(order):
            if not full and k % 2:
                continue  # 最初と最後は音数を減らす
            vel = (0.55 if k % 2 else 0.8) * rng.uniform(0.85, 1.0)
            add(keys, t0 + k * BEAT / 2 + rng.uniform(0, 0.008), epiano(hz(notes[j] + 12), 1.4, vel))
        if b >= 1:
            add(low, t0, bass(hz(root), BAR))
        if 2 <= b <= 15:
            add(drums, t0, kick() * 0.5)
            add(drums, t0 + 2 * BEAT, kick() * 0.35)
            for k in range(8):
                add(drums, t0 + k * BEAT / 2 + BEAT / 4, shaker(rng) * (1.0 if k % 2 else 0.6))
    music = 0.30 * keys + 0.55 * pads + 0.45 * low + 0.35 * drums
    st = reverb(music, rng)
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (DURATION - t) / 3.0)
    return st * fade[:, None]


def duck(spans):
    # ナレーション中は BGM を約 -9dB（0.35倍）に。下げは0.15秒、戻しは0.6秒かけてなめらかに
    n = int(DURATION * SR)
    gain = np.ones(n)
    for a, b in spans:
        s, e = int((a - 0.15) * SR), int((b + 0.1) * SR)
        gain[max(0, s): e] = 0.35
    k = int(0.3 * SR)
    smooth = np.convolve(gain, np.ones(k) / k, mode='same')
    return smooth


def main():
    os.makedirs(OUT, exist_ok=True)
    video = os.path.join(OUT, 'luca-bloom-amazon.mp4')
    if not os.path.exists(video):
        sys.exit('先に npm run video で映像を作ってください。')
    voice, spans = narration()
    music = bgm()
    music *= duck(spans)[:, None]
    music /= np.max(np.abs(music)) / 0.5
    mix = music * 0.55 + voice[:, None] * 0.9
    raw = os.path.join(OUT, 'audio-mix.wav')
    sf.write(raw, mix.astype(np.float32), SR)
    sf.write(os.path.join(OUT, 'bgm.wav'), (music / np.max(np.abs(music)) * 0.8).astype(np.float32), SR)

    tmp = os.path.join(OUT, 'tmp-with-audio.mp4')
    subprocess.run(
        [FFMPEG, '-y', '-loglevel', 'error', '-i', video, '-i', raw, '-map', '0:v', '-map', '1:a',
         '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
         '-shortest', '-movflags', '+faststart', tmp],
        check=True,
    )
    os.replace(tmp, video)
    os.remove(raw)
    print('完成：out/luca-bloom-amazon.mp4（ナレーション＋BGM）、out/bgm.wav（BGMのみ）')


if __name__ == '__main__':
    main()
