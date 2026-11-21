# Assembles scene.html from the shared engine of reel 07 + reel-08-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, -40], [2600, 0], [5200, 0], [7800, 0]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#0b0a2e', '#2a1a5a'], ['#0b0a2e', '#3a1a6a'], ['#0a1a3a', '#1f3a6a'], ['#05051a', '#1a1040'], ['#0b0a2e', '#2a2a6a']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function hold(i, u) {
  const d = sDur(i);
  let [x, y] = A[i];
  let z = -1000 + 150 * E.io(cl(u / d));
  x += Math.sin(u * 0.9 + i * 1.7) * 20; y += Math.cos(u * 0.7 + i * 2.3) * 14;
  let roll = Math.sin(u * 0.8 + i) * 1.2;
  if (i === 0) { z = -1250 + 300 * E.io(cl(u / d)); }
  if (i === 1) { z = -950 - 450 * E.io(seg(u, 0, 1.2)); const k = u - 0.05; if (k > 0 && k < .9) { const e = Math.exp(-k * 5); x += Math.sin(k * 80) * 10 * e; y += Math.cos(k * 70) * 10 * e; } }
  if (i === 3) { z = -1000 + 860 * E.io(seg(u, 0.1, sDur(3) - 0.5)); roll += u * 4; }   // dolly deep into the "atom"
  if (i === 4) { z = -1150 + 200 * E.io(cl(u / d)); }
  return { x, y, z, roll };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
