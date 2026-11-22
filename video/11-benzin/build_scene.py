# Assembles scene.html from the shared engine of reel 07 + reel-11-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, 2400], [2600, 2400], [5200, 2400], [5200, 0]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#2a0a04', '#6a2408'], ['#1a1208', '#4a3416'], ['#0a1440', '#28206a'], ['#08222a', '#16505a'], ['#2a0812', '#6a1530']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function shake(k, amp) { if (k <= 0 || k > 1.1) return [0, 0, 0]; const e = Math.exp(-k * 4.5); return [Math.sin(k * 80) * amp * e, Math.cos(k * 70) * amp * e, Math.sin(k * 55) * 1.2 * e]; }
function hold(i, u) {
  const d = sDur(i), p = E.io(cl(u / d));
  let [x, y] = A[i];
  let z = -1000 + 150 * p;
  x += Math.sin(u * 0.9 + i * 1.7) * 20; y += Math.cos(u * 0.7 + i * 2.3) * 14;
  let roll = Math.sin(u * 0.8 + i) * 1.2;
  let s = [0, 0, 0];
  if (i === 0) { z = -1300 + 380 * p; y += 160 - 200 * p; roll += -3 + 3 * p; s = shake(u - cue(0, 'kim'), 14); }
  if (i === 1) { x += -90 + 180 * E.io(seg(u, cue(1, 'old') - .4, cue(1, 'n13') - cue(1, 'old') + .4)); s = shake(u - cue(1, 'x3'), 16); }
  if (i === 2) { y += -260 + 300 * E.io(seg(u, cue(2, 'auk') - .2, 1.4)); z = -1150 + 180 * p; s = shake(u - cue(2, 'hammer'), 18); }
  if (i === 3) { x += -60 + 120 * p; y += 40 - 80 * p; roll += 2 - 3 * p; s = shake(u - cue(3, 'p73'), 14); }
  if (i === 4) { z = -1150 + 230 * p; s = shake(u - cue(4, 'n20') - .9, 10); }
  return { x: x + s[0], y: y + s[1], z, roll: roll + s[2] };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
