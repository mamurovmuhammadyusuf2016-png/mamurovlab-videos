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
// S0 + S4: purple so'm notes drift up around the receipt
emit(91, -1.5, ST[1] + .3, 6, (r, t) => ({ t0: t, life: 3.4, x: A[0][0] - 700 + r() * 1400, y: A[0][1] + 1100, z: -150 + r() * 700, vx: (r() - .5) * 160, vy: -480 - r() * 240, vz: 0, g: 0, rot: r() * 6, vr: (r() - .5) * 2.5, fl: 1.5 + r() * 3, sc: .7, k: 'som' }));
emit(92, ST[4] - .2, TOTAL + .5, 6, (r, t) => ({ t0: t, life: 3.4, x: A[4][0] - 700 + r() * 1400, y: A[4][1] + 1100, z: -150 + r() * 700, vx: (r() - .5) * 160, vy: -480 - r() * 240, vz: 0, g: 0, rot: r() * 6, vr: (r() - .5) * 2.5, fl: 1.5 + r() * 3, sc: .7, k: 'som' }));
// S1: notes puff out when $500 turns into 6 000 000
emit(93, ST[1] + cue(1, 'som'), ST[1] + cue(1, 'som') + .45, 40, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 2.6, v = 800 + r() * 1000; return { t0: t, life: 1.9, x: A[1][0] + 110, y: A[1][1] + 400, z: -120, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: -100 - r() * 700, g: 1500, rot: r() * 6, vr: (r() - .5) * 10, fl: 3 + r() * 8, sc: .65, k: 'som' }; });
// S3: money drains away when the salary falls short
emit(94, ST[3] + cue(3, 'gap'), ST[4] + .2, 22, (r, t) => ({ t0: t, life: 2.0, x: A[3][0] - 550 + r() * 1100, y: A[3][1] - 1050, z: -200 + r() * 600, vx: (r() - .5) * 140, vy: 600 + r() * 300, vz: 0, g: 900, rot: r() * 6, vr: (r() - .5) * 5, fl: 2 + r() * 5, sc: .65, k: 'som' }));
// S2: gold sparks on the subtotal
emit(95, ST[2] + cue(2, 'sum'), ST[2] + cue(2, 'sum') + .3, 90, (r, t) => { const a = r() * Math.PI * 2, v = 500 + r() * 1000; return { t0: t, life: 1.0, x: A[2][0], y: A[2][1] + 610, z: -80, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 900, rot: 0, vr: 0, fl: 0, sc: .1 + r() * .12, k: 'spark', add: 1 }; });
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
const fmtN = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// Tashkent skyline silhouette (TV tower + blocks), drawn once
{ const c = $('city'), g = c.getContext('2d'), r = rng(7); const grd = g.createLinearGradient(0, 0, 0, 600); grd.addColorStop(0, 'rgba(20,10,60,0)'); grd.addColorStop(1, 'rgba(20,10,60,.95)');
  for (let x = 0; x < 1700;) { const w = 60 + r() * 120, h = 140 + r() * 300; g.fillStyle = '#1a0f46'; g.fillRect(x, 600 - h, w - 8, h);
    g.fillStyle = 'rgba(255,190,90,.75)'; for (let wy = 600 - h + 18; wy < 590; wy += 30) for (let wx = x + 10; wx < x + w - 20; wx += 22) if (r() < .45) g.fillRect(wx, wy, 9, 13); x += w; }
  g.fillStyle = '#1a0f46'; g.fillRect(1180, 40, 14, 560); g.beginPath(); g.ellipse(1187, 250, 46, 26, 0, 0, 7); g.fill(); g.fillRect(1160, 300, 54, 18);
  g.fillStyle = '#ff5f6e'; g.beginPath(); g.arc(1187, 40, 7, 0, 7); g.fill(); }
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: receipt, stamp, official mini-receipt
  { const inS0 = t < ST[1] + .4, inS4 = t > ST[4] - .6, on = inS0 || inS4 ? 1 : 0, [x, y] = A[0], u = inS4 ? L(4) + 8 : L(0);
    put('city', x, y + 760, 900, 1, 0, on * .9);
    put('glow0', x, y + 60, 400, 1 + .08 * Math.sin(u * 3), 0, on * (.7 + .3 * Math.sin(u * 5)));
    put('rcpt', x + 10, y + 60 + Math.sin(u * 1.3) * 10, 0, 1.05, -3 + Math.sin(u * .9) * 1.2, on);
    const sb = inS0 ? E.back(seg(L(0), cue(0, 'stamp') - .05, .3)) : 1, bump = inS0 && L(0) > cue(0, 'stamp') - .05 && L(0) < cue(0, 'stamp') + .3 ? 1.15 - .15 * sb : 1;
    put('stamp0', x + 40, y + 330, -110, .95 * bump, -8, on);
    const mi = inS0 ? E.out(seg(L(0), cue(0, 'small') - .15, .5)) : 0;
    put('mini', x - 250 - 700 * (1 - mi), y + 600, -60, .85, 6, inS0 ? vis(L(0), cue(0, 'small') - .15) : 0); }
  // S1: door + key tag $500 -> 6 000 000
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, sm = cue(1, 'som');
    put('door', x - 90, y + 60, 0, .95, 0, on);
    const sw = Math.sin(u * 3.2) * 6 * Math.exp(-Math.max(0, u - cue(1, 'tag')) * .6);
    put('ktag', x + 110, y + 400, -120, .85 * pop(u, cue(1, 'tag') - .1) * (u > sm && u < sm + .3 ? 1 + .15 * Math.sin((u - sm) / .3 * Math.PI) : 1), 4 + sw, on * vis(u, cue(1, 'tag') - .1));
    $('ktagA').textContent = u > sm ? "6 000 000" : '$500'; $('ktagB').textContent = u > sm ? "so'm · oyiga" : 'oyiga · median'; }
  // S2: four items + subtotal
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0;
    [['it1', -170, 'i1'], ['it2', 20, 'i2'], ['it3', 210, 'i3'], ['it4', 400, 'i4']].forEach(([id, dy, k], i) => { const p = E.out(seg(u, cue(2, k) - .1, .4));
      put(id, x + (i % 2 ? 20 : -20) + 900 * (1 - p), y + dy, -20, .9 * (.6 + .4 * E.back(seg(u, cue(2, k) - .1, .4))), (i % 2 ? 2 : -2), on * vis(u, cue(2, k) - .1)); });
    put('sum2', x, y + 610, -80, 2.2 - 1.3 * E.back(seg(u, cue(2, 'sum'), .3)), -4, on * cl(seg(u, cue(2, 'sum'), .08))); }
  // S3: salary after tax vs costs, deficit
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, tx = cue(3, 'tax'), nt = cue(3, 'net');
    put('colS', x - 220, y - 40, 0, .9 * pop(u, .05), -2, on * vis(u, .05));
    put('colX', x + 220, y - 40, 0, .9 * pop(u, .3), 2, on * vis(u, .3));
    $('salTax').style.opacity = cl(seg(u, tx, .15)); $('salTax').style.transform = `scale(${2 - E.back(seg(u, tx, .35))})`;
    $('salOld').style.display = u > nt ? '' : 'none';
    $('salV').textContent = fmtN(Math.round((12300000 - 1500000 * E.out(seg(u, nt, .7))) / 1000) * 1000);
    put('gap', x, y + 430, -100, 2.2 - 1.3 * E.back(seg(u, cue(3, 'gap'), .3)), -3, on * cl(seg(u, cue(3, 'gap'), .08))); }
}
