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
# scene-relative cue times (seconds from scene start), from pauses measured in each voice line
c = lambda x: round(VO + 0.03 + x, 3)
cues = {
  "VO": VO, "starts": starts, "total": total, "lens": lens,
  "s0": {"q": c(1.3)},
  "s1": {"xursand": c(0.74), "bobo": c(1.73)},
  "s2": {"birth": c(1.81), "death": c(4.06), "zero": c(5.6)},
  "s3": {"grow": c(1.36), "count": c(3.53), "usa": c(5.2)},
  "s4": {"uz": 0.05, "count": c(2.35), "city": c(4.23)},
  "s5": {"pension": 0.05, "flat": c(1.59), "boss": c(2.96)},
  "s6": {"ha": c(2.2), "komment": c(3.38), "hit": round(lens[6] + VO + 0.35, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
