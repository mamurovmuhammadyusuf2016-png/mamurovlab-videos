import json, sys, base64, urllib.request, urllib.error, os, time
# Usage: GEMINI_API_KEY=... python3 video/tts.py "Matn" out.wav   (env: V=voice, M=model)
key=os.environ["GEMINI_API_KEY"]; text=sys.argv[1]; out=sys.argv[2]
model=os.environ.get("M","gemini-3.8-flash-tts"); voice=os.environ.get("V","Fenrir"); style=os.environ.get("STYLE","")
body={"contents":[{"parts":[{"text":style+text}]}],
 "generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":voice}}}}}
for i in range(4):
    try:
        req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",data=json.dumps(body).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key})
        r=json.load(urllib.request.urlopen(req,timeout=90)); break
    except urllib.error.HTTPError as e:
        body=e.read().decode(errors="ignore")
        if e.code==429 and "PerDay" in body:  # daily quota: retrying only burns more quota
            print("daily quota exhausted for",model,file=sys.stderr); sys.exit(2)
        print("retry",e,file=sys.stderr); time.sleep(20*(i+1))
    except Exception as e:
        print("retry",e,file=sys.stderr); time.sleep(5*(i+1))
else: sys.exit(1)
p=r["candidates"][0]["content"]["parts"][0]["inlineData"]
raw=base64.b64decode(p["data"])
if raw[:4]==b"RIFF": open(out,"wb").write(raw)
else:  # raw 16-bit PCM (audio/L16), wrap into WAV
    import wave, re
    rate=int((re.search(r"rate=(\d+)",p.get("mimeType","")) or [0,24000])[1])
    with wave.open(out,"wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(raw)
