# Synthesises music + SFX on the shared timeline and mixes them with the voice.
# Usage: python3 audio.py  -> build/music.wav, build/sfx.wav, build/voice.wav, build/mix.wav
import json, os, subprocess, numpy as np
here = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(here, 'build'); os.makedirs(B, exist_ok=True)
C = json.load(open(os.path.join(here, 'timeline.json')))
SR = 48000; ST = C['starts']; T = C['total'] + 0.6; N = int(T * SR)
rng = np.random.default_rng(5)
BPM = 120; BEAT = 60 / BPM; E8 = BEAT / 2; BAR = BEAT * 4

def tl(n): return np.arange(n) / SR
def add(buf, t, sig, g=1.0, pan=0.0):
    i = int(round(t * SR));
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * g * l * 1.414; buf[i:i + len(sig), 1] += sig * g * r * 1.414
def onepole(x, a):  # simple lowpass, a in (0,1): higher = brighter
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)): s += a * (x[k] - s); y[k] = s
    return y
def hp(x, a): return x - onepole(x, a)
def env(n, att, dec):
    t = tl(n); return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
def kick(g=1.0):
    n = int(.35 * SR); t = tl(n); f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) * np.exp(-t * 9) + 0.3 * rng.standard_normal(n) * np.exp(-t * 250)) * g
def clap():
    n = int(.22 * SR); x = rng.standard_normal(n); e = np.zeros(n)
    for o in (0, .012, .024): i = int(o * SR); e[i:] += np.exp(-tl(n - i) * 38)
    return hp(onepole(x, .5), .08) * e * .5
def hat(open_=False):
    n = int((.16 if open_ else .05) * SR); return onepole(hp(rng.standard_normal(n), .35), .6) * np.exp(-tl(n) * (18 if open_ else 70)) * .2
def pluck(m, dur=.45):
    n = int(dur * SR); t = tl(n); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 14) + .18 * np.sin(2 * np.pi * 4.02 * f * t) * np.exp(-t * 30)
    return s * env(n, .003, .16) * .32
def bass(m, dur):
    n = int(dur * SR); t = tl(n); f = mtof(m); s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))
    return s * env(n, .005, dur * .7) * .32
def pad(ms, dur):
    n = int(dur * SR); t = tl(n); s = np.zeros(n)
    for m in ms:
        for d in (-.12, .12):
            f = mtof(m + d / 1); s += sum(np.sin(2 * np.pi * f * k * t + k) / k ** 1.4 for k in range(1, 5))
    a = np.minimum(1, t / .5) * np.minimum(1, (dur - t) / .6); return s * a * .06
def noise_sweep(dur, f0, f1, g=1.0, up=True):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); s1 = s2 = 0.0
    for k in range(n):
        p = k / n; f = f0 * (f1 / f0) ** p; a = min(.99, 2 * np.pi * f / SR)
        s1 += a * (x[k] - s1); s2 += a * (s1 - s2); y[k] = s1 - s2 * .6
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** (1.5 if up else .8)
    return y * e * g
def boom(g=1.0, dur=1.2):
    n = int(dur * SR); t = tl(n); f = 32 + 70 * np.exp(-t * 7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    return (s + onepole(rng.standard_normal(n), .2) * np.exp(-t * 7) * .6) * g
def ching():
    n = int(.9 * SR); t = tl(n); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2093, 5), (2637, 6), (3136, 7), (4186, 9)))
    return (s * .22 + hp(rng.standard_normal(n), .4) * np.exp(-t * 90) * .4)
def click(): n = int(.03 * SR); return hp(rng.standard_normal(n), .5) * np.exp(-tl(n) * 220) * .8
def paper(): n = int(.05 * SR); return onepole(hp(rng.standard_normal(n), .15), .35) * np.exp(-tl(n) * 90) * .9  # soft paper rustle
def tick(): n = int(.12 * SR); t = tl(n); return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) * .35 + hp(rng.standard_normal(n), .3) * np.exp(-t * 40) * .25
def pop(): n = int(.12 * SR); t = tl(n); f = 900 * np.exp(-t * 18) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * .5
def thud(): n = int(.4 * SR); t = tl(n); return np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 10)

# ---------- music ----------
M = np.zeros((N, 2))
CH = [(48, [48, 52, 55]), (55, [55, 59, 62]), (57, [57, 60, 64]), (53, [53, 57, 60])]   # C G Am F
ARP = [0, 1, 2, 1, 2, 0, 1, 2]
def section(t):
    s = 0
    for k, v in enumerate(ST):
        if t >= v - 1e-6: s = k
    return s
cs = lambda s, k: ST[s] + C['s%d' % s][k]
blink_t = cs(0, 'blink'); more_t = cs(3, 'more'); end_hit = cs(4, 'hit')
def bell(m, dur=1.4):
    n = int(dur * SR); t = tl(n); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)) * np.exp(-t * 2.2) * .18
def coin(m=96, g=1.0):
    n = int(.4 * SR); t = tl(n); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 12) * .25 * g
for b in range(int(T / E8) + 1):
    t = b * E8; s = section(t); bar = int(t // BAR); root, tri = CH[bar % 4]; pos = b % 8
    if t > end_hit + .05: break
    if pos % 2 == 0: add(M, t, kick(.95))
    if pos in (2, 6): add(M, t, clap(), .5, .1)
    add(M, t + (E8 / 2 if pos % 2 == 0 else 0), hat(pos == 7), .7, -.3)
    add(M, t, bass(root - 12 + (12 if pos in (3, 7) else 0), E8 * .95), .9)
    m = tri[ARP[pos] % 3] + (12 if pos in (4, 5) else 0)
    add(M, t, pluck(m + 12, .5), .8, .35 if pos % 2 else -.35)
    if pos == 0 and s == 4: add(M, t, pad([x + 12 for x in tri], BAR), 1.1)
for tt in (blink_t, cs(1, 'a1'), cs(2, 'n1'), more_t):
    add(M, tt - 1.0, noise_sweep(1.0, 300, 6000, .2), 1)
    add(M, tt, boom(1.0, 1.4)); add(M, tt, noise_sweep(1.1, 9000, 400, .22, up=False), 1, .2)
add(M, end_hit, boom(.7, 1.4)); add(M, end_hit, pad([48 + 12, 52 + 12, 55 + 12], 1.2), 1.3)
for m in (72, 76, 79, 84): add(M, end_hit, bell(m + 12, 1.4), 1.1)

# ---------- SFX ----------
X = np.zeros((N, 2))
for i in range(1, len(ST)): add(X, ST[i] - .32, noise_sweep(.6, 400, 5000, .45), 1, (-.4, .4)[i % 2])
add(X, 0.0, ching(), .8); add(X, 0.02, thud(), .9)                                    # first frame: cash register + the number
for k in range(int(ST[1] * 6)): add(X, k / 6 + .1, paper(), .16, rng.uniform(-.8, .8))   # dollar rain rustle
for k in range(int(ST[1] / .25)): add(X, .15 + k * .25, tick(), .12, .2)                  # counter ticking each quarter second
add(X, cs(0, 'sal') - .1, pop(), .7); add(X, blink_t, click(), 1.0); add(X, blink_t + .02, thud(), .8)
for s_, ks in ((1, ('a1', 'g1')), (2, ('n1', 'm1'))):
    for j, k in enumerate(ks):
        t0 = cs(s_, k) - .1; add(X, t0, noise_sweep(.35, 600, 4000, .3), 1, (-.5, .5)[j])
        for q in range(14): add(X, t0 + .1 + q * .05, tick(), .3, (-.3, .3)[j])
        add(X, t0 + .8, ching(), .55, (-.3, .3)[j])
add(X, cs(3, 'gpt'), noise_sweep(.6, 200, 3000, .3, up=True), 1, -.4); add(X, cs(3, 'gpt') + .6, coin(88), 1, -.4)
add(X, cs(3, 'cl'), noise_sweep(.6, 200, 3000, .3, up=True), 1, .4); add(X, cs(3, 'cl') + .6, coin(93), 1, .4)
add(X, more_t, thud(), 1.0); add(X, more_t + .02, click(), .9); add(X, more_t + .05, ching(), .6)
for k in range(int((TOTAL if False else 0) * 0)): pass
add(X, cs(4, 'vs'), pop(), .7, -.4); add(X, cs(4, 'vs') + .15, pop(), .7, .4)
add(X, cs(4, 'num'), pop(), .7); add(X, cs(4, 'send') - .1, noise_sweep(.4, 600, 5000, .35), 1, .5); add(X, cs(4, 'send') + .2, pop(), .6, .4)
add(X, end_hit, ching(), .7); add(X, end_hit, click(), 1.0)

# ---------- voice ----------
V = np.zeros(N)
import wave
for i, s in enumerate(ST):
    w = wave.open(os.path.join(here, 'voice', f'v{i}.wav')); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
    j = int((s + C['VO']) * SR); V[j:j + len(a)] += a[:N - j]

def wr(name, x):
    x = np.clip(x, -1, 1); x = (x * 32767).astype(np.int16)
    w = wave.open(os.path.join(B, name), 'wb'); w.setnchannels(x.shape[1] if x.ndim == 2 else 1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes()); w.close()
pk = lambda x: np.max(np.abs(x)) + 1e-9
OUT = os.environ.get('MIXOUT', 'mix.wav')
wr('music.wav', M / pk(M) * .7); wr('sfx.wav', X / pk(X) * .7); wr('voice.wav', V / pk(V) * .9)
# duck music under voice, then mix and loudness-normalise for Instagram (-14 LUFS)
pre = os.path.join(B, 'premix.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'music.wav'), '-i', os.path.join(B, 'voice.wav'), '-i', os.path.join(B, 'sfx.wav'), '-filter_complex',
  '[1:a]asplit=2[vk][vm];[vk]aformat=channel_layouts=stereo[vks];[0:a]volume=0.33[m];[m][vks]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=280[md];'
  '[vm]aformat=channel_layouts=stereo,volume=1.0[v];[2:a]volume=0.55[s];[md][v][s]amix=inputs=3:normalize=0,alimiter=limit=0.7:level=false[a]',
  '-map', '[a]', '-ar', '48000', '-ac', '2', pre], check=True)
# two-pass loudnorm (linear) -> -14 LUFS, true peak <= -1.5 dBTP
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
ln = f"loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', ln, '-ar', '48000', os.path.join(B, OUT)], check=True)
print('mix ok', round(T, 2), 's')
