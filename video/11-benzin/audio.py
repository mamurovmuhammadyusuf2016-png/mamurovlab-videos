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
CH = [(52, [52, 55, 59]), (48, [48, 52, 55]), (55, [55, 59, 62]), (50, [50, 54, 57])]   # Em C G D
ARP = [0, 1, 2, 1, 2, 0, 1, 2]
def section(t):
    s = 0
    for k, v in enumerate(ST):
        if t >= v - 1e-6: s = k
    return s
cs = lambda s, k: ST[s] + C['s%d' % s][k]
down_t = cs(0, 'down'); kim_t = cs(0, 'kim'); now_t = cs(1, 'now'); x3_t = cs(1, 'x3'); hm_t = cs(2, 'hammer'); p73_t = cs(3, 'p73'); end_hit = cs(4, 'hit')
def bell(m, dur=1.4):
    n = int(dur * SR); t = tl(n); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)) * np.exp(-t * 2.2) * .18
def metal(g=1.0):  # pump/barrel clank used as perc
    n = int(.25 * SR); t = tl(n); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((523, 18), (1187, 24), (1731, 30)))
    return (s * .25 + hp(rng.standard_normal(n), .3) * np.exp(-t * 80) * .3) * g
for b in range(int(T / E8) + 1):
    t = b * E8; s = section(t); bar = int(t // BAR); root, tri = CH[bar % 4]; pos = b % 8
    if t > end_hit + .05: break
    intro = t < down_t                       # tension until the "down" button cracks
    flash = s == 1 and t < now_t             # 2017 memory: half-time
    pre = s == 2 and t < cs(2, 'auk')        # explanation: lighter groove
    if not intro:
        if pos % 2 == 0 and (not flash or pos == 0): add(M, t, kick(.95))
        if pos in (2, 6) and not flash: add(M, t, clap(), .5, .1)
        add(M, t + (E8 / 2 if pos % 2 == 0 else 0), hat(pos == 7), .5 if (flash or pre) else .7, -.3)
        if pos in (3, 7) and not flash: add(M, t, metal(.5), 1, .4)
        if not flash: add(M, t, bass(root - 12 + (12 if pos in (3, 7) else 0), E8 * .95), .55 if pre else .9)
    m = tri[ARP[pos] % 3] + (12 if pos in (4, 5) else 0)
    add(M, t, pluck(m + 12, .5), .6 if intro or flash else .8, .35 if pos % 2 else -.35)
    if pos == 0 and s == 4: add(M, t, pad([x + 12 for x in tri], BAR), 1.1)
for tt in (kim_t, x3_t, hm_t, p73_t):
    add(M, tt - 1.0, noise_sweep(1.0, 300, 6000, .2), 1)
    add(M, tt, boom(1.0, 1.4)); add(M, tt, noise_sweep(1.1, 9000, 400, .22, up=False), 1, .2)
add(M, end_hit, boom(.8, 1.6)); add(M, end_hit, pad([52 + 12, 55 + 12, 59 + 12], 1.3), 1.4)
for m in (64, 67, 71, 76): add(M, end_hit, bell(m + 12, 1.6), 1.2)

# ---------- SFX ----------
X = np.zeros((N, 2))
for i in range(1, len(ST)): add(X, ST[i] - .32, noise_sweep(.6, 400, 5000, .45), 1, (-.4, .4)[i % 2])
for k in range(int(down_t / .09)): add(X, .25 + k * .09, tick(), .25, .1)                  # pump digits creeping up
add(X, down_t, click(), 1.0); add(X, down_t + .02, thud(), .7)                            # button cracks
for k in range(int(ST[1] * 6)): add(X, k / 6 + .1, paper(), .18, rng.uniform(-.8, .8))   # burning notes rustle
add(X, cs(1, 'old') - .3, thud(), .7)
for k in range(int((cs(1, 'n13') - now_t + .15) / .05)): add(X, now_t + k * .05, tick(), .4, .2)
add(X, cs(1, 'n13') + .1, ching(), .6); add(X, x3_t, thud(), 1.0); add(X, x3_t + .02, click(), .8)
add(X, cs(2, 'gov'), thud(), .6); add(X, cs(2, 'birja') - .05, noise_sweep(.3, 2000, 8000, .5), 1, -.3); add(X, cs(2, 'birja') + .1, pop(), .7)
add(X, cs(2, 'auk'), thud(), .8); add(X, cs(2, 'auk') + .1, metal(), .8)
add(X, cs(2, 'kam'), pop(), .7, -.4)
for k in range(7): add(X, cs(2, 'kop') - .1 + k * .07, pop(), .35, rng.uniform(-.7, .7))
add(X, hm_t, metal(1.6), 1); add(X, hm_t, thud(), 1.0); add(X, hm_t + .05, ching(), .6)
for k in range(int(.9 * 30)): add(X, hm_t + k / 30, paper(), .3, rng.uniform(-.8, .8))
n = int(4.0 * SR); tt = tl(n); rumble = onepole(rng.standard_normal(n), .02) * (0.6 + .4 * np.sign(np.sin(2 * np.pi * 3.2 * tt))) * np.sin(np.pi * np.linspace(0, 1, n)) ** .7
add(X, cs(3, 'train'), rumble * .9, 1, 0)                                                      # tanker train rolling
for k in range(5): add(X, cs(3, 'train') + .4 + k * .62, metal(.5), 1, -.6 + k * .3)
add(X, cs(3, 'half') - .3, pop(), .6)
for k in range(17): add(X, cs(3, 'price') + k * .05, tick(), .4, .3)
add(X, p73_t, thud(), 1.0); add(X, p73_t + .02, click(), .8)
add(X, cs(4, 'n20') - .6, noise_sweep(1.4, 300, 7000, .3), 1)
for k in range(18): add(X, cs(4, 'n20') + k * .05, tick(), .4, .1)
add(X, cs(4, 'n20') + .9, thud(), .8); add(X, cs(4, 'ha'), pop(), .7, -.4); add(X, cs(4, 'ha') + .12, pop(), .7, .4)
add(X, cs(4, 'kom'), pop(), .7); add(X, end_hit, click(), 1.0)

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
