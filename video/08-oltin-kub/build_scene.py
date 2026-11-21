# Assembles scene.html from the shared engine of reel 07 + reel-08-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, 2400], [2600, 2400], [2600, 2300], [5200, 2400]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#120d3a', '#3a1f5a'], ['#0d1a4a', '#2a2a5a'], ['#1a1206', '#4a3410'], ['#2a1a04', '#6a4a10'], ['#120d3a', '#4a2a10']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function hold(i, u) {
  const d = sDur(i);
  let [x, y] = A[i];
  let z = -1000 + 150 * E.io(cl(u / d));
  x += Math.sin(u * 0.9 + i * 1.7) * 22; y += Math.cos(u * 0.7 + i * 2.3) * 14;
  let roll = Math.sin(u * 0.8 + i) * 1.2;
  if (i === 0) { z = -1300 + 420 * E.io(cl(u / d)); }
  if (i === 2) { z = -1250 + 120 * E.io(cl(u / d)); y += 60; }
  if (i === 3) { z = -1080 + 200 * E.io(cl(u / d)); const k = u - cue(3, 'price'); if (k > 0 && k < 1) { const e = Math.exp(-k * 4); x += Math.sin(k * 70) * 12 * e; y += Math.cos(k * 63) * 12 * e; } }
  if (i === 4) { z = -1000 + 120 * E.io(cl(u / d)); }
  return { x, y, z, roll };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
