"""Amazon 商品動画の BGM を作り、out/luca-bloom-amazon.mp4 に入れる（ナレーションなし）。

  python3 tools/video/audio.py            （先に npm run video で映像を作っておく）

・楽器はすべて実際の楽器を録音した音源（サンプル）を使う：
    VCSL（Versilian Community Sample Library）… スタインウェイのグランドピアノ、鉄琴、手拍子、シェイカー、タンバリン、カホン
    VSCO 2 CE（Versilian Studios Chamber Orchestra 2 Community Edition）… 弦楽器のピチカート・持続音、コントラバス、シンバル
  どちらも CC0（権利放棄）で、商用利用可・クレジット表記不要。初回に .cache/samples へ必要な分だけダウンロードする（約1.9GB）
・曲：ニ長調（Dメジャー）・110BPM・長調のコード中心。映像の場面に合わせて
  イントロ（タイトル）→ Aメロ → サビ（外箱が透ける場面から）→ 落ち着く（化粧箱）→ 盛り上げて最後の和音（エンディング）
・録音ごとの音程のずれを自動で測って補正し、ホールの残響・コンプレッサー（音量の粒をそろえる処理）をかけ、
  全体の音量を配信向けの -16 LUFS にそろえる。BGM だけの out/bgm.wav も出力する

必要なもの：pip install numpy scipy soundfile、git、ffmpeg（環境変数 FFMPEG で指定可）
"""
import glob
import os
import re
import subprocess
import sys
from fractions import Fraction

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'out')
SAMPLES = os.path.join(ROOT, '.cache', 'samples')
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
SR = 48000
DURATION = 65.0
N = int(DURATION * SR)

BPM = 110
BEAT = 60 / BPM  # 約0.545秒
E8 = BEAT / 2  # 8分音符
BAR = BEAT * 4  # 約2.18秒

rng = np.random.default_rng(2026)

# ---------------- 音源のダウンロード（必要なフォルダだけ） ----------------
LIBS = {
    'VCSL': ('https://github.com/sgossner/VCSL', [
        'Chordophones/Zithers/Grand Piano, Steinway B/Sus',
        'Idiophones/Struck Idiophones/Glockenspiel',
        'Idiophones/Struck Idiophones/Claps',
        'Idiophones/Struck Idiophones/Shaker, Small',
        'Idiophones/Struck Idiophones/Tambourine 1',
        'Idiophones/Struck Idiophones/Cajon',
    ]),
    'VSCO-2-CE': ('https://github.com/sgossner/VSCO-2-CE', [
        'Strings/Violin Section/Pizz',
        'Strings/Viola Section/pizz',
        'Strings/Cello Section/pizzT',
        'Strings/Solo Contrabass/Pizz',
        'Strings/Violin Section/susVib',
        'Strings/Viola Section/susvib',
        'Strings/Cello Section/susvib',
        'Percussion/cymbal-crash1_mf_rr1.wav',
        'Percussion/cymbal-crash1_mp_rr1.wav',
        'Percussion/susCymb1-cresc-Short_v1.wav',
    ]),
}


def fetch():
    for name, (url, paths) in LIBS.items():
        d = os.path.join(SAMPLES, name)
        if all(os.path.exists(os.path.join(d, p)) for p in paths):
            continue
        print(f'音源をダウンロード中：{name}')
        if not os.path.exists(d):
            subprocess.run(['git', 'clone', '-q', '--depth', '1', '--filter=blob:none', '--no-checkout', url, d], check=True)
        subprocess.run(['git', '-C', d, 'checkout', '-q', 'HEAD', '--', *paths], check=True)


# ---------------- サンプラー（録音した1音を、目的の高さ・長さに変えて鳴らす） ----------------
PC = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def load(path):
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x[:, :2], sr


def onset(x, thr=0.03):
    m = np.abs(x).max(axis=1)
    i = int(np.argmax(m > thr * m.max()))
    return max(0, i - 64)


def measure_cents(x, sr, midi, skip):
    # 録音の実際の高さを測る（基音か2倍音の山を探し、名前の高さとの差をセントで返す。100セント＝半音）
    m = x.mean(axis=1)
    seg = m[int(skip * sr): int((skip + 0.6) * sr)]
    if len(seg) < 2048:
        return 0.0
    nfft = 1 << 18
    S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), nfft))
    f = np.fft.rfftfreq(nfft, 1 / sr)
    best = None
    for h in (1, 2):
        c = hz(midi) * h
        w = np.where((f > c * 2 ** (-70 / 1200)) & (f < c * 2 ** (70 / 1200)))[0]
        if len(w) < 3:
            continue
        k = w[np.argmax(S[w])]
        a, b, g = S[k - 1], S[k], S[k + 1]
        p = 0.5 * (a - g) / (a - 2 * b + g) if (a - 2 * b + g) != 0 else 0
        peak = (k + p) * sr / nfft
        cand = (S[k], 1200 * np.log2(peak / c), h)
        if best is None or (h == 1 and cand[0] >= 0.25 * best[0]) or (h == 2 and cand[0] > 4 * best[0]):
            best = cand
    if best is None or abs(best[1]) > 50:
        return 0.0
    return float(best[1])


class Instrument:
    def __init__(self, pattern, octave=0, layer=r'_v(\d+)', layer_names=None, sustained=False, max_len=8.0):
        self.max_len = max_len
        self.sustained = sustained
        self.notes = []
        files = sorted(glob.glob(os.path.join(SAMPLES, pattern)))
        if not files:
            sys.exit(f'音源が見つかりません：{pattern}')
        for p in files:
            name = os.path.basename(p)
            m = re.search(r'_([A-G]#?)(\d)(?=[_.])', name)
            if not m:
                continue
            midi = 12 * (int(m.group(2)) + 1) + PC[m.group(1)] + octave
            lv = re.search(layer, name)
            key = lv.group(1) if lv else '0'
            rank = layer_names.index(key) if layer_names else int(key)
            self.notes.append((midi, rank, p))
        ranks = sorted({r for _, r, _ in self.notes})
        self.layers = ranks
        self.cache = {}
        self.data = {}
        # 一番強い層の音量で正規化（層ごとの強弱の差は録音のまま残す）
        loud = [p for _, r, p in self.notes if r == ranks[-1]]
        self.norm = 1.0 / max(np.abs(self._raw(p)[0]).max() for p in loud[:: max(1, len(loud) // 8)])

    def _raw(self, path):
        if path not in self.data:
            x, sr = load(path)
            x = x[onset(x, 0.02 if self.sustained else 0.05):]
            x = x[: int(self.max_len * sr * 1.3)]
            midi = next(m for m, _, p in self.notes if p == path)
            cents = measure_cents(x, sr, midi, 0.25 if self.sustained else 0.04)
            self.data[path] = (x, sr, cents)
        return self.data[path]

    def _pick(self, midi, vel):
        layer = self.layers[min(len(self.layers) - 1, int(vel * len(self.layers)))]
        cands = [(abs(m - midi), m, p) for m, r, p in self.notes if r == layer]
        d = min(c[0] for c in cands)
        near = [c for c in cands if c[0] == d]
        _, m, p = near[rng.integers(len(near))]  # 同じ音の録音が複数あれば交互に使う（機械的な連打感を防ぐ）
        return m, p

    def _shifted(self, path, smidi, midi):
        key = (path, midi)
        if key not in self.cache:
            x, sr, cents = self._raw(path)
            ratio = 2 ** ((midi - smidi) / 12 - cents / 1200)  # 高さの比（録音のずれも打ち消す）
            frac = Fraction(SR / (sr * ratio)).limit_denominator(400)
            y = resample_poly(x, frac.numerator, frac.denominator, axis=0)
            self.cache[key] = y[: int(self.max_len * SR)].astype(np.float32)
        return self.cache[key]

    def note(self, midi, vel, dur, release=0.25, attack=0.0):
        smidi, path = self._pick(midi, vel)
        y = self._shifted(path, smidi, midi)
        n = min(len(y), int((dur + release) * SR))
        out = y[:n].copy()
        t = np.arange(n) / SR
        env = np.where(t < dur, 1.0, np.exp(-(t - dur) / max(1e-3, release / 4)))
        if attack:
            env *= np.minimum(1, t / attack)
        lv = len(self.layers)
        within = (vel * lv) % 1 if vel < 1 else 1
        return out * env[:, None] * self.norm * (0.75 + 0.25 * within)


class Hits:
    def __init__(self, pattern, max_len=3.0):
        self.files = sorted(glob.glob(os.path.join(SAMPLES, pattern)))
        if not self.files:
            sys.exit(f'音源が見つかりません：{pattern}')
        self.data = {}
        for p in self.files:
            x, sr = load(p)
            x = x[onset(x, 0.05):]
            if sr != SR:
                frac = Fraction(SR, sr)
                x = resample_poly(x, frac.numerator, frac.denominator, axis=0)
            self.data[p] = x[: int(max_len * SR)].astype(np.float32)
        self.norm = 1.0 / max(np.abs(v).max() for v in self.data.values())

    def hit(self, vel=1.0, which=None):
        fs = [f for f in self.files if which is None or re.search(which, os.path.basename(f))]
        return self.data[fs[rng.integers(len(fs))]] * self.norm * vel


# ---------------- 楽譜 ----------------
# コード：bass＝コントラバス、lh＝ピアノ左手、rh＝ピアノ右手、arp＝ピチカートの分散和音、pad＝弦の持続音（低→高）
CH = {
    'D': dict(bass=38, lh=[38, 50], rh=[66, 69, 74], arp=[74, 78, 81, 86], pad=[50, 57, 66, 74, 78]),
    'A/C#': dict(bass=37, lh=[37, 49], rh=[64, 69, 73], arp=[73, 76, 81, 85], pad=[49, 57, 64, 73, 76]),
    'G': dict(bass=31, lh=[43, 55], rh=[67, 71, 74, 78], arp=[74, 79, 83, 86], pad=[43, 59, 67, 74, 78]),
    'A': dict(bass=33, lh=[45, 57], rh=[64, 69, 73, 76], arp=[73, 76, 81, 85], pad=[45, 57, 64, 73, 76]),
    'Asus': dict(bass=33, lh=[45, 57], rh=[64, 69, 74, 76], arp=[74, 76, 81, 86], pad=[45, 57, 64, 74, 76]),
    'D/F#': dict(bass=42, lh=[42, 54], rh=[66, 69, 74], arp=[74, 78, 81, 86], pad=[54, 57, 66, 74, 78]),
}
# 小節ごとのコードと場面（1小節＝約2.18秒）
#  0-1 イントロ / 2-13 Aメロ / 14-21 サビ / 22-25 落ち着く / 26 盛り上げ / 27 最後の和音（約59秒〜）
# 映像（tools/video/timeline.mjs）の場面の切れ目に合わせている：サビ＝面で当たる断面〜使い方、落ち着く＝化粧箱
FORM = (['D', 'A'] + ['D', 'A/C#', 'G', 'A', 'D', 'A/C#', 'G', 'Asus', 'D', 'A/C#', 'G', 'Asus']
        + ['G', 'A', 'D', 'D/F#', 'G', 'A', 'D', 'A'] + ['G', 'A', 'G', 'A', 'Asus', 'D'])
INTRO, VERSE, CHORUS, BREAK, BUILD, FINAL = range(0, 2), range(2, 14), range(14, 22), range(22, 26), 26, 27

# 鉄琴のメロディ（8分音符×8、None＝休み）
GLOCK_INTRO = [[86, None, 81, None, 78, None, 81, None], [85, None, 81, None, 76, None, None, None]]
MELODY = [
    [83, None, 81, 79, None, 81, 83, None],
    [85, None, 83, 81, None, None, 76, 78],
    [81, None, None, 78, None, 76, 74, None],
    [78, None, 76, 78, 81, None, None, None],
    [83, None, 81, 79, None, 81, 83, 86],
    [85, None, 83, 85, None, 88, None, 85],
    [86, None, None, None, 81, None, 78, None],
    [76, None, 78, None, 81, None, None, None],
]
GLOCK_BREAK = [[None] * 4 + [83, None, 81, None], [None] * 4 + [85, None, 81, None], [None] * 4 + [83, None, 86, None], [None] * 4 + [85, None, 88, None]]


def humanize(t):
    return t + rng.normal(0, 0.004)


class Mix:
    def __init__(self):
        self.stems = {}

    def add(self, stem, t, sig, pan=0.0, gain=1.0):
        buf = self.stems.setdefault(stem, np.zeros((N, 2), np.float32))
        s = int(round(t * SR))
        if s >= N or s + len(sig) <= 0:
            return
        a = max(0, -s)
        e = min(N, s + len(sig))
        g = np.array([min(1, 1 - pan), min(1, 1 + pan)], np.float32) * gain
        buf[s + a: e] += sig[a: e - s] * g


def compose(mix, I):
    for b, name in enumerate(FORM):
        c = CH[name]
        t0 = b * BAR
        nxt = BAR  # ペダルを踏んだまま次のコードまで響かせる

        # ---- ピアノ ----
        if b in INTRO:
            arp = c['rh'] + [c['rh'][0] + 12, c['rh'][1] + 12]
            for k in range(8):
                m = arp[[0, 1, 2, 3, 2, 4, 3, 1][k] % len(arp)]
                mix.add('piano', humanize(t0 + k * E8), I['piano'].note(m, 0.35 + 0.1 * (k % 3 == 0), nxt - k * E8, 0.4))
            mix.add('piano', t0, I['piano'].note(c['lh'][0], 0.45, nxt, 0.4))
        elif b in VERSE or b in CHORUS:
            hits = [(0, 1.5), (3, 1.5), (6, 1.0)] if b in VERSE else [(k, 0.5) for k in range(8)]
            for pos, beats in hits:
                acc = pos in (0, 3, 6)
                vel = (0.62 if acc else 0.38) if b in CHORUS else 0.5
                for m in c['rh']:
                    mix.add('piano', humanize(t0 + pos * E8), I['piano'].note(m, vel, beats * BEAT, 0.12))
            for pos in ((0, 4) if b in VERSE else (0, 3, 4, 6)):
                for m in c['lh']:
                    mix.add('piano', humanize(t0 + pos * E8), I['piano'].note(m, 0.55, 2 * E8 if b in CHORUS else 4 * E8, 0.2))
        elif b in BREAK:
            for m in c['lh'] + c['rh']:
                mix.add('piano', humanize(t0), I['piano'].note(m, 0.42, nxt, 0.5))
            for pos in (3, 6):
                for m in c['rh']:
                    mix.add('piano', humanize(t0 + pos * E8), I['piano'].note(m, 0.3, (8 - pos) * E8, 0.4))
        elif b == BUILD:
            for k in range(8):
                for m in c['rh']:
                    mix.add('piano', humanize(t0 + k * E8), I['piano'].note(m, 0.35 + 0.05 * k, E8, 0.1))
            for m in c['lh']:
                mix.add('piano', t0, I['piano'].note(m, 0.6, nxt, 0.2))
        elif b == FINAL:
            ring = DURATION - t0
            for m in c['lh'] + c['rh'] + [78, 86]:
                mix.add('piano', t0 + rng.uniform(0, 0.012), I['piano'].note(m, 0.8, ring, 0.5))

        # ---- ピチカート（バイオリン：分散和音、ビオラ：裏拍、チェロ：根音） ----
        if b in VERSE or b in CHORUS or b == BUILD:
            vel = 0.55 if b in VERSE else 0.75
            for k, idx in enumerate([0, 1, 2, 1, 3, 2, 1, 2]):
                mix.add('vln', humanize(t0 + k * E8), I['vln'].note(c['arp'][idx], vel * (1.0 if k % 2 == 0 else 0.8), E8 * 1.6, 0.3), pan=-0.3)
            for k in (1, 3, 5, 7):
                mix.add('vla', humanize(t0 + k * E8), I['vla'].note(c['rh'][1], vel * 0.8, E8, 0.3), pan=0.3)
            for k in (0, 4):
                mix.add('vc', humanize(t0 + k * E8), I['vc'].note(c['lh'][1], vel, 2 * E8, 0.3), pan=0.15)
        elif b in BREAK:
            for k in (0, 2, 4, 6):
                mix.add('vln', humanize(t0 + k * E8), I['vln'].note(c['arp'][[0, 2, 1, 3][k // 2]], 0.4, E8 * 2, 0.4), pan=-0.3)

        # ---- コントラバス（ピチカート） ----
        if b in VERSE:
            for k in (0, 4):
                mix.add('cb', humanize(t0 + k * E8), I['cb'].note(c['bass'], 0.7, 3 * E8, 0.25))
        elif b in CHORUS or b == BUILD:
            for k, iv in ((0, 0), (3, 0), (4, 0), (6, 7)):
                mix.add('cb', humanize(t0 + k * E8), I['cb'].note(c['bass'] + iv, 0.85, 1.5 * E8, 0.2))
        elif b in BREAK:
            mix.add('cb', t0, I['cb'].note(c['bass'], 0.55, 4 * E8, 0.4))
        elif b == FINAL:
            mix.add('cb', t0, I['cb'].note(c['bass'], 0.9, 3.0, 0.6))

        # ---- 弦の持続音（サビ・落ち着く場面・最後） ----
        if b in CHORUS or b in BREAK or b in (BUILD, FINAL):
            dur = (DURATION - t0 - 0.3) if b == FINAL else BAR + 0.12
            vel = 0.45 if b in BREAK else 0.7
            p = c['pad']
            pad_t = t0 - 0.08  # 弓の立ち上がり分だけ早めに
            mix.add('vcs', pad_t, I['vcs'].note(p[0], vel, dur, 0.6, attack=0.15), pan=0.2)
            mix.add('vas', pad_t, I['vas'].note(p[1], vel, dur, 0.6, attack=0.15), pan=0.1)
            mix.add('vas', pad_t, I['vas'].note(p[2], vel, dur, 0.6, attack=0.15), pan=0.1)
            for m in p[3:]:
                mix.add('vns', pad_t, I['vns'].note(m, vel, dur, 0.6, attack=0.15), pan=-0.15)

        # ---- 鉄琴 ----
        line = None
        if b in INTRO:
            line = GLOCK_INTRO[b]
        elif b in CHORUS:
            line = MELODY[b - CHORUS.start]
        elif b in BREAK:
            line = GLOCK_BREAK[b - BREAK.start]
        if line:
            for k, m in enumerate(line):
                if m is None:
                    continue
                vel = 0.75 if k % 2 == 0 else 0.6
                mix.add('glock', humanize(t0 + k * E8), I['glock'].note(m, vel, 1.6, 0.5), pan=0.2)
                if b in CHORUS:  # サビはピアノでも同じメロディを重ねて厚みを出す
                    mix.add('piano', humanize(t0 + k * E8), I['piano'].note(m, 0.5, E8 * 2, 0.2))
        if b == FINAL:
            mix.add('glock', t0, I['glock'].note(86, 0.8, 3.5, 0.5), pan=0.2)
            mix.add('glock', t0 + E8, I['glock'].note(93, 0.6, 3.0, 0.5), pan=0.2)

        # ---- リズム ----
        if b in VERSE or b in CHORUS:
            for k in ((0, 4) if b in VERSE else (0, 3, 4)):
                mix.add('kick', humanize(t0 + k * E8), I['cajon'].hit(0.9 if k != 3 else 0.6, 'hit3_f'))
            for k in (2, 6):
                mix.add('slap', humanize(t0 + k * E8), I['cajon'].hit(0.8, 'hit1_f_'))
            for k in range(8):
                mix.add('shaker', humanize(t0 + k * E8), I['shaker'].hit(0.9 if k % 2 == 0 else 0.6, 'Double_Down' if k % 2 == 0 else 'Double_Up'), pan=-0.35)
            if b in CHORUS:
                for k in (2, 6):
                    mix.add('clap', humanize(t0 + k * E8), I['clap'].hit(0.8, 'Clap_rr'))
                for k in (1, 3, 5, 7):
                    mix.add('tamb', humanize(t0 + k * E8), I['tamb'].hit(0.8, 'Hit_v2'), pan=0.35)
        elif b in BREAK:
            for k in range(8):
                mix.add('shaker', humanize(t0 + k * E8), I['shaker'].hit(0.5 if k % 2 == 0 else 0.35, 'Double_Down' if k % 2 == 0 else 'Double_Up'), pan=-0.35)
        elif b == BUILD:
            for k in range(8):
                mix.add('kick', humanize(t0 + k * E8), I['cajon'].hit(0.35 + 0.08 * k, 'hit3_f'))
                mix.add('tamb', humanize(t0 + k * E8), I['tamb'].hit(0.4 + 0.07 * k, 'Hit_v2'), pan=0.35)
        elif b == FINAL:
            mix.add('kick', t0, I['cajon'].hit(1.0, 'hit3_f'))

    # シンバル：サビ・最後の前にふくらませ（クレッシェンド）、頭で鳴らす
    swell = I['swell'].hit(1.0)
    peak = int(np.argmax(np.abs(swell).max(axis=1)))
    cut = swell[: peak + int(0.04 * SR)].copy()
    cut[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))[:, None]
    for target in (INTRO.stop * BAR, CHORUS.start * BAR, FINAL * BAR):
        mix.add('cym', target - peak / SR, cut, gain=0.5)
    for target, vel in ((CHORUS.start * BAR, 0.55), (FINAL * BAR, 0.8)):
        mix.add('cym', target, I['crash'].hit(vel))


# ---------------- 音作り（EQ・残響・コンプレッサー） ----------------
def hp(x, f):
    return sosfilt(butter(2, f, 'highpass', fs=SR, output='sos'), x, axis=0).astype(np.float32)


def lp(x, f):
    return sosfilt(butter(2, f, 'lowpass', fs=SR, output='sos'), x, axis=0).astype(np.float32)


def high_shelf(x, f0=4500, gain_db=3.0):
    # 高音域を少し持ち上げて、明るく抜けのよい音にする（RBJ 方式のシェルビングEQ）
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / 2 * np.sqrt(2)
    c = np.cos(w)
    b = [A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * c),
         A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al)]
    a = [(A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * c),
         (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al]
    sos = np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1, a[1] / a[0], a[2] / a[0]]])
    return sosfilt(sos, x, axis=0).astype(np.float32)


def active_rms(x):
    # 鳴っている部分だけの音量（休みの多いパートでも正しく比べられるように）
    m = x.mean(axis=1)
    blk = int(0.05 * SR)
    nb = len(m) // blk
    r = np.sqrt((m[: nb * blk].reshape(nb, blk) ** 2).mean(axis=1))
    on = r[r > r.max() * 0.03]
    return float(np.sqrt((on ** 2).mean())) + 1e-9


def hall_ir(seconds=2.4):
    # ホールの残響：初期反射＋帯域ごとに消える速さを変えた残響（高い音ほど早く消える）
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2), np.float32)
    bands = [(20, 250, 1.7), (250, 1000, 1.9), (1000, 4000, 1.5), (4000, 9000, 1.0), (9000, 20000, 0.55)]
    for ch in range(2):
        tail = np.zeros(n)
        for lo, hi, rt60 in bands:
            noise = rng.standard_normal(n)
            sos = butter(2, [lo, min(hi, SR / 2 - 100)], 'bandpass', fs=SR, output='sos')
            tail += sosfilt(sos, noise) * 10 ** (-3 * t / rt60)
        tail *= np.minimum(1, t / 0.05)
        pre = int(0.022 * SR)
        ir[pre:, ch] = tail[: n - pre]
        for _ in range(14):  # 初期反射
            d = int(rng.uniform(0.006, 0.08) * SR)
            ir[d, ch] += rng.uniform(0.15, 0.5) * (1 if rng.random() > 0.5 else -1) * np.exp(-d / SR / 0.05)
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))


def compressor(x, thresh_db=-14, ratio=2.0, attack=0.02, release=0.25):
    m = np.abs(x).max(axis=1)
    blk = int(0.005 * SR)
    nb = len(m) // blk
    lvl = np.sqrt((m[: nb * blk].reshape(nb, blk) ** 2).mean(axis=1)) + 1e-9
    db = 20 * np.log10(lvl)
    gr = np.minimum(0, (thresh_db - db) * (1 - 1 / ratio))
    g = np.zeros_like(gr)
    a, r = np.exp(-0.005 / attack), np.exp(-0.005 / release)
    cur = 0.0
    for i, v in enumerate(gr):
        cur = a * cur + (1 - a) * v if v < cur else r * cur + (1 - r) * v
        g[i] = cur
    gain = np.interp(np.arange(len(m)), np.arange(nb) * blk + blk / 2, 10 ** (g / 20))
    return x * gain[:, None]


def limiter(x, ceiling=0.89):
    look = int(0.004 * SR)
    peak = np.abs(x).max(axis=1)
    win = np.lib.stride_tricks.sliding_window_view(np.pad(peak, (0, look - 1), mode='edge'), look).max(axis=1)
    g = np.minimum(1, ceiling / np.maximum(win, 1e-9))
    k = int(0.003 * SR)
    g = np.convolve(np.pad(g, (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')[: len(x)]
    return x * np.minimum(g, np.minimum(1, ceiling / np.maximum(peak, 1e-9)))[:, None]


# 各パートの音量（dB、ピアノ基準）・残響の量・低音カット（Hz）
LEVELS = {
    'piano': (0, 0.20, 40), 'vln': (-6, 0.26, 150), 'vla': (-10, 0.26, 150), 'vc': (-9, 0.22, 60),
    'cb': (-4, 0.06, 0), 'vns': (-9, 0.32, 150), 'vas': (-11, 0.32, 120), 'vcs': (-11, 0.30, 50),
    'glock': (-8, 0.30, 300), 'kick': (-5, 0.06, 0), 'slap': (-11, 0.12, 120), 'shaker': (-17, 0.10, 400),
    'clap': (-12, 0.18, 200), 'tamb': (-18, 0.12, 500), 'cym': (-13, 0.20, 300),
}


def bgm():
    fetch()
    print('音源を読み込み中…')
    base = 'VSCO-2-CE/Strings/'
    I = {
        'piano': Instrument('VCSL/Chordophones/Zithers/Grand Piano, Steinway B/Sus/*.wav', 0, r'_vl(\d)', max_len=7.0),
        'vln': Instrument(base + 'Violin Section/Pizz/*.wav', 12),
        'vla': Instrument(base + 'Viola Section/pizz/*.wav', 12),
        'vc': Instrument(base + 'Cello Section/pizzT/*.wav', 12),
        'cb': Instrument(base + 'Solo Contrabass/Pizz/*.wav', 12),
        'vns': Instrument(base + 'Violin Section/susVib/*.wav', 12, sustained=True, max_len=10.0),
        'vas': Instrument(base + 'Viola Section/susvib/*.wav', 12, sustained=True, max_len=10.0),
        'vcs': Instrument(base + 'Cello Section/susvib/*.wav', 12, sustained=True, max_len=10.0),
        'glock': Instrument('VCSL/Idiophones/Struck Idiophones/Glockenspiel/*.wav', 12, r'glock_(soft|medium|loud)',
                            ['soft', 'medium', 'loud'], max_len=4.0),
        'cajon': Hits('VCSL/Idiophones/Struck Idiophones/Cajon/*.wav', 1.2),
        'shaker': Hits('VCSL/Idiophones/Struck Idiophones/Shaker, Small/*Double*.wav', 0.4),
        'clap': Hits('VCSL/Idiophones/Struck Idiophones/Claps/Clap_rr*.wav', 0.8),
        'tamb': Hits('VCSL/Idiophones/Struck Idiophones/Tambourine 1/*Hit*.wav', 1.0),
        'crash': Hits('VSCO-2-CE/Percussion/cymbal-crash1_m*_rr1.wav', 5.0),
        'swell': Hits('VSCO-2-CE/Percussion/susCymb1-cresc-Short_v1.wav', 4.0),
    }
    print('演奏を組み立て中…')
    mix = Mix()
    compose(mix, I)

    print('音作り（EQ・残響・コンプレッサー）…')
    dry = np.zeros((N, 2), np.float32)
    send = np.zeros((N, 2), np.float32)
    ref = active_rms(mix.stems['piano'])
    for name, (db, rev, cut) in LEVELS.items():
        x = mix.stems.get(name)
        if x is None:
            continue
        if cut:
            x = hp(x, cut)
        x = x * (ref / active_rms(x)) * 10 ** (db / 20)  # 鳴っている部分の音量をそろえてから、パートごとの差をつける
        dry += x
        send += x * rev
    ir = hall_ir()
    wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1).astype(np.float32)
    out = dry + lp(wet, 9000)
    out = high_shelf(hp(out, 28))
    t = np.arange(N) / SR
    out *= (np.minimum(1, t / 0.05) * np.minimum(1, (DURATION - t) / 1.8))[:, None]
    out /= np.abs(out).max()
    out = compressor(out)
    out /= np.abs(out).max()
    return limiter(out * 1.25)


def main():
    os.makedirs(OUT, exist_ok=True)
    # 引数で動画を指定できる（例：python3 tools/video/audio.py out/luca-bloom-amazon-en.mp4）
    video = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(OUT, 'luca-bloom-amazon.mp4')
    if not os.path.exists(video):
        sys.exit(f'先に映像を作ってください（{os.path.relpath(video, ROOT)} がありません。npm run video）。')
    music = bgm().astype(np.float32)
    wav = os.path.join(OUT, 'bgm.wav')
    sf.write(wav, music, SR)

    tmp = os.path.join(OUT, 'tmp-with-audio.mp4')
    subprocess.run(
        [FFMPEG, '-y', '-loglevel', 'error', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a',
         '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k',
         '-shortest', '-movflags', '+faststart', tmp],
        check=True,
    )
    os.replace(tmp, video)
    print(f'完成：{os.path.relpath(video, ROOT)}（BGM入り）、out/bgm.wav（BGMのみ）')


if __name__ == '__main__':
    main()
