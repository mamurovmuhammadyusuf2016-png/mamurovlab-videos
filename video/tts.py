import json, sys, base64, urllib.request, os, time
# Usage: GEMINI_API_KEY=... python3 video/tts.py "Matn" out.wav   (env: V=voice, M=model)
key=os.environ["GEMINI_API_KEY"]; text=sys.argv[1]; out=sys.argv[2]
model=os.environ.get("M","gemini-3.8-flash-tts"); voice=os.environ.get("V","Fenrir"); style=os.environ.get("STYLE","")
body={"contents":[{"parts":[{"text":style+text}]}],
 "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":voice}}}}}
for i in range(4):
    try:
        req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",data=json.dumps(body).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key})
        r=json.load(urllib.request.urlopen(req,timeout=90)); break
    except Exception as e:
        print("retry",e,file=sys.stderr); time.sleep(5*(i+1))
else: sys.exit(1)
p=r["candidates"][0]["content"]["parts"][0]["inlineData"]
open(out,"wb").write(base64.b64decode(p["data"]))
