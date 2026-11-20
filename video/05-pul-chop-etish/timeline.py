# Builds timeline.json + cues.js from voice/v*.wav: scene starts snapped to the 1/8-note grid (120 BPM).
import json, math, subprocess, glob, os
here = os.path.dirname(os.path.abspath(__file__))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
voices = sorted(glob.glob(os.path.join(here,'voice','v*.wav')), key=lambda p:int(os.path.basename(p)[1:-4]))
GRID, GAP, VO, TAIL = 0.25, 0.18, 0.08, 1.4
lens = [dur(v) for v in voices]; starts = [0.0]
for i in range(1, len(lens)):
    starts.append(math.ceil((starts[-1] + VO + lens[i-1] + GAP) / GRID) * GRID)
total = round(starts[-1] + VO + lens[-1] + TAIL, 3)
# scene-relative cue times (seconds from scene start), from pauses measured in each voice line
c = lambda x: round(VO + 0.06 + x, 3)  # +0.06: lead-in kept by the gentler trim
cues = {
  "VO": VO, "starts": starts, "total": total, "lens": lens,
  "s0": {"print": 0.12, "line2": c(1.73)},
  "s1": {"line": c(1.0), "lid": c(2.0)},
  "s2": {"crowd": 0.05, "non": c(1.70), "car": c(2.88), "stamp": c(3.55)},
  "s3": {"pul": c(0.0), "non": c(1.06), "prices": [c(0.35), c(0.85), c(1.45), c(2.05)], "narx": c(2.44), "rocket": c(3.25)},
  "s4": {"label": 0.1, "flip0": c(1.55), "flipStep": 0.25, "flips": 8, "note": c(4.15), "zeros": c(4.96), "zeroStep": 0.12},
  "s5": {"oson": c(0.3), "non": c(1.53), "qiyin": c(2.38)},
  "s6": {"q2": c(1.35), "ha": c(2.86), "hit": round(lens[6] + VO + 0.35, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
