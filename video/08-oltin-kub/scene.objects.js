// ---------- sprites: gold bar + gold nugget ----------
function barSprite() { const c = document.createElement('canvas'); c.width = 200; c.height = 110; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 200, 110); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.35, '#ffd34d'); gr.addColorStop(1, '#b9780e');
  g.fillStyle = gr; g.beginPath(); g.moveTo(30, 10); g.lineTo(170, 10); g.lineTo(195, 100); g.lineTo(5, 100); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(40, 18, 120, 10); g.fillStyle = '#8a5a0a'; g.font = '900 30px Inter'; g.textAlign = 'center'; g.fillText('999.9', 100, 72); return c; }
function nugSprite() { const c = document.createElement('canvas'); c.width = c.height = 60; const g = c.getContext('2d'); const r = g.createRadialGradient(24, 22, 2, 30, 30, 28);
  r.addColorStop(0, '#fff6c0'); r.addColorStop(.5, '#f2b632'); r.addColorStop(1, 'rgba(185,120,14,0)'); g.fillStyle = r; g.beginPath(); g.arc(30, 30, 28, 0, 7); g.fill(); return c; }
const SPR = { bar: barSprite(), nug: nugSprite() };
const parts = [];
function emit(seed, t0, t1, rate, fn) { const r = rng(seed); for (let t = t0; t < t1; t += 1 / rate) parts.push(fn(r, t + r() / rate)); }
// S0: bars fly in from every side and converge to the centre (gathering all the gold)
emit(41, -0.8, ST[1] + 0.2, 30, (r, t) => { const a = r() * Math.PI * 2, R = 1400 + r() * 800; return { conv: true, t0: t, life: 1.1 + r() * .5, x: A[0][0] + Math.cos(a) * R, y: A[0][1] + 60 + Math.sin(a) * R, z: -200 + r() * 700, tx: A[0][0] + (r() - .5) * 120, ty: A[0][1] + 60 + (r() - .5) * 120, rot: r() * 6, vr: (r() - .5) * 8, sc: .6 + r() * .4, k: 'bar' }; });
// S1: bars fly up out of the Earth (mined)
emit(42, ST[1] + 0.1, ST[2] + 0.2, 16, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 1.6, v = 900 + r() * 700; return { t0: t, life: 1.8, x: A[1][0] + (r() - .5) * 200, y: A[1][1] - 120, z: (r() - .5) * 200, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: -200 - r() * 400, g: 1400, rot: r() * 6, vr: (r() - .5) * 8, sc: .55, k: 'bar' }; });
// S2: bars rain into the cube as it builds
emit(43, ST[2] - 0.2, ST[2] + cue(2, 'cube') + 0.9, 30, (r, t) => ({ conv: true, t0: t, life: .7 + r() * .3, x: A[2][0] + (r() - .5) * 1600, y: A[2][1] - 1500 - r() * 400, z: -300 + r() * 600, tx: A[2][0] + 90 + (r() - .5) * 260, ty: A[2][1] + 170 + (r() - .5) * 200, rot: r() * 6, vr: (r() - .5) * 8, sc: .55, k: 'bar' }));
// S4: the cube shatters into 8 billion tiny shares
emit(44, ST[4] + 0.0, ST[4] + 0.6, 160, (r, t) => { const a = r() * Math.PI * 2, v = 500 + r() * 1600; return { t0: t, life: 2.2, x: A[4][0] + (r() - .5) * 400, y: A[4][1] - 200 + (r() - .5) * 400, z: (r() - .5) * 400, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 500, vz: -200 - r() * 900, g: 2000, rot: 0, vr: 0, sc: .35 + r() * .5, k: 'nug' }; });
function partAt(p, t) {
  const u = t - p.t0; if (u < 0 || u > p.life) return null;
  if (p.conv) { const e = E.io(u / p.life); return { x: lerp(p.x, p.tx, e), y: lerp(p.y, p.ty, e), z: lerp(p.z, 0, e), rot: p.rot + p.vr * u, a: cl(u / .1) * (1 - cl((u - p.life + .12) / .12)) }; }
  return { x: p.x + p.vx * u, y: p.y + p.vy * u + 0.5 * p.g * u * u, z: p.z + p.vz * u, rot: p.rot + p.vr * u, a: cl((p.life - u) / 0.3) * cl(u / 0.05) };
}
const nctx = $('notes').getContext('2d');
function drawNotes(t) {
  nctx.setTransform(1, 0, 0, 1, 0, 0); nctx.clearRect(0, 0, W, H);
  const live = []; for (const p of parts) { const s = partAt(p, t); if (s && s.z > CAM.z + 60) live.push([p, s]); }
  live.sort((a, b) => b[1].z - a[1].z);
  for (const [p, s0] of live) {
    const pr = proj(s0.x, s0.y, s0.z); if (pr.sx < -300 || pr.sx > W + 300 || pr.sy < -300 || pr.sy > H + 300) continue;
    const b = Math.min(12, Math.abs(s0.z - FOCUS) * 0.012); nctx.filter = b > 0.6 ? `blur(${b.toFixed(1)}px)` : 'none';
    const img = SPR[p.k];
    for (let k = 2; k >= 0; k--) { const s = k ? partAt(p, t - k / 200) : s0; if (!s) continue; const q = k ? proj(s.x, s.y, s.z) : pr;
      nctx.globalAlpha = s0.a * (k ? 0.22 : 1); nctx.setTransform(1, 0, 0, 1, q.sx, q.sy); nctx.rotate(s.rot); const sc = q.s * p.sc; nctx.scale(sc, sc); nctx.drawImage(img, -img.width / 2, -img.height / 2); }
  }
  nctx.globalAlpha = 1; nctx.filter = 'none';
}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
function objects(t) {
  const L = i => t - ST[i];
  // S1: Earth + pickaxe + tonnes counter
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    put('earth', x, y - 120, 0, pop(u, -.2) * .95, u * 10, on);
    put('pick', x + 240, y - 330, -80, pop(u, .2), -30 + Math.sin(u * 9) * 25, on);
    put('tons', x, y + 330, -60, pop(u, cue(1, 'count')), 0, on * vis(u, cue(1, 'count')));
    $('tons').textContent = fmt(220000 * E.out(seg(u, cue(1, 'count'), 1.3)));
    put('tonsU', x, y + 500, -60, pop(u, cue(1, 'count') + .3), -3, on * vis(u, cue(1, 'count') + .3)); }
  // S2-S4: the cube (CSS 3D), building for scale, price tag, shatter
  { const u2 = L(2), u3 = L(3), u4 = L(4), [x, y] = A[2];
    const on = t > ST[2] - .6 && t < ST[4] + .05 ? 1 : 0;
    const build = E.back(seg(u2, cue(2, 'cube') - .25, .8)), spin = -25 + t * 22;
    put('glow', x + 90, y + 170, 200, .6 + .6 * build, 0, on * build);
    put('ground', x, y + 365, 0, 1, 0, t > ST[2] - .6 && t < ST[4] + .4 ? 1 : 0);
    put('cubeW', x + 90, y + 170, 0, 0.74 * build, 0, on * cl(build * 3));
    $('cube').style.transform = `rotateX(-16deg) rotateY(${spin}deg)`;
    $('cube').querySelectorAll('.face').forEach(f => f.style.setProperty('--sh', `${(100 - ((t * 40) % 200))}%`));
    const bp = pop(u2, cue(2, 'uy') - .1, .45);
    put('bldg', x - 300, y + 165, 30, bp * .72, 0, on * vis(u2, cue(2, 'uy') - .1));
    put('ppl', x + 60, y + 362, -40, .8, 0, on);
    const rp = E.out(seg(u2, cue(2, 'metr') - .1, .5));
    put('ruler', x + 360, y + 170, -30, .74, 0, on * rp, 1, Math.max(rp, .001));
    put('m22', x + 330, y - 130, -80, pop(u2, cue(2, 'metr')), -4, on * vis(u2, cue(2, 'metr')));
    put('floors', x - 240, y - 150, -80, pop(u2, cue(2, 'uy') + .3), 4, on * vis(u2, cue(2, 'uy') + .3) * (t < ST[3] + .2 ? 1 : 0));
    const pp = seg(u3, cue(3, 'price') - .2, 1.6), swing = Math.sin(u3 * 3) * 5 * Math.exp(-Math.max(0, u3 - cue(3, 'price')) * .8);
    put('ptag', x, y - 330, -150, 0.8 * pop(u3, -.1), swing - 4, on * vis(u3, -.1));
    $('ptagT').textContent = '$' + fmt(25e12 * E.out(pp));
    put('tril', x, y + 470, -200, 2.2 - 1.2 * E.back(seg(u3, cue(3, 'price') + 1.5, .3)), 0, on * cl(seg(u3, cue(3, 'price') + 1.5, .1) * 4)); }
  // S4: 8 billion people, the hand catches 27 g
  { const u = L(4), [x, y] = A[4], on = t > ST[4] - .3 ? 1 : 0;
    put('ppl8', x, y - 330, -60, pop(u, .25), -3, on * vis(u, .25));
    const hp = E.out(seg(u, cue(4, 'gram') - .6, .6));
    put('hand', x, y + 220 + (1 - hp) * 600, -40, 1, 0, on * hp);
    put('gram', x + 10, y - 40 + Math.sin(u * 3) * 8, -100, pop(u, cue(4, 'gram')), -3, on * vis(u, cue(4, 'gram'))); }
}
