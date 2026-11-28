// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const FL = $('flash');
window.vidSet = async (t) => { let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.1); }); FL.style.opacity = Math.max(0, f) * .35; };
const stamp = (u, t0) => 2.1 - 1.1 * E.back(seg(u, t0, .3));
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: the empty cradle (loop spot)
  { const [x, y] = A[0], on = t < ST[1] + .4 || t > ST[4] - .6 ? 1 : 0, s4 = t > ST[3];
    put('beshik', x, y - 40 + Math.sin(t * 2.2) * 8, 0, 1, Math.sin(t * 1.6) * 3, on);
    put('q0', x, y + 500, -40, .85 * (1 + .05 * Math.sin(t * 6)), -3, on * (s4 ? 1 - cl(seg(L(4), .0, .3)) : 1)); }
  // S1: 20+ t of trash = 4 elephants
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, el = cue(1, 'el');
    put('tr', x, y - 250, -30, .8 * stamp(u, cue(1, 'tr')), -2, on * cl(seg(u, cue(1, 'tr'), .08)));
    put('trash', x, y + 60, 0, pop(u, .05), 0, on * vis(u, .05));
    put('eq', x, y + 300, -20, pop(u, el - .25), 0, on * vis(u, el - .25));
    ['el0', 'el1', 'el2', 'el3'].forEach((id, k) => put(id, x - 330 + k * 220, y + 500 + Math.sin(u * 3 + k) * 5, -10 + k * 5, pop(u, el + k * .12), (k % 2 ? 3 : -3), on * vis(u, el + k * .12))); }
  // S2: 30 t of food, 55 000 L of water
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, w = cue(2, 'wt');
    put('plov', x - 200, y - 160, 0, pop(u, .05), -3, on * vis(u, .05));
    put('fd', x + 170, y - 300, -40, .62 * stamp(u, cue(2, 'fd')), 3, on * cl(seg(u, cue(2, 'fd'), .08)));
    put('bottle', x - 230, y + 340 + Math.sin(u * 2.5) * 8, 0, pop(u, w - .25), 5, on * vis(u, w - .25));
    put('wt', x + 170, y + 330, -40, .62 * stamp(u, w), -3, on * cl(seg(u, w, .08))); }
  // S3: 3.5 bln so'm earned, ~3 bln heartbeats
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, h = cue(3, 'hb'), beat = 1 + .08 * Math.pow(Math.max(0, Math.sin(u * 7.5)), 8);
    put('money', x - 210, y - 170, 0, pop(u, .05), -4, on * vis(u, .05));
    put('mn', x + 170, y - 300, -40, .66 * stamp(u, cue(3, 'mn')), 3, on * cl(seg(u, cue(3, 'mn'), .08)));
    put('heart', x - 210, y + 360, 0, pop(u, h - .25) * beat, 4, on * vis(u, h - .25));
    put('hb', x + 170, y + 330, -40, .66 * stamp(u, h), -3, on * cl(seg(u, h, .08))); }
}
