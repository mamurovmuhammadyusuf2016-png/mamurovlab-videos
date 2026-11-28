// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const FL = $('flash');
window.vidSet = async (t) => { let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.1); }); FL.style.opacity = Math.max(0, f) * .35; };
const bump = (u, t0) => { const k = u - t0; return k > 0 && k < 1.2 ? Math.exp(-k * 5) * Math.sin(Math.min(1, k / .08) * Math.PI / 2) : 0; };
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: alarm clock, pause button, "1 KUN = ???" card (answer revealed in S4)
  { const [x, y] = A[0], on = t < ST[1] + .4 || t > ST[4] - .6 ? 1 : 0, s4 = t > ST[3];
    const dig = '0123456789'; let q = ''; for (let k = 0; k < 3; k++) q += dig[Math.floor((t * 23 + k * 7) % 10)];
    $('dayv').textContent = s4 ? "6,4 TRLN SO'M" : `${q} TRLN SO'M`;
    put('clock', x, y - 60 + Math.sin(t * 6) * 4, 0, 1, Math.sin(t * 30) * 2.2 * (s4 ? .3 : 1), on);
    put('pause', x + 220, y + 110, -80, 1 + .08 * Math.sin(t * 5), 8, on);
    put('day', x, y + 520, -60, s4 ? .85 : .9, -3, on * (s4 ? 1 - cl(seg(L(4), cue(4, 'vs') - .3, .3)) : 1)); }
  // S1: GDP counter
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0, c = E.out(seg(u, .1, 1.6));
    $('gdpv').textContent = c < 1 ? fmt(6.43e6 * c) + " MLN" : "6,4 TRLN SO'M"; $('gdpv').style.color = c < 1 ? '#0a6cff' : '#16b866';
    put('gdp', x, y - 190, -30, .82 * (1 + .12 * bump(u, 1.7)), -2, on * vis(u, 0));
    put('factory', x - 220, y + 330 + Math.sin(u * 2) * 6, 0, pop(u, .3), -3, on * vis(u, .3));
    put('money', x + 230, y + 340 + Math.sin(u * 2 + 1) * 6, -20, pop(u, 1.7), 4, on * vis(u, 1.7)); }
  // S2: 320 schools or 38 km of metro
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, sc = cue(2, 'sch'), me = cue(2, 'met');
    put('school', x - 230, y - 150, 0, pop(u, sc - .2), -3, on * vis(u, sc - .2));
    put('sch', x + 210, y - 170, -40, .8 * pop(u, sc), 3, on * vis(u, sc));
    put('yoki', x, y + 90, -20, pop(u, me - .4), 0, on * vis(u, me - .4));
    put('metro', x - 230, y + 370, 0, pop(u, me - .1), 3, on * vis(u, me - .1));
    put('met', x + 210, y + 360, -40, .8 * pop(u, me + .05), -3, on * vis(u, me + .05)); }
  // S3: per person per day
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, pr = cue(3, 'per');
    put('per', x, y - 200, -30, .72 * (2.1 - 1.1 * E.back(seg(u, pr, .3))), -2, on * cl(seg(u, pr, .08)));
    put('crowd', x, y + 330 + Math.sin(u * 2) * 6, 0, pop(u, .1), 0, on * vis(u, .1)); }
}
