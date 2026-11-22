// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
// ---------- Veo footage layer: clip A (hook), clip B (turn), clip A reversed (loop back to frame 1) ----------
const VID = $('vid'), FL = $('flash'), FPSV = 24, NV = 240;
function vidPick(t) {
  const i = sceneAt(t);
  if (i === 0) return ['fa', Math.min(NV, 1 + Math.floor(t * FPSV))];
  if (i === 3) return ['fb', Math.min(NV, 1 + Math.floor((t - ST[3]) * FPSV))];
  if (i === 4) return ['fa', Math.max(1, Math.min(NV, 1 + Math.round((TOTAL - t) * FPSV * 0.6)))];
  return null;
}
window.vidSet = async (t) => {
  const p = vidPick(t), on = !!p;
  VID.style.display = on ? '' : 'none'; $('vshade').style.display = on ? '' : 'none'; $('far').style.opacity = on ? 0 : 1; $('bg').style.opacity = on ? 0 : 1;
  // flash + punch-in at every cut
  let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.12); }); FL.style.opacity = Math.max(0, f) * .55;
  if (!on) return;
  const i = sceneAt(t), u = t - ST[i];
  VID.style.transform = `scale(${1.04 + 0.05 * cl(u / sDur(i)) + 0.06 * Math.max(0, 1 - u / 0.25)})`;
  VID.style.filter = i === 4 ? 'brightness(.62) saturate(.9)' : 'none';
  const src = `build/${p[0]}/${String(p[1]).padStart(4, '0')}.jpg`;
  if (VID.getAttribute('src') !== src) { VID.setAttribute('src', src); try { await VID.decode(); } catch (e) {} }
};
function objects(t) {
  const L = i => t - ST[i];
  // S1: three reasons the robot wins
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    [['st1', 'c1', -330], ['st2', 'c2', -40], ['st3', 'c3', 250]].forEach(([id, k, dy], i) => { const k0 = cue(1, k) - .1, p = E.out(seg(u, k0, .45));
      put(id, x + 900 * (1 - p) * (i % 2 ? 1 : -1), y + dy, -20, .9 * (.6 + .4 * E.back(seg(u, k0, .45))), (i % 2 ? 2 : -2), on * vis(u, k0)); }); }
  // S2: jobs struck out + WEF
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0;
    [['j1', 'k1', -340], ['j2', 'k2', -150], ['j3', 'k3', 40]].forEach(([id, k, dy], i) => { const k0 = cue(2, k) - .1, p = E.out(seg(u, k0, .4));
      put(id, x + (i % 2 ? 20 : -20) + 900 * (1 - p), y + dy, -20, .85 * (.6 + .4 * E.back(seg(u, k0, .4))), (i % 2 ? 2 : -2), on * vis(u, k0));
      $(id).querySelector('.x').style.transform = `scaleX(${E.out(seg(u, k0 + .45, .25))})`; });
    put('wef', x, y + 420, -80, 1.7 - 0.85 * E.back(seg(u, cue(2, 'wef'), .3)), -3, on * cl(seg(u, cue(2, 'wef'), .08))); }
}
