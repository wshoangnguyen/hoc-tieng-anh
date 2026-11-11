#!/usr/bin/env python3
"""Dựng file HTML hoạt động 'Đi tìm đồ vật' cho lớp 1 (Unit 9 + ôn Unit 1–8).

- Ảnh lấy từ kho flashcard của trường (nhúng base64 để file chạy được cả khi mất mạng).
- Từ kho không có (lock, pot, mop) vẽ bằng SVG.
- Kiểm số lượng: số đồ vật trong phòng phải khớp đáp án.
"""
import base64, json, pathlib, re, sys

ROOT = pathlib.Path("/home/ubuntu/lop-hoc/repo-hoc-tieng-anh")
PIC = ROOT / "game" / "pic"
OUT = ROOT / "game" / "unit9-tim-do-vat.html"

idx = json.loads((PIC / "index.json").read_text(encoding="utf-8"))["tu"]

def img64(word):
    """Ảnh kho → tách nền trắng (flood fill từ 4 góc) → PNG trong suốt, cạnh 200px."""
    from PIL import Image, ImageDraw
    import io
    e = idx.get(word)
    if not e or not e.get("co_anh"):
        sys.exit(f"thiếu ảnh kho: {word}")
    p = PIC / e["f"]
    if not p.exists():
        sys.exit(f"thiếu file: {p}")
    im = Image.open(p).convert("RGBA")
    rgb = im.convert("RGB")
    w, h = rgb.size
    KEY = (255, 0, 255)
    for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if sum(rgb.getpixel(pt)) > 690:          # gần trắng mới xoá
            ImageDraw.floodfill(rgb, pt, KEY, thresh=34)
    px = rgb.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    src = im.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] != KEY:
                out.putpixel((x, y), src[x, y])
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.thumbnail((200, 200), Image.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

SVG = {
"lock": """<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path d="M32 46V30a18 18 0 0136 0v16" fill="none" stroke="#8a5f12" stroke-width="8" stroke-linecap="round"/>
<rect x="16" y="44" width="68" height="48" rx="10" fill="#e0ac2f" stroke="#8a5f12" stroke-width="5"/>
<circle cx="50" cy="64" r="7" fill="#6b4a0e"/><rect x="46" y="66" width="8" height="14" rx="3" fill="#6b4a0e"/></svg>""",
"pot": """<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect x="10" y="28" width="12" height="12" rx="5" fill="#a83228"/><rect x="78" y="28" width="12" height="12" rx="5" fill="#a83228"/>
<path d="M18 36h64l-6 46a10 10 0 01-10 8H34a10 10 0 01-10-8z" fill="#d64535" stroke="#8f2a1f" stroke-width="4"/>
<rect x="14" y="26" width="72" height="10" rx="5" fill="#8f2a1f"/></svg>""",
"mop": """<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<rect x="45" y="6" width="10" height="54" rx="5" fill="#b07c42" stroke="#6d4620" stroke-width="3"/>
<path d="M26 58h48l-6 12H32z" fill="#93aab7" stroke="#5c707a" stroke-width="3"/>
<g stroke="#93aab7" stroke-width="7" stroke-linecap="round">
<path d="M33 71v15"/><path d="M41 71v19"/><path d="M50 71v21"/><path d="M59 71v19"/><path d="M67 71v15"/></g></svg>""",
"flower": """<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path d="M50 58v34" stroke="#4f8a3a" stroke-width="6" stroke-linecap="round"/>
<path d="M50 74c-12 0-18-8-18-8s14-4 18 8z" fill="#5aa34a"/>
<g fill="#f2789f" stroke="#c94a72" stroke-width="3">
<circle cx="50" cy="26" r="11"/><circle cx="30" cy="42" r="11"/><circle cx="70" cy="42" r="11"/>
<circle cx="38" cy="60" r="11"/><circle cx="62" cy="60" r="11"/></g>
<circle cx="50" cy="44" r="9" fill="#f7c948" stroke="#d8a01e" stroke-width="3"/></svg>""",
}

DATA = {
 # x,y: tâm đồ vật (% khung) · h: chiều cao (% chiều cao khung) · r: xoay độ
 "garden": {
   "title": "Garden", "emoji": "🌳",
   "bg": "linear-gradient(#bfe4f7 0 44%, #9ec97c 44% 100%)",
   "objs": [
     {"k":"tree","x":18,"y":32,"h":40,"r":-2},
     {"k":"tree","x":50,"y":26,"h":34,"r":2},
     {"k":"tree","x":82,"y":32,"h":44,"r":-3},
     {"k":"duck","x":26,"y":70,"h":17,"r":-4},
     {"k":"duck","x":36,"y":78,"h":15,"r":3},
     {"k":"duck","x":64,"y":72,"h":17,"r":-2},
     {"k":"ball","x":13,"y":54,"h":11,"r":0},
     {"k":"ball","x":88,"y":56,"h":11,"r":0},
     {"k":"flower","x":30,"y":60,"h":10,"r":0},
     {"k":"flower","x":42,"y":56,"h":10,"r":0},
     {"k":"flower","x":58,"y":60,"h":10,"r":0},
     {"k":"flower","x":70,"y":56,"h":10,"r":0},
     {"k":"hat","x":84,"y":74,"h":14,"r":-8},
   ],
   "qs": [("tree","trees"),("duck","ducks"),("ball","balls"),("flower","flowers")],
 },
 "house": {
   "title": "House", "emoji": "🏠",
   "bg": "linear-gradient(#f6e5cb 0 72%, #c8a179 72% 100%)",
   "objs": [
     {"k":"clock","x":20,"y":24,"h":14,"r":0},
     {"k":"clock","x":54,"y":18,"h":14,"r":0},
     {"k":"clock","x":86,"y":26,"h":13,"r":0},
     {"k":"window","x":10,"y":48,"h":22,"r":0},
     {"k":"window","x":76,"y":50,"h":21,"r":0},
     {"k":"door","x":45,"y":54,"h":32,"r":0},
     {"k":"lock","x":33,"y":40,"h":11,"r":-6},
     {"k":"lock","x":92,"y":48,"h":11,"r":6},
     {"k":"pot","x":14,"y":70,"h":13,"r":0},
     {"k":"pot","x":80,"y":72,"h":13,"r":0},
     {"k":"pot","x":58,"y":74,"h":12,"r":0},
     {"k":"mop","x":93,"y":80,"h":15,"r":0},
     {"k":"bed","x":24,"y":82,"h":22,"r":0},
     {"k":"chair","x":64,"y":80,"h":16,"r":0},
     {"k":"cake","x":46,"y":84,"h":12,"r":0},
   ],
   "qs": [("clock","clocks"),("lock","locks"),("pot","pots"),("mop","mops")],
 },
 "school": {
   "title": "School", "emoji": "🏫",
   "bg": "linear-gradient(#eaf1f6 0 74%, #cdd7dc 74% 100%)",
   "objs": [
     {"k":"clock","x":88,"y":20,"h":13,"r":0},
     {"k":"box","x":8,"y":46,"h":14,"r":-4},
     {"k":"box","x":72,"y":48,"h":14,"r":5},
     {"k":"book","x":16,"y":68,"h":13,"r":-6},
     {"k":"book","x":26,"y":74,"h":13,"r":4},
     {"k":"book","x":36,"y":68,"h":13,"r":-3},
     {"k":"book","x":46,"y":74,"h":13,"r":6},
     {"k":"pen","x":60,"y":62,"h":14,"r":-10},
     {"k":"pen","x":68,"y":68,"h":14,"r":8},
     {"k":"pen","x":76,"y":62,"h":14,"r":-6},
     {"k":"pencil","x":85,"y":70,"h":12,"r":12},
     {"k":"pencil","x":20,"y":54,"h":12,"r":-14},
     {"k":"ball","x":9,"y":84,"h":11,"r":0},
     {"k":"ball","x":90,"y":84,"h":11,"r":0},
     {"k":"bike","x":50,"y":84,"h":17,"r":0},
     {"k":"ruler","x":38,"y":56,"h":12,"r":-2},
   ],
   "qs": [("book","books"),("pen","pens"),("ball","balls"),("clock","clocks")],
 },
}

WORDNUM = {1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight"}

# kiểm số lượng khớp đáp án
built = {}
for pid, p in DATA.items():
    counts = {}
    for o in p["objs"]:
        counts[o["k"]] = counts.get(o["k"], 0) + 1
    qs = []
    for k, plural in p["qs"]:
        n = counts.get(k, 0)
        assert 1 <= n <= 8, f"{pid}/{k} có {n} hình"
        qs.append({"k": k, "n": n, "ans": WORDNUM[n], "text": f"How many {plural}?"})
    built[pid] = {"title": p["title"], "emoji": p["emoji"], "bg": p["bg"], "objs": p["objs"], "qs": qs}

keys = set()
for p in DATA.values():
    for o in p["objs"]:
        keys.add(o["k"])
keys |= {"garden", "house", "school"}   # ảnh bìa cho màn hình chọn nơi
imgs = {k: img64(k) for k in sorted(keys) if k not in SVG}
svgs = {k: SVG[k] for k in sorted(keys) if k in SVG}

TPL = pathlib.Path(__file__).with_name("unit9-template.html").read_text(encoding="utf-8")
html = (TPL
        .replace("__DATA__", json.dumps(built, ensure_ascii=False))
        .replace("__IMAGES__", json.dumps(imgs))
        .replace("__SVGS__", json.dumps(svgs)))
OUT.write_text(html, encoding="utf-8")
print(f"OK {OUT} · {OUT.stat().st_size/1024:.0f} KB · {len(imgs)} ảnh kho · {len(svgs)} SVG")
for pid, p in built.items():
    print(pid, "·", ", ".join(f'{q["text"]} {q["n"]}' for q in p["qs"]))
