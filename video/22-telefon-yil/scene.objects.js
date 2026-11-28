// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const FL = $('flash');
window.vidSet = async (t) => { let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.1); }); FL.style.opacity = Math.max(0, f) * .35; };
const stamp = (u, t0) => 2.1 - 1.1 * E.back(seg(u, t0, .3));
const DAY = [], LIFE = [];
for (let k = 0; k < 24; k++) { const i = document.createElement('i'); $('day').appendChild(i); DAY.push(i); }
for (let k = 0; k < 75; k++) { const i = document.createElement('i'); $('life').appendChild(i); LIFE.push(i); }
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: phone with "?? YIL" (answer shown in S4 -> loops back to the question)
  { const [x, y] = A[0], on = t < ST[1] + .4 || t > ST[4] - .6 ? 1 : 0, s4 = t > ST[3];
    $('q0v').textContent = s4 ? '10 YIL' : '?? YIL';
    put('phone', x - 40, y - 20 + Math.sin(t * 2) * 8, 0, 1, Math.sin(t * 1.4) * 3, on);
    put('hg0', x + 270, y + 120, -60, .95, 10 + Math.sin(t * 2.4) * 4, on);
    put('q0', x, y + 560, -40, .8 * (1 + .04 * Math.sin(t * 6)), -3, on * (s4 ? 1 - cl(seg(L(4), cue(4, 'send') - .3, .3)) : 1)); }
  // S1: 4 of 24 hours light up red
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, h = cue(1, 'h4');
    put('d4', x, y - 280, -30, .8 * stamp(u, h), -2, on * cl(seg(u, h, .08)));
    put('day', x, y + 220, 0, .95 * pop(u, .05), 0, on * vis(u, .05));
    put('dayl', x, y + 530, -10, pop(u, .3), 0, on * vis(u, .3));
    DAY.forEach((c, k) => { const lit = k >= 20 && u > h + (k - 20) * .12; c.style.background = lit ? '#ff3b4e' : 'rgba(255,255,255,.18)'; c.style.boxShadow = lit ? '0 0 24px rgba(255,59,78,.8)' : 'none'; }); }
  // S2: per year card, then 75-year grid with 10 years in red
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, ty = cue(2, 'ten');
    put('yr', x, y - 300, -30, .72 * stamp(u, .1), -2, on * cl(seg(u, .1, .08)) * (1 - cl(seg(u, ty - .3, .3))));
    put('life', x, y + 200, 0, .95 * pop(u, .4), 0, on * vis(u, .4));
    LIFE.forEach((c, k) => { const lit = k >= 65 && u > ty - .6 + (k - 65) * .07; c.style.background = lit ? '#ff3b4e' : (u > .4 + k * .012 ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.1)'); c.style.boxShadow = lit ? '0 0 18px rgba(255,59,78,.8)' : 'none'; });
    put('ten', x, y - 300, -60, .8 * stamp(u, ty), 3, on * cl(seg(u, ty, .08))); }
  // S3: two languages a year or hundreds of books
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, lg = cue(3, 'lang'), bo = cue(3, 'book');
    put('bubbles', x - 220, y - 150 + Math.sin(u * 2.4) * 8, 0, pop(u, lg - .2), -4, on * vis(u, lg - .2));
    put('lang', x + 170, y - 300, -40, .66 * stamp(u, lg), 3, on * cl(seg(u, lg, .08)));
    put('books', x - 220, y + 360, 0, pop(u, bo - .2), 3, on * vis(u, bo - .2));
    put('bk', x + 150, y + 330, -40, .6 * stamp(u, bo), -3, on * cl(seg(u, bo, .08))); }
}
