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
CH = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]   # Am F C G
ARP = [0, 1, 2, 1, 2, 0, 1, 2]
def section(t):
    s = 0
    for k, v in enumerate(ST):
        if t >= v - 1e-6: s = k
    return s
jump_t = ST[1]; end_hit = ST[4] + C['s4']['hit']; x15_t = ST[2] + C['s2']['x15']
def bell(m, dur=1.4):
    n = int(dur * SR); t = tl(n); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)) * np.exp(-t * 2.2) * .18
def beep(f, dur=.18):
    n = int(dur * SR); t = tl(n); return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .005) * np.exp(-t * 9) * .5
def boing(dur=.6):
    n = int(dur * SR); t = tl(n); f = 180 + 520 * (t / dur) + 40 * np.sin(2 * np.pi * 18 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * .45
for b in range(int(T / E8) + 1):
    t = b * E8; s = section(t); bar = int(t // BAR); root, tri = CH[bar % 4]; pos = b % 8
    if t > end_hit + .05: break
    intro = t < jump_t                       # countdown: no drums, building tension
    dive = s == 3                            # atom: airy, no kick
    if not intro and not dive:
        if pos % 2 == 0: add(M, t, kick(.9))
        if pos in (2, 6): add(M, t, clap(), .5, .1)
        add(M, t + (E8 / 2 if pos % 2 == 0 else 0), hat(pos == 7), .65, -.3)
        add(M, t, bass(root - 12 + (12 if pos in (3, 7) else 0), E8 * .95), .85)
    m = tri[ARP[pos] % 3] + (12 if pos in (4, 5) else 0)
    add(M, t, pluck(m + 12, .5), .55 if intro else .8, .35 if pos % 2 else -.35)
    if pos == 0 and (dive or s == 4): add(M, t, pad([x + 12 for x in tri], BAR), 1.1)
    if dive and pos in (0, 3, 6): add(M, t, bell(tri[pos % 3] + 24), 1, (-.5, .5)[pos % 2])
r = noise_sweep(1.0, 300, 6000, .22); add(M, jump_t - 1.0, r, 1)
add(M, x15_t, boom(.9, 1.4))
add(M, end_hit, boom(.8, 1.6)); add(M, end_hit, pad([57 + 12, 60 + 12, 64 + 12], 1.3), 1.4)
for m in (69, 72, 76, 81): add(M, end_hit, bell(m + 12, 1.6), 1.2)

# ---------- SFX ----------
X = np.zeros((N, 2)); cs = lambda s, k: ST[s] + C['s%d' % s][k]
for i in range(1, len(ST)): add(X, ST[i] - .32, noise_sweep(.6, 400, 5000, .4), 1, (-.4, .4)[i % 2])
for k, tt in enumerate((.25, .95, 1.65)): add(X, tt, beep(880), .9)
add(X, 2.35, beep(1760, .35), .9)                                  # "SAKRA!"
for k in range(10): add(X, jump_t + k * .025, boing(), .25, rng.uniform(-.8, .8))   # everyone jumps
add(X, jump_t + 1.0, boom(.7, .9), 1); add(X, jump_t + 1.0, thud(), 1.0)          # landing
for k in range(14): add(X, cs(1, 'ppl') + k * .07, tick(), .3)
add(X, cs(1, 'tons'), pop(), .6)
add(X, ST[2] + .35, thud(), .9); add(X, ST[2] + .45, click(), .6)                   # balance clunks
add(X, x15_t, thud(), .9); add(X, x15_t, click(), .7)
add(X, ST[3] + .1, noise_sweep(2.4, 6000, 300, .25, up=False), 1)                   # diving into the atom
add(X, cs(3, 'atom') + .2, ching(), .4); add(X, cs(3, 'sez'), pop(), .6)
add(X, ST[4] + .3, boing(), .4); add(X, cs(4, 'tag'), pop(), .7); add(X, cs(4, 'tag') + .1, ching(), .4)
add(X, end_hit, click(), 1.0)

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
