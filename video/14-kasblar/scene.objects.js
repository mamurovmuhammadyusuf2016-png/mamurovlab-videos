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
// S2: gold/green sparks when the new jobs light up; S0: sparks when lamps die
emit(101, ST[2] + cue(2, 'new'), ST[2] + cue(2, 'new') + 2.2, 40, (r, t) => ({ t0: t, life: 1.4, x: A[2][0] - 500 + r() * 1000, y: A[2][1] - 700 + r() * 1400, z: -60, vx: (r() - .5) * 300, vy: -200 - r() * 400, vz: 0, g: 0, rot: 0, vr: 0, fl: 0, sc: .12 + r() * .14, k: 'spark', add: 1 }));
emit(102, ST[2] + cue(2, 'net'), ST[2] + cue(2, 'net') + .3, 110, (r, t) => { const a = r() * Math.PI * 2, v = 500 + r() * 1100; return { t0: t, life: 1.1, x: A[2][0], y: A[2][1] + 560, z: -150, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 0, g: 900, rot: 0, vr: 0, fl: 0, sc: .1 + r() * .12, k: 'spark', add: 1 }; });
emit(103, ST[4] + .05, ST[4] + 1.4, 40, (r, t) => ({ t0: t, life: 1.4, x: A[4][0] - 500 + r() * 1000, y: A[4][1] - 700 + r() * 1400, z: -60, vx: (r() - .5) * 300, vy: -200 - r() * 400, vz: 0, g: 0, rot: 0, vr: 0, fl: 0, sc: .12 + r() * .14, k: 'spark', add: 1 }));
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
// ---------- lamp grids (each lamp is one job) ----------
function makeLamps(n) {
  const world = $('world'), anchor = $('notes'), out = [], r = rng(33);
  for (let k = 0; k < n; k++) {
    const el = document.createElement('div'); el.className = 'o lamp'; const sp = document.createElement('span'); sp.textContent = '💡'; el.appendChild(sp);
    world.insertBefore(el, anchor); out.push({ el, sp, k, rnd: r(), cx: k % 5, cy: Math.floor(k / 5), st: '' });
  }
  return out;
}
const L0 = makeLamps(35), L2 = makeLamps(35);
function setLamp(l, on, tint) {
  const st = on ? (tint || 'on') : 'off'; if (l.st === st) return; l.st = st;
  l.sp.style.filter = on ? (tint === 'green' ? 'hue-rotate(250deg) saturate(1.3) drop-shadow(0 0 26px rgba(80,255,150,.95))' : 'drop-shadow(0 0 26px rgba(255,190,60,.95))') : 'grayscale(1) brightness(.28)';
  l.sp.style.opacity = on ? 1 : .75;
}
function putLamps(L, x, y, on, sc, fn) {
  L.forEach((l) => { const lx = x + (l.cx - 2) * 215 + (l.cy % 2 ? 30 : -30), ly = y + (l.cy - 3) * 250 + 40; put(l.el, lx, ly, 160 - l.cy * 6, sc, 0, on); fn(l); });
}
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: lamp wall; lamps die after "yo'qoladi", come back for the CTA (loop)
  { const inS0 = t < ST[1] + .4, inS4 = t > ST[4] - .6, on = inS0 || inS4 ? 1 : 0, [x, y] = A[0], u = inS4 ? L(4) : L(0), dk = cue(0, 'dark');
    put('glow0', x, y + 60, 400, 1 + .06 * Math.sin(t * 3), 0, on * .75);
    putLamps(L0, x, y, on, .95, (l) => { if (inS4) setLamp(l, u > 0.15 + l.rnd * 0.9); else setLamp(l, !(L(0) > dk + l.rnd * 3.0)); });
    const nb = inS0 ? E.back(seg(L(0), -0.05, .35)) : 1, nbump = inS0 && L(0) > dk && L(0) < dk + .3 ? 1 + .08 * Math.sin((L(0) - dk) / .3 * Math.PI) : 1;
    put('num0', x, y - 110, -100, (inS0 ? (.62 + .38 * nb) : .85 + .15 * Math.min(1, u)) * nbump, -3, on * (inS0 ? 1 : 1)); }
  // S1: five professions struck out in turn
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    ['c1', 'c2', 'c3', 'c4', 'c5'].forEach((id, i) => { const k = cue(1, 'k' + (i + 1)), p = E.out(seg(u, k - .15, .4)), xx = cl(seg(u, k + .45, .25)), el = $(id);
      put(id, x + (i % 2 ? 20 : -20) + 900 * (1 - p), y - 440 + i * 215, -20, .9 * (.6 + .4 * E.back(seg(u, k - .15, .4))), (i % 2 ? 2 : -2), on * vis(u, k - .15));
      el.querySelector('.x').style.transform = `scaleX(${E.out(xx)})`; el.querySelector('.no').style.opacity = xx; el.style.filter = ''; el.querySelector('.t').style.opacity = 1 - .55 * xx; }); }
  // S2: 170 mln new jobs light up
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, nw = cue(2, 'new');
    put('glow2', x, y + 60, 400, 1 + .06 * Math.sin(t * 3), 0, on * .8);
    putLamps(L2, x, y, on, .95, (l) => setLamp(l, u > nw + l.rnd * 2.0, 'green'));
    put('num2', x, y - 120, -100, (.7 + .3 * pop(u, nw - .1)) * (u > nw && u < nw + .3 ? 1 + .08 * Math.sin((u - nw) / .3 * Math.PI) : 1), -3, on * vis(u, nw - .1));
    put('net2', x, y + 600, -100, 2.0 - 1.1 * E.back(seg(u, cue(2, 'net'), .3)), -3, on * cl(seg(u, cue(2, 'net'), .08))); }
  // S3: with AI wins, without AI loses
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, ls = cue(3, 'lose');
    put('pAI', x - 235, y - 20, 0, .95 * pop(u, cue(3, 'ai') - .1), -2, on * vis(u, cue(3, 'ai') - .1));
    put('pNo', x + 235, y - 20, 0, .95 * pop(u, .1) * (1 - .12 * cl(seg(u, ls, .3))), 2, on * vis(u, .1) * (1 - .35 * cl(seg(u, ls, .3))));
    put('lost3', x + 235, y + 360, -100, 2.0 - 1.1 * E.back(seg(u, ls, .3)), -5, on * cl(seg(u, ls, .08))); }
}
