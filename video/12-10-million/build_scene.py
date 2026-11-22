# Assembles scene.html from the shared engine of reel 07 + reel-12-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, 2400], [2600, 2400], [5200, 2400], [5200, 0], [2600, -300]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#0d2a1a', '#1d6a3a'], ['#0d2216', '#24583a'], ['#2a1a04', '#7a5410'], ['#081a3a', '#16407a'], ['#2a0812', '#6a1530'], ['#120d3a', '#3a1f6a']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function shake(k, amp) { if (k <= 0 || k > 1.1) return [0, 0, 0]; const e = Math.exp(-k * 4.5); return [Math.sin(k * 80) * amp * e, Math.cos(k * 70) * amp * e, Math.sin(k * 55) * 1.2 * e]; }
function hold(i, u) {
  const d = sDur(i), p = E.io(cl(u / d));
  let [x, y] = A[i];
  let z = -1000 + 150 * p;
  x += Math.sin(u * 0.9 + i * 1.7) * 20; y += Math.cos(u * 0.7 + i * 2.3) * 14;
  let roll = Math.sin(u * 0.8 + i) * 1.2;
  let s = [0, 0, 0];
  if (i === 0) { z = -1300 + 380 * p; y += 120 - 160 * p; s = shake(u - cue(0, 'kim'), 12); }
  if (i === 1) { x += -40 + 80 * p; }
  if (i === 2) { s = shake(u - cue(2, 'coin') - .45, 18); const s2 = shake(u - cue(2, 'x4'), 12); s = [s[0] + s2[0], s[1] + s2[1], s[2] + s2[2]]; }
  if (i === 3) { x += -50 + 100 * p; y += 120 - 240 * p; roll += -2 + 3 * p; s = shake(u - cue(3, 'n45'), 12); }
  if (i === 4) { z = -1100 + 180 * p; s = shake(u - cue(4, 'lost'), 16); }
  if (i === 5) { z = -1150 + 230 * p; }
  return { x: x + s[0], y: y + s[1], z, roll: roll + s[2] };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
