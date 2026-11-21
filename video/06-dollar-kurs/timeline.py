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
  "s0": {"line2": c(2.23), "pills": c(3.09)},
  "s1": {"year": c(1.0), "rasmiy": c(2.84), "bozor": c(4.52)},
  "s2": {"cal": 0.05, "birkunda": c(2.68), "jump": c(3.35)},
  "s3": {"birja": 0.05, "sotadi": c(1.43), "sotib": c(2.4)},
  "s4": {"buyers": c(0.0), "car": c(1.06), "phone": c(1.55), "pill": c(2.05), "sellers": c(3.4), "gold": c(4.18), "gas": c(4.7), "mig": c(5.4)},
  "s5": {"oshadi": c(1.58), "bank": c(2.63), "calm": c(3.56)},
  "s6": {"komment": c(2.86), "hit": round(lens[6] + VO + 0.35, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
