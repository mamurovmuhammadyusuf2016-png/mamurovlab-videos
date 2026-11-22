# Builds timeline.json + cues.js from voice/v*.wav: scene starts snapped to the 1/8-note grid (120 BPM).
import json, math, subprocess, glob, os
here = os.path.dirname(os.path.abspath(__file__))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
voices = sorted(glob.glob(os.path.join(here,'voice','v*.wav')), key=lambda p:int(os.path.basename(p)[1:-4]))
GRID, GAP, VO, TAIL = 0.125, 0.05, 0.05, 1.3
lens = [dur(v) for v in voices]; starts = [0.0]
for i in range(1, len(lens)):
    starts.append(math.ceil((starts[-1] + VO + lens[i-1] + GAP) / GRID) * GRID)
total = round(starts[-1] + VO + lens[-1] + TAIL, 3)
# scene-relative cue times, from pauses measured in each voice line (silencedetect -38 dB, after atempo 1.22)
c = lambda x: round(VO + 0.03 + x, 3)
cues = {
  "VO": VO, "starts": starts, "total": total, "lens": lens,
  "s0": {"city": c(1.27), "small": c(3.18), "stamp": c(4.25), "kim": c(4.95)},
  "s1": {"tag": c(1.55), "som": c(3.0)},
  "s2": {"i1": c(0.0), "i2": c(0.6), "i3": c(1.23), "i4": c(1.8), "sum": c(2.6)},
  "s3": {"n12": c(1.0), "tax": c(2.23), "net": c(3.25), "gap": c(4.82)},
  "s4": {"num": c(1.62), "send": c(2.45), "hit": round(lens[4] + VO + 0.25, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
