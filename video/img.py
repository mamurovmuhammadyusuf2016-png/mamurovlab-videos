# Usage: GEMINI_API_KEY=... python3 video/img.py "prompt" out.png [aspect=9:16]   (env: M=model)
import json, sys, base64, urllib.request, os, time
key=os.environ["GEMINI_API_KEY"]; prompt=sys.argv[1]; out=sys.argv[2]; ar=sys.argv[3] if len(sys.argv)>3 else "9:16"
model=os.environ.get("M","gemini-3.1-flash-image")
body={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":ar}}}
for i in range(4):
    try:
        req=urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",data=json.dumps(body).encode(),headers={"Content-Type":"application/json","x-goog-api-key":key})
        r=json.load(urllib.request.urlopen(req,timeout=150)); break
    except Exception as e:
        print("retry",e,file=sys.stderr); time.sleep(8*(i+1))
else: sys.exit(1)
for p in r["candidates"][0]["content"]["parts"]:
    if "inlineData" in p:
        open(out,"wb").write(base64.b64decode(p["inlineData"]["data"])); print(out, p["inlineData"]["mimeType"]); break
else: print(json.dumps(r)[:800]); sys.exit(1)
