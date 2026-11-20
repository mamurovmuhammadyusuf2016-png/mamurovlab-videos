#!/usr/bin/env bash
# Usage: CF_API_TOKEN=... CF_ACCOUNT_ID=... video/cf_img.sh "prompt" out.png [width] [height] [model]
# Default model: @cf/black-forest-labs/flux-2-dev (multipart, expensive: ~3 images/day on free plan).
# Cheap: pass @cf/black-forest-labs/flux-1-schnell as model (1024x1024, width/height ignored).
set -euo pipefail
P="$1"; OUT="$2"; W="${3:-1080}"; H="${4:-1920}"; M="${5:-@cf/black-forest-labs/flux-2-dev}"
URL="https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/run/$M"
if [[ "$M" == *flux-1-schnell ]]; then  # cheap model: square 1024x1024 only, max 8 steps
  RESP=$(curl -sS "$URL" -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    -d "$(jq -n --arg p "$P" '{prompt:$p,steps:8}')")
elif [[ "$M" == @cf/black-forest-labs/flux-2* ]]; then
  RESP=$(curl -sS "$URL" -H "Authorization: Bearer $CF_API_TOKEN" --form-string "prompt=$P" --form-string "width=$W" --form-string "height=$H")
else
  RESP=$(curl -sS "$URL" -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    -d "$(jq -n --arg p "$P" --argjson w "$W" --argjson h "$H" '{prompt:$p,width:$w,height:$h,steps:30}')")
fi
IMG=$(jq -r '.result.image // empty' <<<"$RESP")
[[ -z "$IMG" ]] && { echo "$RESP" | head -c 600 >&2; exit 1; }
base64 -d <<<"$IMG" > "$OUT"; echo "$OUT"
