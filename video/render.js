// Usage: node video/render.js <scene.html> <voice-dir> <out.mp4>
// voice-dir must contain t0.wav..tN.wav — one voice segment per scene.
// Optional env: FPS (default 30); TIMELINE=<json with starts,total> + AUDIO=<final mix wav>
// to use a pre-built timeline and soundtrack instead of the built-in voice+whoosh mix.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [html, voiceDir, out] = process.argv.slice(2);
const FPS = +(process.env.FPS || 30);
const TAIL = 0.6; // seconds of hold after the last line

const TL = process.env.TIMELINE ? JSON.parse(fs.readFileSync(process.env.TIMELINE)) : null;
const segs = TL ? [] : fs.readdirSync(voiceDir).filter(f => /^t\d+\.wav$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(voiceDir, f)]).toString());
const lens = segs.map(dur);
const starts = TL ? TL.starts : lens.reduce((a, l, i) => (a.push(i ? a[i - 1] + lens[i - 1] : 0), a), []);
const total = TL ? TL.total : starts.at(-1) + lens.at(-1) + TAIL;
console.log('scenes', starts.map(s => s.toFixed(2)).join(' '), 'total', total.toFixed(2));

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'reel-'));
if (!process.env.AUDIO) {
// voice track
fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map(f => `file '${path.resolve(voiceDir, f)}'`).join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-ar', '48000', '-ac', '1', path.join(tmp, 'voice.wav')]);
// whoosh on every scene change
const whoosh = path.join(tmp, 'whoosh.wav');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=d=0.35:c=pink:a=0.6', '-af', 'highpass=f=900,lowpass=f=6000,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.23', '-ar', '48000', '-ac', '1', whoosh]);
const sfxInputs = starts.flatMap(() => ['-i', whoosh]);
const sfxFilter = starts.map((s, i) => `[${i + 1}:a]adelay=${Math.max(0, Math.round(s * 1000 - 120))},volume=0.35[w${i}]`).join(';')
  + ';[0:a]' + starts.map((_, i) => `[w${i}]`).join('') + `amix=inputs=${starts.length + 1}:normalize=0,apad=whole_dur=${total.toFixed(2)},loudnorm=I=-14:TP=-1.5[a]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(tmp, 'voice.wav'), ...sfxInputs, '-filter_complex', sfxFilter, '-map', '[a]', '-ar', '48000', path.join(tmp, 'mix.wav')]);
}
const MIX = process.env.AUDIO ? path.resolve(process.env.AUDIO) : path.join(tmp, 'mix.wav');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', MIX, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-t', total.toFixed(3), '-r', String(FPS), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(([t, s, tot]) => window.render(t, s, tot), [f / FPS, starts, total]);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
