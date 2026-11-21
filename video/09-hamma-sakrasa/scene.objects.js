// ---------- Earth builder ----------
function buildEarth(id) {
  const e = $(id);
  [[60, 120, 220, 170], [330, 80, 200, 150], [380, 420, 190, 160], [90, 430, 160, 120], [250, 520, 160, 80]].forEach(([l, t, w, h]) => { const d = document.createElement('div'); d.className = 'land'; Object.assign(d.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); e.append(d); });
  [[120, 60, 140, 40], [380, 300, 160, 46], [60, 360, 120, 36]].forEach(([l, t, w, h]) => { const d = document.createElement('div'); d.className = 'cloud'; Object.assign(d.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); e.append(d); });
  e.insertAdjacentHTML('beforeend', '<div class="brow" style="left:170px"></div><div class="brow" style="right:170px"></div><div class="eye" style="left:180px"><i></i></div><div class="eye" style="right:180px"><i></i></div><div class="mouth"></div>');
  return e;
}
['e0', 'e2', 'e4'].forEach(buildEarth);
// expression: fear 0..1 (open round mouth, raised brows) vs smile (wide flat mouth)
function face(id, fear, smile, look) {
  const e = $(id), m = e.querySelector('.mouth');
  const h = 30 + 90 * fear, w = 120 + 120 * smile;
  m.style.height = (smile > 0 ? 70 : h) + 'px'; m.style.width = w + 'px'; m.style.marginLeft = (-w / 2) + 'px';
  m.style.borderRadius = smile > 0 ? '0 0 140px 140px' : '50%';
  e.querySelectorAll('.brow').forEach((b, k) => { b.style.transform = `translateY(${-30 * fear}px) rotate(${(k ? 1 : -1) * (12 * fear - 8 * smile)}deg)`; });
  e.querySelectorAll('.eye i').forEach((p) => { p.style.transform = `translate(${look[0]}px, ${look[1]}px) scale(${1 - .25 * fear})`; });
}

// ---------- sprites ----------
function emojiSprite(e) { const c = document.createElement('canvas'); c.width = c.height = 140; const g = c.getContext('2d'); g.font = '110px "Noto Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 70, 76); return c; }
const PEOPLE = ['🧍', '🧍‍♀️', '🧍‍♂️', '🙋', '🙋‍♀️', '🙆', '🙆‍♀️', '🧒', '👧', '🧓'].map(emojiSprite);
const JUMP = ['🙌', '🤸', '🤸‍♀️', '🙋', '🙆‍♂️'].map(emojiSprite);
// the crowd stands on the Earth: angle along the rim, jumps radially
function crowd(seed, n, spread) { const r = rng(seed), out = []; for (let k = 0; k < n; k++) out.push({ a: -Math.PI / 2 + (r() - .5) * spread, d: r() * .25, s: .5 + r() * .35, k: Math.floor(r() * 10), j: Math.floor(r() * 5) }); return out; }
const C0 = crowd(51, 46, 2.9), C4 = crowd(52, 46, 2.9);
const nctx = $('notes').getContext('2d');
function drawCrowd(people, cx, cy, R, scaleE, jumpAt, t, landed) {
  for (const p of people) {
    let lift = 0, sprite = PEOPLE[p.k];
    const u = t - jumpAt - p.d * .25;
    if (jumpAt !== null && u > 0 && u < 1.0) { lift = Math.sin(u / 1.0 * Math.PI) * 260; sprite = JUMP[p.j]; }
    if (landed) lift = Math.abs(Math.sin(t * 5 + p.a * 7)) * 18;
    const rr = R * scaleE + 70 * p.s + lift;
    const wx = cx + Math.cos(p.a) * rr, wy = cy + Math.sin(p.a) * rr;
    const q = proj(wx, wy, -20); if (q.sx < -200 || q.sx > W + 200 || q.sy < -200 || q.sy > H + 200) continue;
    nctx.setTransform(1, 0, 0, 1, q.sx, q.sy); nctx.rotate(p.a + Math.PI / 2); const sc = q.s * p.s * 1.45; nctx.scale(sc, sc);
    nctx.drawImage(sprite, -70, -110);
  }
  nctx.setTransform(1, 0, 0, 1, 0, 0);
}
function drawNotes(t) {
  nctx.setTransform(1, 0, 0, 1, 0, 0); nctx.clearRect(0, 0, W, H);
  if (t < ST[2] + .3) drawCrowd(C0, A[0][0], A[0][1] + 520, 320, 1, ST[1], t, false);
  if (t > ST[4] - .4) drawCrowd(C4, A[4][0], A[4][1] + 400, 320, 1, null, t, true);
}

const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
function objects(t) {
  const L = i => t - ST[i];
  // S0-S1: Earth, countdown, jump, counters
  { const u0 = L(0), u1 = L(1), on = t < ST[2] + .3 ? 1 : 0;
    const scared = cl(seg(u0, .3, .6) * .5 + seg(u1, -.1, .2) * .5) * (1 - seg(u1, 1.4, .6) * .6);
    const jolt = u1 > 0 && u1 < 1.2 ? Math.sin(u1 * 40) * 6 * (1 - u1 / 1.2) : 0;
    put('e0', A[0][0] + jolt, A[0][1] + 520, 0, 1, Math.sin(t * .6) * 2, on);
    face('e0', scared, 0, [0, -18 * scared]);
    const cds = [['cd3', .25], ['cd2', .95], ['cd1', 1.65]];
    cds.forEach(([id, t0]) => { const k = u0 - t0; put(id, A[0][0], A[0][1] - 40, -150, k > 0 && k < .7 ? 1.4 - .4 * E.out(cl(k / .25)) : 1, 0, k > 0 && k < .7 ? cl((.7 - k) * 5) * cl(k * 8) : 0); });
    put('go', A[0][0], A[0][1] - 80, -150, 2 - E.back(seg(u0, 2.35, .3)), -4, u0 > 2.35 && u1 < .5 ? 1 : 0);
    put('ppl', A[0][0], A[0][1] - 330, -80, pop(u1, cue(1, 'ppl')), 0, on * vis(u1, cue(1, 'ppl')));
    $('ppl').textContent = fmt(8.2e9 * E.out(seg(u1, cue(1, 'ppl'), 1.0)));
    put('pplU', A[0][0], A[0][1] - 190, -80, pop(u1, cue(1, 'ppl') + .25), -3, on * vis(u1, cue(1, 'ppl') + .25));
    put('tons', A[0][0], A[0][1] - 60, -100, pop(u1, cue(1, 'tons')), 3, on * vis(u1, cue(1, 'tons'))); }
  // S2: balance — tiny crowd vs the whole Earth
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0;
    const tilt = 18 * E.back(seg(u, .2, .9)) + Math.sin(u * 3) * .6, r = tilt * Math.PI / 180;
    const px = x, py = y - 120, Lh = 310;
    put('foot', x, y + 380, 0, .8, 0, on); put('post', x, y + 140, 5, .85, 0, on); put('beam', px, py, 0, .7, tilt, on);
    const ends = [[-1, 'L'], [1, 'R']];
    ends.forEach(([sgn, k]) => { const ex = px + sgn * Lh * Math.cos(r), ey = py + sgn * Lh * Math.sin(r);
      put('ch' + k + '1', ex - 85, ey + 110, 5, .72, 14, on); put('ch' + k + '2', ex + 85, ey + 110, 5, .72, -14, on); put('pan' + k, ex, ey + 220, 0, .72, 0, on);
      if (k === 'L') put('crowd2', ex, ey + 180, -10, 1.3, 0, on); else put('e2', ex, ey + 40, -10, 0.36, 0, on); });
    face('e2', 0, .6, [0, 6]);
    put('x15', x, y + 560, -150, 2.2 - 1.2 * E.back(seg(u, cue(2, 'x15'), .3)), 0, on * cl(seg(u, cue(2, 'x15'), .1) * 4)); }
  // S3: dive into an atom; Earth's shift is a tiny glowing dot next to the nucleus
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0;
    put('atom', x, y, 0, 1, u * 20, on);
    [0, 1, 2].forEach((k) => { const a = u * 3 + k * 2.1, ang = k * 60 * Math.PI / 180, ex = Math.cos(a) * 350, ey = Math.sin(a) * 150; $('el' + k).style.left = (380 - 18 + ex * Math.cos(ang) - ey * Math.sin(ang)) + 'px'; $('el' + k).style.top = (380 - 18 + ex * Math.sin(ang) + ey * Math.cos(ang)) + 'px'; });
    put('shift', x + 18, y + 2, -5, 1, 0, on * vis(u, cue(3, 'atom')));
    put('shiftL', x + 62, y + 2, -6, .25 * pop(u, cue(3, 'atom') + .2), 0, on * vis(u, cue(3, 'atom') + .2));
    const zexp = Math.round(cl(u / (cue(3, 'atom') + .2)) * 10);
    $('zoomT').textContent = '×' + fmt(Math.pow(10, zexp));
    const zs = F / (-5 - CAM.z);  // keep the zoom badge fixed on screen while the camera dives
    put('zoom', CAM.x, CAM.y + (1260 - 960) / zs, -5, 0.9 / zs, 0, (t < ST[4] - .15 ? 1 : 0) * vis(u, .1) * (1 - seg(u, cue(3, 'sez') - .2, .2))); }
  // S4: everyone landed, Earth relieved and smiling
  { const u = L(4), on = t > ST[4] - .6 ? 1 : 0;
    put('e4', A[4][0], A[4][1] + 400, 0, 1, Math.sin(t * .8) * 3, on);
    face('e4', 0, E.out(seg(u, .2, .6)), [Math.sin(u * 2) * 8, 0]); }
}
