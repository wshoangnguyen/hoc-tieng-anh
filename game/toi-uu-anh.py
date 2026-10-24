#!/usr/bin/env python3
"""Tối ưu ảnh thẻ từ vựng: JPG/PNG → WebP (cạnh dài ≤ 640px, q=78) + manifest.

- Giữ nguyên ảnh gốc trong game/pic/ (không xoá, để không vỡ trang cũ).
- Ảnh mới: game/pic/webp/<slug>.webp
- Manifest: game/pic/manifest.json  { "read a book": {"anh":"webp/read-a-book.webp","rong":640,"cao":480,"kb":24} }
Chạy lại bất cứ khi nào thêm ảnh:  python3 toi-uu-anh.py
"""
import json, pathlib, re, unicodedata
from PIL import Image

PIC = pathlib.Path.home()/"lop-hoc/repo-hoc-tieng-anh/game/pic"
OUT = PIC/"webp"; OUT.mkdir(exist_ok=True)
MAX = 640

def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

man, goc_kb, moi_kb, bo = {}, 0, 0, 0
for p in sorted(PIC.iterdir()):
    if p.suffix.lower() not in (".jpg", ".jpeg", ".png") or not p.is_file():
        continue
    khoa = p.stem.lower()
    goc_kb += p.stat().st_size/1024; bo += 1
    dich = OUT/(slug(khoa) + ".webp")
    try:
        im = Image.open(p)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            nen = Image.new("RGB", im.size, (255, 255, 255)); nen.paste(im, mask=im.split()[-1]); im = nen
        else:
            im = im.convert("RGB")
        im.thumbnail((MAX, MAX), Image.Resampling.LANCZOS)
        im.save(dich, "WEBP", quality=78, method=6)
    except Exception as e:
        print("lỗi:", p.name, e); continue
    moi_kb += dich.stat().st_size/1024
    man[khoa] = {"anh": "webp/"+dich.name, "rong": im.width, "cao": im.height, "kb": round(dich.stat().st_size/1024, 1)}

(PIC/"manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"ảnh: {bo} | gốc {goc_kb/1024:.1f} MB → webp {moi_kb/1024:.1f} MB "
      f"(giảm {100-100*moi_kb/goc_kb:.0f}%) | manifest {len(man)} mục")
