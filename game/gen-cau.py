#!/usr/bin/env python3
"""Sinh mp3 cho các CÂU (đề đọc + câu khen trong game) → game/audio/c-<hash>.mp3 + cau.json."""
import json
import pathlib
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

GAME = pathlib.Path(__file__).resolve().parent
AUDIO = GAME / "audio"
EDGE = "/home/ubuntu/venv-tts/bin/edge-tts"
VOICE = "en-US-AriaNeural"


def chuan(t: str) -> str:
    t = str(t).replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", t).strip().lower()


def fnv1a(s: str) -> str:
    h = 0x811C9DC5
    for b in chuan(s).encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


def doc(cau: str) -> tuple[str, bool]:
    out = AUDIO / ("c-" + fnv1a(cau) + ".mp3")
    if out.exists() and out.stat().st_size > 1500:
        return cau, True
    raw = pathlib.Path("/tmp") / ("ttsc-" + fnv1a(cau) + ".mp3")
    try:
        subprocess.run([EDGE, "--voice", VOICE, "--text", cau, "--write-media", str(raw)],
                       check=True, capture_output=True, timeout=60)
        if raw.stat().st_size < 1200:
            return cau, False
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
                        "-ac", "1", "-ar", "24000", "-b:a", "32k", str(out)],
                       check=True, timeout=40)
        raw.unlink(missing_ok=True)
        return cau, out.exists()
    except Exception as e:
        print("lỗi:", cau[:40], e)
        return cau, False


def main():
    cau = []
    for b in json.loads((GAME / "reading.json").read_text()):
        for s in b.get("sentences", []):
            cau.append(" ".join(s) if isinstance(s, list) else s)
    # câu khen / thông báo đọc trong game
    for f in list(GAME.glob("*.html")) + list((GAME / "games").glob("*.html")):
        txt = f.read_text(errors="ignore")
        for m in re.findall(r"speakWord\(\s*['\"]([^'\"]{4,120})['\"]", txt):
            cau.append(m)
    ds, seen = [], set()
    for c in cau:
        k = chuan(c)
        if not k or k in seen:
            continue
        seen.add(k)
        ds.append(c.strip())

    print("câu cần đọc:", len(ds))
    man, hong = {}, []
    with ThreadPoolExecutor(max_workers=4) as ex:
        for c, ok in ex.map(doc, ds):
            if ok:
                man[fnv1a(c)] = "c-" + fnv1a(c) + ".mp3"
            else:
                hong.append(c)
    (AUDIO / "cau.json").write_text(json.dumps(man, ensure_ascii=False, indent=0))
    tong = sum((AUDIO / v).stat().st_size for v in man.values())
    print("xong:", len(man), "câu,", round(tong / 1024 / 1024, 2), "MB | hỏng:", hong[:5])
    return 0 if not hong else 1


if __name__ == "__main__":
    sys.exit(main())
