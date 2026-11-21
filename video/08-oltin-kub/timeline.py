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
  "s0": {"q": c(2.79)},
  "s1": {"count": c(1.96)},
  "s2": {"cube": c(0.3), "metr": c(1.98), "uy": c(3.0)},
  "s3": {"price": c(0.98)},
  "s4": {"gram": c(1.7), "q2": c(3.56), "komment": c(5.07), "hit": round(lens[4] + VO + 0.3, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
