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
function usdSprite() { const c = document.createElement('canvas'); c.width = 300; c.height = 140; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 300, 140); grad.addColorStop(0, '#7cf0a8'); grad.addColorStop(.55, '#2fbf71'); grad.addColorStop(1, '#17844a');
  g.fillStyle = grad; g.beginPath(); g.roundRect(0, 0, 300, 140, 14); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.beginPath(); g.roundRect(10, 10, 280, 120, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(70, 70, 38, 0, 7); g.fill(); g.fillStyle = '#0d3b22'; g.font = '900 46px "Inter Display", Inter'; g.textAlign = 'right'; g.fillText('$ 100', 280, 66); g.font = '800 26px Inter'; g.fillText('DOLLAR', 280, 108); return c; }
const SPR = { som: sprite('som'), spark: sprite('spark'), usd: usdSprite() };
const parts = [];
function emit(seed, t0, t1, rate, fn) { const r = rng(seed); for (let t = t0; t < t1; t += 1 / rate) parts.push(fn(r, t + r() / rate)); }
// S0 + S4: dollars rain around the Amazon counter
emit(161, -1.5, ST[1] + .3, 9, (r, t) => ({ t0: t, life: 2.6, x: A[0][0] - 700 + r() * 1400, y: A[0][1] - 1150, z: -200 + r() * 700, vx: (r() - .5) * 140, vy: 520 + r() * 300, vz: 0, g: 300, rot: r() * 6, vr: (r() - .5) * 3, fl: 2 + r() * 4, sc: .7, k: 'usd' }));
emit(162, ST[4] - .2, TOTAL + .5, 9, (r, t) => ({ t0: t, life: 2.6, x: A[4][0] - 700 + r() * 1400, y: A[4][1] - 1150, z: -200 + r() * 700, vx: (r() - .5) * 140, vy: 520 + r() * 300, vz: 0, g: 300, rot: r() * 6, vr: (r() - .5) * 3, fl: 2 + r() * 4, sc: .7, k: 'usd' }));
emit(163, ST[0] + cue(0, 'blink'), ST[0] + cue(0, 'blink') + .3, 90, (r, t) => { const a = r() * Math.PI * 2, v = 500 + r() * 1100; return { t0: t, life: 1.0, x: A[0][0], y: A[0][1] + 470, z: -120, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 900, rot: 0, vr: 0, fl: 0, sc: .1 + r() * .12, k: 'spark', add: 1 }; });
emit(164, ST[3] + cue(3, 'more'), ST[3] + cue(3, 'more') + .3, 100, (r, t) => { const a = r() * Math.PI * 2, v = 500 + r() * 1100; return { t0: t, life: 1.0, x: A[3][0] + 190, y: A[3][1] - 200, z: -120, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 900, rot: 0, vr: 0, fl: 0, sc: .1 + r() * .12, k: 'spark', add: 1 }; });
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
const roll = (el, v, u, t0, d = .7) => { $(el).firstChild.nodeValue = '$' + fmtN(Math.round(v * E.out(seg(u, t0, d)) / 1000) * 1000); };
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: Amazon counter (final number visible from frame 0), salary stopwatch
  { const inS0 = t < ST[1] + .4, inS4 = t > ST[4] - .6, on = inS0 || inS4 ? 1 : 0, [x, y] = A[0], u = inS4 ? L(4) + 8 : L(0);
    put('glow0', x, y - 60, 400, 1 + .06 * Math.sin(t * 3), 0, on * .8);
    put('bAmz', x, y - 440, -40, 1.1, -2, on);
    const bl = inS0 ? cue(0, 'blink') : -9, bump = inS0 && L(0) > bl && L(0) < bl + .3 ? 1 + .06 * Math.sin((L(0) - bl) / .3 * Math.PI) : 1;
    put('cnt0', x, y - 200, -80, .8 * (.97 + .03 * Math.sin(u * 6)) * bump, -2, on);
    $('tick0').textContent = '+$' + fmtN(25283) + ' har soniyada';
    put('tick0', x, y + 30, -40, .95, 0, on);
    put('watch0', x, y + 400, -60, inS0 ? .95 * pop(L(0), cue(0, 'sal') - .1) : 0, 3, inS0 ? vis(L(0), cue(0, 'sal') - .1) : 0);
    $('watchV').style.opacity = inS0 ? cl(seg(L(0), cue(0, 'blink'), .1)) : 0; $('watchV').style.transform = inS0 ? `scale(${2 - E.back(seg(L(0), cue(0, 'blink'), .35))})` : ''; }
  // S1: Apple, Google
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    [['cApple', 'vApple', 911000, 'a1', -170], ['cGoogle', 'vGoogle', 896000, 'g1', 170]].forEach(([id, vid, v, k, dy], i) => { const k0 = cue(1, k) - .1, p = E.out(seg(u, k0, .45));
      put(id, x + 900 * (1 - p) * (i ? 1 : -1), y + dy, -20, .82 * (.6 + .4 * E.back(seg(u, k0, .45))), i ? 2 : -2, on * vis(u, k0)); roll(vid, v, u, k0 + .1); }); }
  // S2: Nvidia, Microsoft
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0;
    [['cNvidia', 'vNvidia', 688000, 'n1', -170], ['cMs', 'vMs', 631000, 'm1', 170]].forEach(([id, vid, v, k, dy], i) => { const k0 = cue(2, k) - .1, p = E.out(seg(u, k0, .45));
      put(id, x + 900 * (1 - p) * (i ? 1 : -1), y + dy, -20, .82 * (.6 + .4 * E.back(seg(u, k0, .45))), i ? 2 : -2, on * vis(u, k0)); roll(vid, v, u, k0 + .1); }); }
  // S3: ChatGPT vs Claude bars
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, base = y + 600, Hmax = 660;
    const hg = Hmax * 95 / 124 * E.out(seg(u, cue(3, 'gpt'), .6)), hc = Hmax * E.out(seg(u, cue(3, 'cl'), .6));
    $('barG').style.height = Math.max(1, hg) + 'px'; $('barC').style.height = Math.max(1, hc) + 'px';
    put('barG', x - 190, base - hg / 2, 0, 1, 0, on * vis(u, cue(3, 'gpt') - .05)); put('barC', x + 190, base - hc / 2, 0, 1, 0, on * vis(u, cue(3, 'cl') - .05));
    put('valG', x - 190, base - hg - 60, -10, 1, 0, on * vis(u, cue(3, 'gpt') + .3)); put('valC', x + 190, base - hc - 60, -10, 1, 0, on * vis(u, cue(3, 'cl') + .3));
    $('valG').textContent = '$' + fmtN(Math.round(95000 * E.out(seg(u, cue(3, 'gpt'), .6)) / 1000) * 1000); $('valC').textContent = '$' + fmtN(Math.round(124000 * E.out(seg(u, cue(3, 'cl'), .6)) / 1000) * 1000);
    put('bG', x - 190, base + 90, -20, .85, 0, on * vis(u, cue(3, 'gpt') - .1)); put('bC', x + 190, base + 90, -20, .85, 0, on * vis(u, cue(3, 'cl') - .1));
    put('more3', x, y - 330, -120, 1.6 - 0.75 * E.back(seg(u, cue(3, 'more'), .3)), -5, on * cl(seg(u, cue(3, 'more'), .08))); }
  // S4: ChatGPT or Claude?
  { const u = L(4), [x, y] = A[4], on = t > ST[4] - .6 ? 1 : 0, vs = cue(4, 'vs');
    put('vsG', x - 230, y + 330, -40, pop(u, vs) * (1 + .05 * Math.sin(u * 8)), -4, on * vis(u, vs));
    put('vsC', x + 230, y + 330, -40, pop(u, vs + .15) * (1 + .05 * Math.sin(u * 8 + 3)), 4, on * vis(u, vs + .15)); }
}
