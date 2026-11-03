#!/usr/bin/env bash
# Bộ kiểm tra tự động cho web quản lý lớp.
# Chạy: bash test/chay.sh   (thoát 0 = đạt hết, 1 = có lỗi)
set -u
cd "$(dirname "$0")/.." || exit 1
PORT="${PORT:-8931}"
CHROME="${CHROME:-google-chrome}"

python3 -m http.server "$PORT" >/dev/null 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT
sleep 1

DOM=$("$CHROME" --headless=new --disable-gpu --no-sandbox \
  --virtual-time-budget=20000 --window-size=1280,900 \
  --dump-dom "http://127.0.0.1:$PORT/test/kiem-tra.html" 2>/dev/null)

printf '%s' "$DOM" | python3 -c '
import sys,re,html
d=sys.stdin.read()
m=re.search(r"<pre id=\"out\"[^>]*>(.*?)</pre>",d,re.S)
if not m:
    print("KHONG DOC DUOC KET QUA (trang test khong chay xong)"); sys.exit(1)
noi=html.unescape(m.group(1))
print(noi)
sys.exit(0 if ("FAIL" not in noi and "LOI" not in noi) else 1)
'
