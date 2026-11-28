# Builds timeline.json + cues.js from voice/v*.wav; cue offsets come from silencedetect pauses in each line.
import json, math, subprocess, glob, os
here = os.path.dirname(os.path.abspath(__file__))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
voices = sorted(glob.glob(os.path.join(here,'voice','v*.wav')), key=lambda p:int(os.path.basename(p)[1:-4]))
GRID, GAP, VO, TAIL = 0.125, 0.4, 0.05, 1.9
lens = [dur(v) for v in voices]; starts = [0.0]
for i in range(1, len(lens)):
    starts.append(math.ceil((starts[-1] + VO + lens[i-1] + GAP) / GRID) * GRID)
total = round(starts[-1] + VO + lens[-1] + TAIL, 3)
c = lambda x: round(VO + 0.03 + x, 3)
P = json.load(open(os.path.join(here, 'pauses.json')))   # {"s0":{"dark":x}, ...} offsets measured from each voice line
cues = {"VO": VO, "starts": starts, "total": total, "lens": lens}
for s, d in P.items(): cues[s] = {k: c(v) for k, v in d.items()}
cues["s4"]["hit"] = round(lens[4] + VO + 0.25, 3)
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
