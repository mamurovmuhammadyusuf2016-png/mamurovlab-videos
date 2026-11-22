# Builds timeline.json + cues.js from voice/v*.wav: scene starts snapped to the 1/8-note grid (120 BPM).
import json, math, subprocess, glob, os
here = os.path.dirname(os.path.abspath(__file__))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
voices = sorted(glob.glob(os.path.join(here,'voice','v*.wav')), key=lambda p:int(os.path.basename(p)[1:-4]))
GRID, GAP, VO, TAIL = 0.125, 0.05, 0.05, 1.1
lens = [dur(v) for v in voices]; starts = [0.0]
for i in range(1, len(lens)):
    starts.append(math.ceil((starts[-1] + VO + lens[i-1] + GAP) / GRID) * GRID)
total = round(starts[-1] + VO + lens[-1] + TAIL, 3)
# scene-relative cue times, from pauses measured in each voice line (silencedetect -38 dB)
c = lambda x: round(VO + 0.03 + x, 3)
cues = {
  "VO": VO, "starts": starts, "total": total, "lens": lens,
  "s0": {"down": c(1.95), "kim": c(3.0)},
  "s1": {"y2017": c(0.25), "old": c(1.8), "now": c(4.1), "n13": c(4.95), "x3": c(6.07)},
  "s2": {"gov": c(0.1), "birja": c(2.77), "auk": c(3.83), "kam": c(5.99), "kop": c(6.78), "hammer": c(7.74)},
  "s3": {"train": c(0.3), "half": c(1.0), "price": c(2.98), "p73": c(3.9)},
  "s4": {"n20": c(1.0), "ha": c(2.94), "kom": c(3.8), "hit": round(lens[4] + VO + 0.3, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
