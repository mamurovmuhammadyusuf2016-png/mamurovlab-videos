// ---------- no particles in this reel ----------
function drawNotes(t) {}
const pop = (u, t0, d = .35) => E.back(seg(u, t0, d)), vis = (u, t0) => cl(seg(u, t0, .1));
const FL = $('flash'), IMGS = [...document.querySelectorAll('img[data-f]')];
// portfolio phones play 3 s loops of earlier @mamurovlab reels (30 fps JPG sequences)
window.vidSet = async (t) => {
  let f = 0; ST.forEach((s) => { if (s > 0) f = Math.max(f, 1 - Math.abs(t - s) / 0.1); }); FL.style.opacity = Math.max(0, f) * .35;
  const jobs = [];
  for (const im of IMGS) {
    if (im.parentElement.style.display === 'none') continue;
    const n = 1 + Math.floor((t * 30 + +im.dataset.ph) % 90);
    const src = `build/pf/${im.dataset.f}/${String(n).padStart(3, '0')}.jpg`;
    if (im.getAttribute('src') !== src) { im.setAttribute('src', src); jobs.push(im.decode().catch(() => {})); }
  }
  await Promise.all(jobs);
};
const bump = (u, t0) => { const k = u - t0; return k > 0 && k < 1.2 ? Math.exp(-k * 5) * Math.sin(Math.min(1, k / .08) * Math.PI / 2) : 0; };
function objects(t) {
  const L = i => t - ST[i];
  // S0 + S4: three portfolio phones and the price tag (same spot, so the end loops into the start)
  { const [x, y] = A[0], on = t < ST[1] + .4 || t > ST[4] - .6 ? 1 : 0, u = t > ST[3] ? L(4) : t;
    const b = t > ST[3] ? bump(u, cue(4, 'dm')) : bump(u, cue(0, 'price'));
    put('p1', x - 330, y + 10 + Math.sin(t * 1.4) * 10, 260, 1, -9, on);
    put('p2', x + 330, y + 10 + Math.sin(t * 1.4 + 2) * 10, 260, 1, 9, on);
    put('p0', x, y - 60 + Math.sin(t * 1.4 + 1) * 8, 0, 1, Math.sin(t * .9) * 1.5, on);
    put('price', x, y + 520, 0, 1 + .14 * b, -3 + Math.sin(t * 1.1) * 1.2, on); }
  // S1: who it is for — phones rise one by one with their tags
  { const u = L(1), [x, y] = A[1], on = t > ST[1] - .6 && t < ST[2] + .4 ? 1 : 0;
    [['p3', 't1', -315], ['p4', 't2', 0], ['p5', 't3', 315]].forEach(([id, k, dx], i) => { const k0 = cue(1, k) - .12, p = E.out(seg(u, k0, .45));
      put(id, x + dx, y - 60 + 800 * (1 - p) + Math.sin(t * 1.5 + i) * 8, 0, .62 * (.7 + .3 * E.back(seg(u, k0, .45))), (i - 1) * 5, on * vis(u, k0)); }); }
  // S2: what I do — four steps tick in
  { const u = L(2), [x, y] = A[2], on = t > ST[2] - .6 && t < ST[3] + .4 ? 1 : 0, ba = bump(u, cue(2, 'all'));
    [['k1', -230], ['k2', -50], ['k3', 130], ['k4', 310]].forEach(([id, dy], i) => { const k0 = cue(2, id) - .12, p = E.out(seg(u, k0, .4));
      put(id, x + 900 * (1 - p), y + dy, -20, .88 * (.7 + .3 * E.back(seg(u, k0, .4))) * (1 + .05 * ba), (i % 2 ? 1.5 : -1.5), on * vis(u, k0));
      $(id).querySelector('.ck').style.transform = `scale(${E.back(seg(u, k0 + .25, .3))})`; }); }
  // S3: your idea -> my finished video
  { const u = L(3), [x, y] = A[3], on = t > ST[3] - .6 && t < ST[4] + .4 ? 1 : 0, me = cue(3, 'me');
    put('idea', x, y - 270, -20, .9 * pop(u, .1), -2, on * vis(u, .1));
    put('arr', x, y - 70 + Math.sin(u * 6) * 14, -10, pop(u, .7), 0, on * vis(u, .7));
    put('p6', x, y + 280, 0, .66 * (.6 + .4 * pop(u, me - .25, .45)), 2, on * vis(u, me - .25)); }
}
