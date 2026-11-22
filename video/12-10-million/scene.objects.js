// ---------- sprites + particles ----------
function sprite(kind) {
  const c = document.createElement('canvas'); c.width = 300; c.height = 140; const g = c.getContext('2d');
  if (kind === 'spark') {
    const r = g.createRadialGradient(150, 70, 0, 150, 70, 70); r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(.35, 'rgba(255,210,63,.9)'); r.addColorStop(1, 'rgba(255,160,0,0)');
    g.fillStyle = r; g.beginPath(); g.arc(150, 70, 70, 0, 7); g.fill(); return c;
  }
  const grad = g.createLinearGradient(0, 0, 300, 140);
  grad.addColorStop(0, '#f3e6ff'); grad.addColorStop(.55, '#d2b8f0'); grad.addColorStop(1, '#a88ad6');
  g.fillStyle = grad; g.beginPath(); g.roundRect(0, 0, 300, 140, 14); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.beginPath(); g.roundRect(10, 10, 280, 120, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(70, 70, 38, 0, 7); g.fill();
  g.fillStyle = '#3a1d6a'; g.font = '900 44px "Inter Display", Inter'; g.textAlign = 'right';
  g.fillText('100 000', 282, 66); g.font = '800 26px Inter'; g.fillText("SO'M", 280, 108);
  return c;
}
const SPR = { som: sprite('som'), spark: sprite('spark') };
const parts = [];
function emit(seed, t0, t1, rate, fn) { const r = rng(seed); for (let t = t0; t < t1; t += 1 / rate) parts.push(fn(r, t + r() / rate)); }
// S0: notes burst out when the stack splits
emit(81, ST[0] + cue(0, 'split'), ST[0] + cue(0, 'split') + .7, 46, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 2.6, v = 900 + r() * 1100; return { t0: t, life: 2.1, x: A[0][0], y: A[0][1] - 60, z: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: -200 - r() * 900, g: 1500, rot: r() * 6, vr: (r() - .5) * 10, fl: 3 + r() * 8, sc: .75, k: 'som' }; });
// S2: gold sparks when the bar lands
emit(82, ST[2] + cue(2, 'coin') + .45, ST[2] + cue(2, 'coin') + .75, 120, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 2.8, v = 700 + r() * 1300; return { t0: t, life: 1.2, x: A[2][0] - 220, y: A[2][1] + 330, z: -50 + r() * 100, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 1800, rot: 0, vr: 0, fl: 0, sc: .12 + r() * .14, k: 'spark', add: 1 }; });
emit(83, ST[2] + cue(2, 'x4'), ST[2] + cue(2, 'x4') + .3, 100, (r, t) => { const a = r() * Math.PI * 2, v = 600 + r() * 1100; return { t0: t, life: 1.1, x: A[2][0] + 200, y: A[2][1] - 330, z: -150, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 900, rot: 0, vr: 0, fl: 0, sc: .12 + r() * .12, k: 'spark', add: 1 }; });
// S5: gold sparkles drifting up through the finale
emit(84, ST[5] - .2, TOTAL + .5, 18, (r, t) => ({ t0: t, life: 2.6, x: A[5][0] - 650 + r() * 1300, y: A[5][1] + 950, z: -300 + r() * 900, vx: (r() - .5) * 120, vy: -520 - r() * 380, vz: 0, g: 0, rot: 0, vr: 0, fl: 0, sc: .12 + r() * .16, k: 'spark', add: 1 }));
function partAt(p, t) { const u = t - p.t0; if (u < 0 || u > p.life) return null; return { x: p.x + p.vx * u, y: p.y + p.vy * u + 0.5 * p.g * u * u, z: p.z + p.vz * u, rot: p.rot + p.vr * u, fl: p.fl ? Math.cos(p.fl * u) : 1, a: cl((p.life - u) / 0.35) * cl(u / 0.05) }; }
const nctx = $('notes').getContext('2d');
function drawNotes(t) {
  nctx.setTransform(1, 0, 0, 1, 0, 0); nctx.clearRect(0, 0, W, H);
  const live = []; for (const p of parts) { const s = partAt(p, t); if (s && s.z > CAM.z + 60) live.push([p, s]); }
  live.sort((a, b) => b[1].z - a[1].z);
  for (const [p, s0] of live) {
    const pr = proj(s0.x, s0.y, s0.z); if (pr.sx < -400 || pr.sx > W + 400 || pr.sy < -400 || pr.sy > H + 400) continue;
    if (p.add) { // soft glow sprite: no DOF filter and no trail copies (cheap to paint)
      nctx.filter = 'none'; nctx.globalCompositeOperation = 'lighter'; nctx.globalAlpha = s0.a; const sc = pr.s * p.sc * 0.62;
      nctx.setTransform(sc, 0, 0, sc, pr.sx, pr.sy); nctx.drawImage(SPR[p.k], -150, -70); continue; }
    const b = Math.min(14, Math.abs(s0.z - FOCUS) * 0.012); nctx.filter = b > 0.6 ? `blur(${b.toFixed(1)}px)` : 'none';
    nctx.globalCompositeOperation = 'source-over';
    const fast = Math.hypot(p.vx, p.vy + p.g * (t - p.t0)) > 1000;
    for (let k = fast ? 2 : 0; k >= 0; k--) { const s = k ? partAt(p, t - k / 200) : s0; if (!s) continue; const q = k ? proj(s.x, s.y, s.z) : pr;
      nctx.globalAlpha = s0.a * (k ? 0.22 : 1); nctx.setTransform(1, 0, 0, 1, q.sx, q.sy); nctx.rotate(s.rot); const sc = q.s * p.sc * 0.62; nctx.scale(sc, sc * (0.25 + 0.75 * Math.abs(s.fl))); nctx.drawImage(SPR[p.k], -150, -70); }
  }
  nctx.globalAlpha = 1; nctx.filter = 'none'; nctx.globalCompositeOperation = 'source-over';
}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const mln = v => v.toFixed(1).replace('.', ',') + ' mln';
const BARH = 780, MAXV = 50;
function setCol(id, v, label) { const h = BARH * v / MAXV; $(id + 'f').style.height = h + 'px'; const el = $(id + 'v'); el.style.bottom = (h + 18) + 'px'; el.textContent = label ?? mln(v); }
// column centre is 500 px below its top; the 10-mln baseline sits at top + 780 - 156
const colY = y => y, baseOf = (cy) => cy - 500 + BARH - BARH * 10 / MAXV;
// S3 stairs: nine steps 2018..2026
const STEPS = []; { const host = $('steps'); for (let k = 0; k < 9; k++) { const d = document.createElement('div'); d.className = 'o step'; d.id = 'st' + k; d.textContent = 2018 + k; host.appendChild(d); STEPS.push(d); } }
$('world').insertBefore($('steps'), $('notes')); [...$('steps').children].forEach(c => $('world').insertBefore(c, $('notes')));
function objects(t) {
  const L = i => t - ST[i];
  // S0: stack -> three choices
  { const u = L(0), [x, y] = A[0], on = t < ST[1] + .4 ? 1 : 0, sp = cue(0, 'split');
    put('stack', x, y - 60, 0, 1.15 * pop(u, .1) * (1 + .03 * Math.sin(u * 5)) * (1 - .35 * E.out(seg(u, sp, .3))), -3 + Math.sin(u * 1.4) * 2, on * vis(u, .1) * (1 - .55 * cl(seg(u, sp, .3))));
    [['pkD', -300, 0], ['pkG', 0, .2], ['pkB', 300, .4]].forEach(([id, dx, d], k) => { const p = E.out(seg(u, sp + d, .45));
      put(id, x + dx * p, y + 60 + 260 * p + Math.sin(u * 3 + k) * 10, -40 * p, .82 * (.5 + .5 * E.back(seg(u, sp + d, .45))), (k - 1) * 6 * p, on * vis(u, sp + d)); }); }
  // S1: dollar — $1 235, column 10 -> 14.8
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    put('icD', x - 225, y - 120, -20, .8 * pop(u, .15), -4 + Math.sin(u * 2) * 3, on * vis(u, .15));
    put('tagD', x - 190, y + 200, -40, .78 * pop(u, cue(1, 'usd') - .15), 3, on * vis(u, cue(1, 'usd') - .15));
    put('cD', x + 230, y + 60, 0, .9, 0, on * vis(u, .3)); put('base1', x, baseOf(y + 60) * .9 + y * .1 - 0, 10, .9, 0, on * vis(u, .3) * .8);
    setCol('cD', 10 + 4.8 * E.io(seg(u, cue(1, 'grow'), cue(1, 'n15') - cue(1, 'grow') + .4))); }
  // S2: gold — 29 g bar drops, column 10 -> 41, x4
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, cn = cue(2, 'coin');
    const fall = seg(u, cn, .45), land = u - cn - .45, sq = land > 0 && land < .3 ? 1 - .12 * Math.sin(land / .3 * Math.PI) : 1;
    put('gbar', x - 220, lerp(y - 1500, y + 250, fall * fall), -20, .8, -8 + 8 * fall, on * vis(u, cn), 1 / sq, sq);
    put('cG', x + 230, y + 60, 0, .9, 0, on * vis(u, .2)); put('base2', x, baseOf(y + 60) * .9 + y * .1, 10, .9, 0, on * vis(u, .2) * .8);
    setCol('cG', 10 + 31 * E.out(seg(u, cue(2, 'grow'), cue(2, 'n41') - cue(2, 'grow') + .5)));
    put('x4', x - 190, y - 230, -100, 2.0 - 1.1 * E.back(seg(u, cue(2, 'x4'), .3)), -8, on * cl(seg(u, cue(2, 'x4'), .08))); }
  // S3: bank — token climbs nine yearly steps, counter compounds
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, s0 = cue(3, 'steps'), dt = (cue(3, 'n45') - s0 - .1) / 9;
    STEPS.forEach((el, k) => { const h = 120 + k * 105; el.style.height = h + 'px'; el.style.width = '104px';
      put(el, x - 370 + k * 100, y + 640 - h / 2, 0, pop(u, .1 + k * .05), 0, on * vis(u, .1 + k * .05)); });
    const kf = cl((u - s0) / dt, 0, 9), k = Math.min(8, Math.floor(kf)), fr = kf - Math.floor(kf), hop = u < s0 ? 0 : (kf >= 9 ? 0 : Math.sin(fr * Math.PI) * 90);
    const tx = x - 370 + (u < s0 ? -100 : k * 100), ty = y + 640 - (u < s0 ? 0 : 120 + k * 105) - 70 - hop;
    put('token', tx, ty, -30, .9, Math.sin(u * 8) * 8, on * vis(u, .3));
    const steps = u < s0 ? 0 : Math.min(9, Math.floor(kf) + 1); const v = u > cue(3, 'n45') ? 45 : 10 * Math.pow(1.18, steps) * (steps >= 9 ? 45 / (10 * Math.pow(1.18, 9)) : 1);
    $('cntN').textContent = (u > cue(3, 'n45') ? '≈45' : v.toFixed(1).replace('.', ','));
    put('cnt', x - 110, y - 300, -40, .78 * pop(u, .2) * (1 + .08 * Math.sin(cl((u - cue(3, 'n45')) / .3) * Math.PI)), -2, on * vis(u, .2)); }
  // S4: prices x2.5 overtake dollar x1.5
  { const u = L(4), [x, y] = A[4], on = t > ST[4] - .6 && t < ST[5] + .4 ? 1 : 0;
    put('cD2', x - 200, y + 60, 0, .9, 0, on * vis(u, .1)); put('cP', x + 200, y + 60, 0, .9, 0, on * vis(u, .1)); put('base4', x, baseOf(y + 60) * .9 + y * .1, 10, .9, 0, on * vis(u, .1) * .8);
    setCol('cD2', 14.8, '14,8 mln'); $('cD2i').textContent = u > cue(4, 'sad') ? '😟' : '💵';
    const pv = 10 + 15 * E.io(seg(u, cue(4, 'prices'), 1.3)); setCol('cP', pv, mln(pv));
    put('lost', x, y - 150, -200, .7 * (2.2 - 1.2 * E.back(seg(u, cue(4, 'lost'), .3))), -9, on * cl(seg(u, cue(4, 'lost'), .08))); }
  // S5: final three columns
  { const u = L(5), [x, y] = A[5], on = t > ST[5] - .6 ? 1 : 0;
    [['f1', -310, 'o1', 14.8], ['f2', 0, 'o2', 41], ['f3', 310, 'o3', 45]].forEach(([id, dx, k, v]) => {
      put(id, x + dx, y + 80, 0, .82 * (1 + .06 * Math.sin(cl((u - cue(5, k)) / .3) * Math.PI)), 0, on * vis(u, .1));
      const p = E.out(seg(u, cue(5, k) - .1, .5)); setCol(id, 10 + (v - 10) * p, u > cue(5, k) - .1 ? (v === 45 ? '~45 mln' : v === 41 ? '41 mln' : mln(v)) : '?'); }); }
}
