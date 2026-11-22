# Assembles scene.html from the shared engine of reel 07 + reel-17-specific objects.
import re, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', '07-hech-kim-olmasa', 'scene.html')).read()
head = src[:src.index('/* hourglass */')]
engine = src[src.index('<script>\nconst C = window.CUES'):src.index('// ---------- sprites: sand grain')]
tail = src[src.index("const far = $('far')"):src.index('// ---------- city buildings')]
render = src[src.index('window.render = (t) => {'):]

engine = re.sub(r"const A = \[.*?\];", "const A = [[0, 0], [0, 2600], [2700, 2600], [2700, 0], [0, 0]];", engine)
engine = re.sub(r"const SCENE_BG = \[.*?\];", "const SCENE_BG = [['#06101e', '#123a5a'], ['#06101e', '#123a5a'], ['#1a0610', '#5a1228'], ['#06101e', '#123a5a'], ['#06101e', '#123a5a']];", engine)
engine = re.sub(r"function hold\(i, u\) \{.*?\n  return \{ x, y, z, roll \};\n\}", '''function shake(k, amp) { if (k <= 0 || k > 1.1) return [0, 0, 0]; const e = Math.exp(-k * 4.5); return [Math.sin(k * 80) * amp * e, Math.cos(k * 70) * amp * e, Math.sin(k * 55) * 1.2 * e]; }
function hold(i, u) {
  const d = sDur(i), p = E.io(cl(u / d));
  let [x, y] = A[i];
  let z = -1000 + 150 * p;
  x += Math.sin(u * 0.9 + i * 1.7) * 18; y += Math.cos(u * 0.7 + i * 2.3) * 12;
  let roll = Math.sin(u * 0.8 + i) * 1.1;
  let s = [0, 0, 0];
  if (i === 1) { z = -1150 + 250 * p; s = shake(u - cue(1, 'c3'), 10); }
  if (i === 2) { y += -60 + 120 * p; s = shake(u - cue(2, 'wef'), 14); }
  return { x: x + s[0], y: y + s[1], z, roll: roll + s[2] };
}''', engine, flags=re.S)

css = open(os.path.join(here, 'scene.css')).read()
body = open(os.path.join(here, 'scene.body.html')).read()
objs = open(os.path.join(here, 'scene.objects.js')).read()
out = head + css + '\n</style></head>\n<body>\n' + body + '\n' + engine + objs + '\n' + tail + '\n' + render
out = out.replace('</body>', '<script>const __r = window.render; window.render = async (t, s, tot) => { __r(t, s, tot); await window.vidSet(t); };</script>\n</body>')
open(os.path.join(here, 'scene.html'), 'w').write(out)
print('scene.html', len(out))
