// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
// ---------- Veo footage: clip A (today's Chorsu) under S0-S1, clip B (Tashkent 2050) under S4 ----------
const VID = $('vid'), FL = $('flash'), FPSV = 24, NA = window.NA || 240, NB = window.NB || 240;
function vidPick(t) {
  const i = sceneAt(t);
  if (i <= 1) return ['fa', Math.min(NA, 1 + Math.floor(t * FPSV))];
  if (i === 4) return ['fb', Math.min(NB, 1 + Math.floor((t - ST[4]) * FPSV * 1.3))];
  return null;
}
window.vidSet = async (t) => {
  const p = vidPick(t), on = !!p;
  VID.style.display = on ? '' : 'none'; $('vshade').style.display = on ? '' : 'none'; $('far').style.opacity = on ? 0 : 1; $('bg').style.opacity = on ? 0 : 1;
  let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.12); }); FL.style.opacity = Math.max(0, f) * .5;
  if (!on) return;
  const i = sceneAt(t), u = t - ST[i];
  VID.style.transform = `scale(${1.03 + 0.05 * cl(u / sDur(i)) + 0.06 * Math.max(0, 1 - u / 0.25)})`;
  VID.style.filter = i === 1 ? `brightness(${1 - .42 * cl(u / .4)}) saturate(.9)` : 'none';
  const src = `build/${p[0]}/${String(p[1]).padStart(4, '0')}.jpg`;
  if (VID.getAttribute('src') !== src) { VID.setAttribute('src', src); try { await VID.decode(); } catch (e) {} }
};
const fmt1 = v => v.toFixed(1).replace('.', ',');
function objects(t) {
  const L = i => t - ST[i];
  // S1: population counter over today's city
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, n3 = cue(1, 'n3'), y5 = cue(1, 'y2050'), n5 = cue(1, 'n5');
    const k = E.io(seg(u, y5, n5 - y5 + .3));
    $('popk').textContent = u < y5 ? 'HOZIR' : '2050-YIL'; $('popv').textContent = u < y5 ? '3 MLN' : (k < 1 ? fmt1(3 + 2 * k) + ' MLN' : '5 MLN+');
    $('popv').style.color = u < y5 ? '#0a6cff' : '#ff9f1a';
    put('pop', x, y - 190, -30, 1 + .1 * Math.exp(-Math.max(0, u - n5) * 6) * (u > n5 ? 1 : 0), -2, on * vis(u, n3 - .25) );
    put('crowd', x - 60, y + 330 + Math.sin(t * 2) * 6, 0, pop(u, n3 - .1) * (1 + .18 * k), 0, on * vis(u, n3 - .1));
    put('crane', x + 250, y + 360, -40, .85 * pop(u, n5 - .1), 3, on * vis(u, n5 - .1)); }
  // S2: metro km counter, then New Tashkent
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, km = cue(2, 'km'), yt = cue(2, 'yt'), m2 = cue(2, 'mln2');
    const out = E.io(seg(u, yt - .35, .45)), kk = E.out(seg(u, km, 1.1));
    $('kmv').textContent = Math.round(71 + 32 * kk) + ' KM'; $('kmv').style.color = kk >= 1 ? '#16b866' : '#0a6cff';
    put('km', x - 1000 * out, y - 230, -30, .95 * pop(u, .15) * (1 + .1 * Math.exp(-Math.max(0, u - km - 1.1) * 6) * (u > km + 1.1 ? 1 : 0)), -2, on * vis(u, .15) * (1 - out));
    put('metro', x + 60 * Math.sin(u * 1.2) - 1000 * out, y + 260, 0, pop(u, .05), 0, on * vis(u, .05) * (1 - out));
    put('yt', x + 1000 * (1 - E.out(seg(u, yt - .2, .45))), y - 230, -30, .95, 2, on * vis(u, yt - .2));
    put('tower', x - 150, y + 300, 0, pop(u, m2 - .25), -2, on * vis(u, m2 - .25));
    put('drone', x - 700 + 1000 * seg(u, yt, 3), y + 40 + Math.sin(u * 3) * 20, -120, .9, 6, on * vis(u, yt));
    put('ev', x + 250, y + 520, -60, pop(u, m2 + .1), 0, on * vis(u, m2 + .1)); }
  // S3: water and heat
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, x5 = cue(3, 'x5'), ht = cue(3, 'heat');
    put('drop', x - 230, y - 140 + Math.sin(u * 2.4) * 10, 0, pop(u, .1), -4, on * vis(u, .1));
    put('wat', x + 170, y - 170, -40, .9 * (2.2 - 1.2 * E.back(seg(u, x5 - .1, .3))), -4, on * cl(seg(u, x5 - .1, .08)));
    put('thermo', x - 230, y + 420 + Math.sin(u * 2 + 1) * 8, 0, pop(u, ht - .2), 4, on * vis(u, ht - .2));
    put('hot', x + 170, y + 400, -40, .9 * (2.2 - 1.2 * E.back(seg(u, ht, .3))), 3, on * cl(seg(u, ht, .08))); }
}
