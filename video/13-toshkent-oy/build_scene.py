# Assembles scene.html from the shared engine of reel 07 + reel-13-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, 2400], [2600, 2400], [2600, 0], [0, 0]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#140a3a', '#4a1f7a'], ['#2a1408', '#7a3a10'], ['#062a2a', '#106a5a'], ['#2a0812', '#7a1530'], ['#140a3a', '#4a1f7a']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function shake(k, amp) { if (k <= 0 || k > 1.1) return [0, 0, 0]; const e = Math.exp(-k * 4.5); return [Math.sin(k * 80) * amp * e, Math.cos(k * 70) * amp * e, Math.sin(k * 55) * 1.2 * e]; }
function hold(i, u) {
  const d = sDur(i), p = E.io(cl(u / d));
  let [x, y] = A[i];
  let z = -1000 + 150 * p;
  x += Math.sin(u * 0.9 + i * 1.7) * 18; y += Math.cos(u * 0.7 + i * 2.3) * 12;
  let roll = Math.sin(u * 0.8 + i) * 1.1;
  let s = [0, 0, 0];
  if (i === 0) { z = -1000 + 110 * p; y += 170 - 120 * p; roll += -1.5 + 1.5 * p; s = shake(u - cue(0, 'stamp'), 12); }
  if (i === 1) { z = -1150 + 250 * p; s = shake(u - cue(1, 'som'), 14); }
  if (i === 2) { y += 30 + 90 * E.io(seg(u, 0, cue(2, 'sum') + .6)); s = shake(u - cue(2, 'sum'), 12); }
  if (i === 3) { x += -40 + 80 * p; s = shake(u - cue(3, 'gap'), 18); }
  if (i === 4) { z = -1150 + 150 * p; y += 20 + 150 * p; roll += 1 - 2.5 * p; }
  return { x: x + s[0], y: y + s[1], z, roll: roll + s[2] };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
