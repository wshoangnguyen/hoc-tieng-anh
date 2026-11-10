#!/usr/bin/env python3
"""Sinh trang tra cứu kho hình flashcard cho người và cho AI chatbot.

Đầu vào : game/pic/index.json (736 từ)
Đầu ra  : game/pic/tra-cuu/index.html        — trang chủ, tìm kiếm, liên kết theo chữ cái
          game/pic/tra-cuu/<chữ cái>.html    — mỗi trang ~30–80 dòng, nhẹ để AI đọc
          game/pic/tra-cuu/danh-sach.txt     — toàn bộ: từ | nghĩa | URL ảnh
"""
import json, html, unicodedata, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIC = ROOT / "game" / "pic"
OUT = PIC / "tra-cuu"
OUT.mkdir(parents=True, exist_ok=True)

data = json.loads((PIC / "index.json").read_text(encoding="utf-8"))
base = data["base"]
tu = data["tu"]

rows = []
for w, v in tu.items():
    u = v.get("u") or (base + w.replace(" ", "%20") + ".jpg")
    rows.append({
        "w": w,
        "vi": v.get("vi", ""),
        "sach": v.get("sach", ""),
        "unit": v.get("unit", ""),
        "u": u,
        "co": bool(v.get("co_anh", True)),
    })
rows.sort(key=lambda r: r["w"].lower())

def bucket(w):
    c = w[0].lower()
    c = unicodedata.normalize("NFD", c)[0]
    return c if c.isalpha() else "khac"

groups = {}
for r in rows:
    groups.setdefault(bucket(r["w"]), []).append(r)
order = sorted(groups, key=lambda c: (c == "khac", c))

CSS = """
:root{--ink:#1d1b16;--muted:#6b6459;--cream:#fbf7ee;--line:#e4dccb;--gold:#c8961e}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
 font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1080px;margin:0 auto;padding:20px 16px 64px}
h1{font-size:24px;margin:4px 0 6px}
p.lead{margin:0 0 18px;color:var(--muted);font-size:15px}
a{color:#7a5200}
input[type=search]{width:100%;padding:12px 14px;font-size:16px;border:1px solid var(--line);
 border-radius:10px;background:#fff;margin:0 0 18px}
.letters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
.letters a{padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;
 text-decoration:none;font-weight:600;color:var(--ink)}
.letters a:hover{border-color:var(--gold)}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
th{background:#f3ecdc;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
td img{width:64px;height:64px;object-fit:cover;border-radius:8px;background:#fff;border:1px solid var(--line)}
td.w{font-weight:700;font-size:17px}
td.u{font-size:12px;color:var(--muted);word-break:break-all;font-family:ui-monospace,monospace}
.hint{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:0 0 20px;font-size:14px}
.hint code{background:#f3ecdc;padding:1px 6px;border-radius:4px;font-size:13px}
footer{margin-top:28px;font-size:13px;color:var(--muted)}
@media(max-width:620px){td.u{display:none}td img{width:52px;height:52px}}
"""

def page(title, body, extra_head=""):
    return f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>{CSS}</style>{extra_head}</head>
<body><div class="wrap">
{body}
</div></body></html>"""

# ---- trang chủ
hint = """<div class="hint">
<b>Cách dùng cho AI:</b> mở đúng trang theo chữ cái đầu của từ, ví dụ từ <code>elephant</code> →
<a href="e.html">tra-cuu/e.html</a>. Mỗi dòng có sẵn URL ảnh đầy đủ, dùng nguyên văn, không tự đoán tên file.<br>
<b>Dữ liệu máy đọc:</b> <a href="danh-sach.txt">danh-sach.txt</a> (toàn bộ 736 từ, mỗi dòng
<code>từ | nghĩa | URL</code>) · <a href="../index.json">index.json</a> (bản gốc).
</div>"""

letters = "".join(
    f'<a href="{c}.html">{c.upper() if c != "khac" else "Khác"}</a>'
    for c in order
)

rows_html = []
for r in rows:
    img = f'<img src="{html.escape(r["u"])}" alt="{html.escape(r["w"])}" loading="lazy">' if r["co"] else ""
    meta = " · ".join(x for x in [r["sach"], f'U{r["unit"]}' if r["unit"] else ""] if x)
    rows_html.append(
        f'<tr data-w="{html.escape(r["w"]).lower()}"><td>{img}</td>'
        f'<td class="w">{html.escape(r["w"])}</td><td>{html.escape(r["vi"])}</td>'
        f'<td>{html.escape(meta)}</td><td class="u"><a href="{html.escape(r["u"])}">{html.escape(r["u"])}</a></td></tr>'
    )

body = f"""<h1>Kho hình flashcard</h1>
<p class="lead">{len(rows)} từ · ảnh nền trắng, một vật mỗi ảnh · cập nhật {html.escape(data.get("cap_nhat",""))}</p>
{hint}
<input type="search" id="q" placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…" autocomplete="off">
<div class="letters">{letters}</div>
<table id="t"><thead><tr><th>Ảnh</th><th>Từ</th><th>Nghĩa</th><th>Sách</th><th>URL ảnh</th></tr></thead>
<tbody>{''.join(rows_html)}</tbody></table>
<footer>Trang tĩnh, không cần đăng nhập. Ảnh ~224 px — dùng ở ô nhỏ hoặc in ≤5 cm.</footer>
<script>
const q=document.getElementById('q'),rows=[...document.querySelectorAll('#t tbody tr')];
q.addEventListener('input',()=>{{const s=q.value.trim().toLowerCase();
 rows.forEach(r=>{{r.style.display=!s||r.textContent.toLowerCase().includes(s)?'':'none';}});}});
</script>"""
(OUT / "index.html").write_text(page("Kho hình flashcard · tra cứu", body), encoding="utf-8")

# ---- trang theo chữ cái
for c in order:
    rs = groups[c]
    label = c.upper() if c != "khac" else "Khác"
    trs = []
    for r in rs:
        img = f'<img src="{html.escape(r["u"])}" alt="{html.escape(r["w"])}" loading="lazy">' if r["co"] else ""
        trs.append(
            f'<tr><td>{img}</td><td class="w">{html.escape(r["w"])}</td>'
            f'<td>{html.escape(r["vi"])}</td><td class="u"><a href="{html.escape(r["u"])}">{html.escape(r["u"])}</a></td></tr>'
        )
    b = f"""<p class="lead"><a href="index.html">← Toàn bộ kho</a> · {len(rs)} từ bắt đầu bằng “{label}”</p>
<h1>Kho hình — chữ {label}</h1>
<table><thead><tr><th>Ảnh</th><th>Từ</th><th>Nghĩa</th><th>URL ảnh</th></tr></thead>
<tbody>{''.join(trs)}</tbody></table>"""
    (OUT / f"{c}.html").write_text(page(f"Kho hình — {label}", b), encoding="utf-8")

# ---- danh sách phẳng
lines = ["# Kho hình flashcard hoctienganhdelam.com — từ | nghĩa | URL ảnh", "# dùng nguyên URL, không tự đoán tên file", ""]
for r in rows:
    lines.append(f'{r["w"]} | {r["vi"]} | {r["u"]}')
(OUT / "danh-sach.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

print(f"OK {len(rows)} từ · {len(order)} trang chữ cái · {sum(1 for r in rows if r['co'])} có ảnh")
print("thư mục:", OUT)
