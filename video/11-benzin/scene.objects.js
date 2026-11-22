// ---------- sprites + particles ----------
function sprite(kind) {
  const c = document.createElement('canvas'); c.width = 300; c.height = 140; const g = c.getContext('2d');
  if (kind === 'ember') {
    const r = g.createRadialGradient(150, 70, 0, 150, 70, 70); r.addColorStop(0, 'rgba(255,240,180,1)'); r.addColorStop(.35, 'rgba(255,140,40,.9)'); r.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = r; g.beginPath(); g.arc(150, 70, 70, 0, 7); g.fill(); return c;
  }
  const grad = g.createLinearGradient(0, 0, 300, 140);
  grad.addColorStop(0, '#f3e6ff'); grad.addColorStop(.55, '#d2b8f0'); grad.addColorStop(1, '#a88ad6');
  g.fillStyle = grad; g.beginPath(); g.roundRect(0, 0, 300, 140, 14); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.beginPath(); g.roundRect(10, 10, 280, 120, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(70, 70, 38, 0, 7); g.fill();
  g.fillStyle = '#3a1d6a'; g.font = '900 44px "Inter Display", Inter'; g.textAlign = 'right';
  g.fillText('100 000', 282, 66); g.font = '800 26px Inter'; g.fillText("SO'M", 280, 108);
  if (kind === 'burn') { // charred, glowing edge
    const e = g.createLinearGradient(0, 140, 0, 60); e.addColorStop(0, 'rgba(30,8,0,.95)'); e.addColorStop(.45, 'rgba(255,110,20,.85)'); e.addColorStop(1, 'rgba(255,110,20,0)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = e; g.fillRect(0, 0, 300, 140);
  }
  return c;
}
const SPR = { som: sprite('som'), burn: sprite('burn'), ember: sprite('ember') };
const parts = [];
function emit(seed, t0, t1, rate, fn) { const r = rng(seed); for (let t = t0; t < t1; t += 1 / rate) parts.push(fn(r, t + r() / rate)); }
// S0: burning so'm notes and embers rise around the pump
emit(71, -1.5, ST[1] + .3, 7, (r, t) => ({ t0: t, life: 3.2, x: A[0][0] - 700 + r() * 1400, y: A[0][1] + 1100, z: -150 + r() * 700, vx: (r() - .5) * 160, vy: -520 - r() * 260, vz: 0, g: 0, rot: r() * 6, vr: (r() - .5) * 2.5, fl: 1.5 + r() * 3, sc: .75, k: r() < .7 ? 'burn' : 'som' }));
emit(72, -1.5, ST[1] + .3, 26, (r, t) => ({ t0: t, life: 2.4, x: A[0][0] - 650 + r() * 1300, y: A[0][1] + 900, z: -300 + r() * 900, vx: (r() - .5) * 120, vy: -620 - r() * 420, vz: 0, g: 0, rot: 0, vr: 0, fl: 0, sc: .16 + r() * .2, k: 'ember', add: 1 }));
// S2: notes burst from the barrel on the hammer
emit(73, ST[2] + cue(2, 'hammer'), ST[2] + cue(2, 'hammer') + .6, 50, (r, t) => { const a = -Math.PI / 2 + (r() - .5) * 2.4, v = 900 + r() * 1100; return { t0: t, life: 2.0, x: A[2][0], y: A[2][1] + 40, z: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: -200 - r() * 800, g: 1500, rot: r() * 6, vr: (r() - .5) * 10, fl: 3 + r() * 8, sc: .7, k: 'som' }; });
// S4: embers again around the 20 000 board
emit(74, ST[4] - .2, TOTAL + .5, 16, (r, t) => ({ t0: t, life: 2.4, x: A[4][0] - 650 + r() * 1300, y: A[4][1] + 900, z: -300 + r() * 900, vx: (r() - .5) * 120, vy: -560 - r() * 380, vz: 0, g: 0, rot: 0, vr: 0, fl: 0, sc: .16 + r() * .2, k: 'ember', add: 1 }));
function partAt(p, t) { const u = t - p.t0; if (u < 0 || u > p.life) return null; return { x: p.x + p.vx * u + (p.k === 'ember' ? Math.sin(u * 5 + p.x) * 30 : 0), y: p.y + p.vy * u + 0.5 * p.g * u * u, z: p.z + p.vz * u, rot: p.rot + p.vr * u, fl: p.fl ? Math.cos(p.fl * u) : 1, a: cl((p.life - u) / 0.4) * cl(u / 0.15) }; }
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
$('auPrice').innerHTML = '<span id="auN">12,4</span><span style="font-size:46px;letter-spacing:0"> mln so\'m/t</span>';
const HANDS = [[-380, 700, -150, 0], [360, 740, -100, .08], [-170, 800, -260, .16], [190, 820, -220, .22], [-520, 820, -40, .3], [520, 840, -60, .36], [0, 880, -320, .44]];
function objects(t) {
  const L = i => t - ST[i];
  // S0: pump display creeps up, the "down" button cracks
  { const u = L(0), [x, y] = A[0], on = t < ST[1] + .4 ? 1 : 0, dn = cue(0, 'down');
    put('glow0', x, y + 40, 300, 1 + .08 * Math.sin(u * 7), 0, on * (.7 + .3 * Math.sin(u * 11)));
    put('pump', x, y + 60, 0, 1, -2 + Math.sin(u * 1.3), on);
    $('p0n').textContent = fmtN(Math.floor((12600 + 400 * E.out(seg(u, .2, dn - .2))) / 10) * 10);
    $('crack').setAttribute('stroke-dashoffset', 320 * (1 - E.out(seg(u, dn, .25))));
    $('btn').style.transform = (u > dn && u < dn + .5) ? `translateX(${Math.sin((u - dn) * 90) * 10 * (1 - (u - dn) / .5)}px)` : ''; }
  // S1: 2017 board vs now board, x3 stamp
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    put('b17', x - 235, y + 40, 0, .9 * pop(u, cue(1, 'old') - .35), -3, on * vis(u, cue(1, 'old') - .35));
    put('b26', x + 235, y + 40, 0, .9 * pop(u, cue(1, 'now') - .35) * (1 + .07 * Math.sin(cl((u - cue(1, 'n13')) / .3) * Math.PI)), 3, on * vis(u, cue(1, 'now') - .35));
    $('b26n').textContent = fmtN(Math.round((4300 + 8700 * E.out(seg(u, cue(1, 'now'), cue(1, 'n13') - cue(1, 'now') + .15))) / 100) * 100);
    put('x3', x + 200, y + 440, -160, 2.3 - 1.3 * E.back(seg(u, cue(1, 'x3'), .3)), -8, on * cl(seg(u, cue(1, 'x3'), .08) * 1)); }
  // S2: HUKUMAT crossed out -> BIRJA, auction barrel, hands, hammer
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, bj = cue(2, 'birja'), au = cue(2, 'auk'), hm = cue(2, 'hammer');
    const wOut = 1 - cl(seg(u, au - .15, .35));
    put('wGov', x, y - 600, 0, pop(u, cue(2, 'gov')), -2, on * vis(u, cue(2, 'gov')) * (u > bj ? .45 : 1) * wOut);
    put('strike', x, y - 600, -20, 1, -4, on * vis(u, bj) * wOut, E.out(seg(u, bj, .22)), 1);
    put('wBirja', x, y - 420, -40, 1.15 * pop(u, bj + .1), 3, on * vis(u, bj + .1) * wOut);
    put('auPrice', x, y - 190, -20, .95 * pop(u, au + .1) * (1 + .1 * Math.sin(cl((u - hm) / .3) * Math.PI)), 0, on * vis(u, au + .1));
    $('auN').textContent = (12.4 + 1.5 * E.out(seg(u, hm, .5))).toFixed(1).replace('.', ',');
    $('auPrice').style.boxShadow = u > hm ? '0 0 0 8px #ff3b4e, 0 0 80px rgba(255,59,78,.8)' : '';
    put('barrel', x, y + 200, 0, pop(u, au) * (u > hm && u < hm + .25 ? 1 - .06 * Math.sin((u - hm) / .25 * Math.PI) : 1), 0, on * vis(u, au));
    put('tKam', x - 215, y + 560, -60, .85 * pop(u, cue(2, 'kam')), -6, on * vis(u, cue(2, 'kam')));
    put('tKop', x + 205, y + 650, -60, .85 * pop(u, cue(2, 'kop')), 5, on * vis(u, cue(2, 'kop')));
    HANDS.forEach(([dx, dy, z, d], k) => { const k0 = cue(2, 'kop') - .1 + d, r = E.back(seg(u, k0, .4));
      put('h' + k, x + dx, y + dy + 420 * (1 - r) + Math.sin(u * 7 + k) * 14, z, .9 + .15 * (k % 3), Math.sin(u * 6 + k * 2) * 10, on * vis(u, k0)); });
    const sw = u < hm ? -55 + 10 * Math.sin(u * 4) : 12 - 20 * Math.exp(-(u - hm) * 9) * Math.cos((u - hm) * 30);
    put('hammer', x + 280, y + 120, -120, 1, u < hm - .14 ? sw : lerp(-55, 12, E.io(seg(u, hm - .14, .14))), on * vis(u, au + .8)); }
  // S3: tanker train from Russia, import tank half full, +73%
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, tr = cue(3, 'train');
    put('cRu', x - 250, y - 390, 0, .62 * pop(u, .1), -3, on * vis(u, .1));
    put('cUz', x + 200, y - 390, 0, .62 * pop(u, .35), 3, on * vis(u, .35));
    put('rail', x, y - 70, 40, 1, 0, on);
    const tx = lerp(-1500, 1500, seg(u, tr, 3.4)); put('train', x + tx, y - 180, 0, .95, 0, on);
    put('tank', x - 235, y + 380, -30, .95 * pop(u, cue(3, 'half') - .3), -2, on * vis(u, cue(3, 'half') - .3));
    $('tankFill').style.height = (50 * E.out(seg(u, cue(3, 'half'), .6))) + '%';
    put('impTag', x + 160, y + 250, -40, .9 * pop(u, cue(3, 'price') - .2), 3, on * vis(u, cue(3, 'price') - .2));
    $('impN').textContent = '$' + Math.round(576 + (995 - 576) * E.out(seg(u, cue(3, 'price'), .85)));
    put('p73', x + 120, y + 520, -60, 2.3 - 1.3 * E.back(seg(u, cue(3, 'p73'), .3)), -7, on * cl(seg(u, cue(3, 'p73'), .08))); }
  // S4: 13 000 -> 20 000 ?, HA / YO'Q
  { const u = L(4), [x, y] = A[4], on = t > ST[4] - .6 ? 1 : 0, n = cue(4, 'n20'), ha = cue(4, 'ha');
    put('glow4', x, y - 60, 300, 1 + .08 * Math.sin(u * 7), 0, on * (.6 + .3 * Math.sin(u * 9)));
    put('b4', x, y - 60, 0, .95 * pop(u, .15) * (1 + .06 * Math.sin(cl((u - n - .9) / .3) * Math.PI)), -2, on * vis(u, .15));
    const v = 13000 + 7000 * E.io(seg(u, n, .9)); $('b4n').textContent = fmtN(Math.round(v / 100) * 100) + (u > n + .9 ? '?' : '');
    put('vHa', x - 220, y + 330, -20, pop(u, ha) * (1 + .06 * Math.sin(u * 8)), -4, on * vis(u, ha));
    put('vYoq', x + 220, y + 330, -20, pop(u, ha + .12) * (1 + .06 * Math.sin(u * 8 + 3)), 4, on * vis(u, ha + .12)); }
}
