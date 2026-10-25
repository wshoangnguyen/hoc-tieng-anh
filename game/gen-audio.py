#!/usr/bin/env python3
"""Sinh file mp3 phát âm cho toàn bộ từ vựng game, lưu vào game/audio/.

Chạy: python3 gen-audio.py
"""
import json
import pathlib
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

GAME = pathlib.Path(__file__).resolve().parent
AUDIO = GAME / "audio"
AUDIO.mkdir(exist_ok=True)
EDGE = "/home/ubuntu/venv-tts/bin/edge-tts"
VOICE = "en-US-AriaNeural"


def slug(w: str) -> str:
    s = w.lower().strip().replace("’", "'")
    s = re.sub(r"[^a-z0-9'\- ]+", "", s)
    s = re.sub(r"\s+", "-", s)
    return s.strip("-") or "x"


def doc_tu(w: str) -> tuple[str, bool]:
    out = AUDIO / (slug(w) + ".mp3")
    if out.exists() and out.stat().st_size > 1500:
        return w, True
    raw = pathlib.Path("/tmp") / ("tts-" + slug(w) + ".mp3")
    try:
        subprocess.run([EDGE, "--voice", VOICE, "--text", w, "--write-media", str(raw)],
                       check=True, capture_output=True, timeout=45)
        if raw.stat().st_size < 1200:
            return w, False
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
                        "-ac", "1", "-ar", "24000", "-b:a", "32k", str(out)],
                       check=True, timeout=40)
        raw.unlink(missing_ok=True)
        return w, out.exists()
    except Exception as e:
        print("lỗi", w, e)
        return w, False


def main():
    tu = [x["word"] for x in json.loads((GAME / "vocabulary.json").read_text())]
    # thêm từ xuất hiện trong đề đọc + số/đếm thường gặp
    them = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
            "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
            "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
            "eighty", "ninety", "one hundred", "red", "blue", "green", "yellow", "orange",
            "pink", "purple", "brown", "black", "white", "grey", "gray"]
    ds, seen = [], set()
    for w in tu + them:
        w = w.strip()
        if not w or w.lower() in seen:
            continue
        seen.add(w.lower())
        ds.append(w)

    print("cần đọc:", len(ds), "từ")
    ok, hong = {}, []
    with ThreadPoolExecutor(max_workers=4) as ex:
        for w, k in ex.map(doc_tu, ds):
            if k:
                ok[slug(w)] = slug(w) + ".mp3"
            else:
                hong.append(w)
    (AUDIO / "manifest.json").write_text(json.dumps(ok, ensure_ascii=False, indent=0))
    tong = sum((AUDIO / v).stat().st_size for v in ok.values())
    print("xong:", len(ok), "tệp,", round(tong / 1024 / 1024, 2), "MB | hỏng:", hong[:10])
    return 0 if not hong else 1


if __name__ == "__main__":
    sys.exit(main())
