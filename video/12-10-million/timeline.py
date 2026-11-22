# Builds timeline.json + cues.js from voice/v*.wav: scene starts snapped to the 1/8-note grid (118 BPM ~ 0.127 s).
import json, math, subprocess, glob, os
here = os.path.dirname(os.path.abspath(__file__))
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
voices = sorted(glob.glob(os.path.join(here,'voice','v*.wav')), key=lambda p:int(os.path.basename(p)[1:-4]))
GRID, GAP, VO, TAIL = 0.125, 0.05, 0.05, 1.2
lens = [dur(v) for v in voices]; starts = [0.0]
for i in range(1, len(lens)):
    starts.append(math.ceil((starts[-1] + VO + lens[i-1] + GAP) / GRID) * GRID)
total = round(starts[-1] + VO + lens[-1] + TAIL, 3)
# scene-relative cue times, from pauses measured in each voice line (silencedetect -38 dB, after atempo 1.3)
c = lambda x: round(VO + 0.03 + x, 3)
cues = {
  "VO": VO, "starts": starts, "total": total, "lens": lens,
  "s0": {"stack": c(1.58), "split": c(3.27), "kim": c(5.33)},
  "s1": {"usd": c(2.69), "grow": c(4.54), "n15": c(5.39)},
  "s2": {"coin": c(1.98), "grow": c(3.43), "n41": c(4.09), "x4": c(5.48)},
  "s3": {"steps": c(1.28), "n45": c(4.26)},
  "s4": {"sad": c(1.18), "prices": c(2.40), "d15": c(4.30), "lost": c(5.1)},
  "s5": {"o1": c(1.94), "o2": c(2.68), "o3": c(3.26), "kom": c(4.29), "hit": round(lens[5] + VO + 0.3, 3)},
}
json.dump(cues, open(os.path.join(here,'timeline.json'),'w'), indent=1)
open(os.path.join(here,'cues.js'),'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
print('starts', starts, 'total', total)
