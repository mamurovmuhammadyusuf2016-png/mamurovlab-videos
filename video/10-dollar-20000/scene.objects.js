// ---------- banknote sprites + particles ----------
function sprite(kind) {
  const c = document.createElement('canvas'); c.width = 300; c.height = 140; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 300, 140);
  if (kind === 'usd') { grad.addColorStop(0, '#7cf0a8'); grad.addColorStop(.55, '#2fbf71'); grad.addColorStop(1, '#17844a'); }
  else { grad.addColorStop(0, '#e2ecff'); grad.addColorStop(.55, '#b5c9f0'); grad.addColorStop(1, '#8aa4d6'); }
  g.fillStyle = grad; g.beginPath(); g.roundRect(0, 0, 300, 140, 14); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.beginPath(); g.roundRect(10, 10, 280, 120, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(70, 70, 38, 0, 7); g.fill();
  g.fillStyle = kind === 'usd' ? '#0d3b22' : '#1d2f6a'; g.font = '900 46px "Inter Display", Inter'; g.textAlign = 'right';
  g.fillText(kind === 'usd' ? '$ 100' : '1 000', 280, 66); g.font = '800 26px Inter'; g.fillText(kind === 'usd' ? 'DOLLAR' : "SO'M", 280, 108);
  return c;
}
const SPR = { usd: sprite('usd'), som: sprite('som') };
const parts = [];
function emit(seed, t0, t1, rate, fn) { const r = rng(seed); for (let t = t0; t < t1; t += 1 / rate) parts.push(fn(r, t + r() / rate)); }
// S0: so'm notes fly out of the wallet when the board jumps
emit(61, ST[0] + cue(0, 'flip'), ST[1] + .2, 34, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 2.2, v = 900 + r() * 1100; return { t0: t, life: 2.2, x: A[0][0], y: A[0][1] + 250, z: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: -200 - r() * 900, g: 1400, rot: r() * 6, vr: (r() - .5) * 10, fl: 3 + r() * 8, sc: .75, k: 'som' }; });
// S1: notes rain on the 2017 jump
emit(62, ST[1] + cue(1, 'jump'), ST[1] + cue(1, 'jump') + 1.0, 45, (r, t) => { const a = r() * Math.PI * 2, v = 700 + r() * 1300; return { t0: t, life: 2.0, x: A[1][0], y: A[1][1] + 250, z: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 600, vz: -200 - r() * 1000, g: 1700, rot: r() * 6, vr: (r() - .5) * 11, fl: 4 + r() * 8, sc: .85, k: 'som' }; });
// S3: dollars rain on the winners
emit(63, ST[3] + cue(3, 'win1'), ST[4] - .1, 14, (r, t) => ({ t0: t, life: 2.2, x: A[3][0] - 500 + r() * 1000, y: A[3][1] - 1100, z: -200 + r() * 500, vx: (r() - .5) * 200, vy: 500 + r() * 300, vz: 0, g: 700, rot: r() * 6, vr: (r() - .5) * 4, fl: 2 + r() * 4, sc: .7, k: 'usd' }));
function partAt(p, t) { const u = t - p.t0; if (u < 0 || u > p.life) return null; return { x: p.x + p.vx * u, y: p.y + p.vy * u + 0.5 * p.g * u * u, z: p.z + p.vz * u, rot: p.rot + p.vr * u, fl: Math.cos(p.fl * u), a: cl((p.life - u) / 0.3) * cl(u / 0.05) }; }
const nctx = $('notes').getContext('2d');
function drawNotes(t) {
  nctx.setTransform(1, 0, 0, 1, 0, 0); nctx.clearRect(0, 0, W, H);
  const live = []; for (const p of parts) { const s = partAt(p, t); if (s && s.z > CAM.z + 60) live.push([p, s]); }
  live.sort((a, b) => b[1].z - a[1].z);
  for (const [p, s0] of live) {
    const pr = proj(s0.x, s0.y, s0.z); if (pr.sx < -400 || pr.sx > W + 400 || pr.sy < -400 || pr.sy > H + 400) continue;
    const b = Math.min(14, Math.abs(s0.z - FOCUS) * 0.012); nctx.filter = b > 0.6 ? `blur(${b.toFixed(1)}px)` : 'none';
    for (let k = 2; k >= 0; k--) { const s = k ? partAt(p, t - k / 200) : s0; if (!s) continue; const q = k ? proj(s.x, s.y, s.z) : pr;
      nctx.globalAlpha = s0.a * (k ? 0.22 : 1); nctx.setTransform(1, 0, 0, 1, q.sx, q.sy); nctx.rotate(s.rot); const sc = q.s * p.sc * 0.62; nctx.scale(sc, sc * (0.25 + 0.75 * Math.abs(s.fl))); nctx.drawImage(SPR[p.k], -150, -70); }
  }
  nctx.globalAlpha = 1; nctx.filter = 'none';
}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const fmtN = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
function objects(t) {
  const L = i => t - ST[i];
  // S0: board rolls 12 000 -> 20 000, siren, arrow, wallet
  { const u = L(0), [x, y] = A[0], on = t < ST[1] + .4 ? 1 : 0, f = cue(0, 'flip'), p = E.out(seg(u, f, .7));
    put('siren', x, y - 120, 200, 1 + .1 * Math.sin(u * 9), 0, on * cl(seg(u, f, .2)) * (.6 + .4 * Math.sin(u * 12)));
    put('board0', x, y - 120, 0, 1.0 * (1 + .06 * Math.sin(cl((u - f) / .3) * Math.PI)), -2 + Math.sin(u) * 1.5, on);
    $('b0n').textContent = fmtN(12000 + 8000 * p); $('board0').classList.toggle('hot', u > f);
    put('arrow0', x + 360, y - 360, -120, pop(u, f + .2), 0, on * vis(u, f + .2));
    put('wallet', x, y + 250, -40, 1.25 * (1 + .08 * Math.sin(u * 20) * cl(seg(u, f, .2))), Math.sin(u * 14) * 6 * cl(seg(u, f, .2)), on); }
  // S1: 2017 flashback
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, j = cue(1, 'jump');
    put('cal', x, y - 230, 0, .85 * pop(u, cue(1, 'cal') - .3), -4, on * vis(u, cue(1, 'cal') - .3));
    put('board1', x, y + 230, -20, .95, 0, on * vis(u, .2));
    $('b1n').textContent = fmtN(4210 + (8100 - 4210) * E.out(seg(u, j - .05, .45))); $('board1').classList.toggle('hot', u > j);
    put('x2', x, y + 520, -120, 2.2 - 1.2 * E.back(seg(u, j + .25, .3)), 0, on * cl(seg(u, j + .25, .1) * 4)); }
  // S2: price tags jump
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, pp = cue(2, 'price');
    const bump = (t0) => { const k = u - t0; return k > 0 && k < .35 ? 1 + .18 * Math.sin(k / .35 * Math.PI) : 1; };
    put('tPhone', x, y - 120, 0, 1.35 * pop(u, .05) * bump(pp), -2, on * vis(u, .05));
    $('phoneNew').style.opacity = cl(seg(u, pp, .15)); $('phoneNew').style.transform = `scale(${2 - E.back(seg(u, pp, .35))})`;
    [['tDori', -300, 'dori'], ['tCar', 0, 'car'], ['tPart', 300, 'part']].forEach(([id, dx, k], i) => put(id, x + dx, y + 420, -20, .95 * pop(u, cue(2, k)) * bump(cue(2, k) + .3), (i - 1) * 4, on * vis(u, cue(2, k)))); }
  // S3: winners podium
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0;
    put('trophy', x, y - 300, -40, pop(u, .1) * (1 + .05 * Math.sin(u * 6)), Math.sin(u * 3) * 5, on * vis(u, .1));
    put('win1', x - 900 * (1 - E.out(seg(u, cue(3, 'win1'), .5))), y + 20, 0, .92, -2, on * vis(u, cue(3, 'win1')));
    put('win2', x + 900 * (1 - E.out(seg(u, cue(3, 'win2'), .5))), y + 280, 0, .92, 2, on * vis(u, cue(3, 'win2'))); }
  // S4: year slot spins
  { const u = L(4), [x, y] = A[4], on = t > ST[4] - .6 ? 1 : 0;
    put('board4', x, y - 280, -20, .9 * pop(u, .2), -2, on * vis(u, .2));
    put('slot', x, y + 70, 0, .95, 0, on);
    const sp = (u * 17) % 9, yr = String(2027 + Math.floor(sp));   // spins through 2027..2035 only
    [...$('slot').querySelectorAll('.cell b')].forEach((b, k) => { if (k < 2) return;
      b.textContent = u < .2 || u > cue(4, 'hit') ? '?' : yr[k]; b.style.transform = `translateY(${(sp - Math.floor(sp) - .5) * -60}px)`; b.style.filter = 'blur(2px)'; }); }
}
