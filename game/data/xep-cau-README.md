# Máy xếp câu — cách nạp dữ liệu bài

Trang: `game/xep-cau.html` · Dữ liệu: `game/data/xep-cau.json`

## Cấu trúc một câu

```json
{
  "id": "sm4-u3-c1",
  "nghia": "Cô ấy ăn sáng lúc 6 giờ kém 15.",
  "chu": "She",
  "cot": [
    { "ten": "Động từ", "o": [
      { "t": "has breakfast", "ok": true },
      { "t": "have breakfast", "sai": "She đi với has, không phải have." }
    ]},
    { "ten": "Giới từ", "o": [
      { "t": "at", "ok": true },
      { "t": "in", "sai": "in dùng cho buổi/tháng, không dùng cho giờ." }
    ]},
    { "ten": "Thời gian", "o": [
      { "t": "quarter to six", "ok": true },
      { "t": "Monday", "sai": "Câu này nói về giờ, không phải thứ." }
    ]}
  ]
}
```

## Luật viết dữ liệu (quan trọng)

1. **Mỗi cột đúng 1 ô `ok:true`.** Ô còn lại bắt buộc có `sai` — đó là câu giải thích hiện cho học sinh.
2. **Ô sai phải sai độc lập được**: sai ngữ pháp (have/she), sai giới từ (in giờ), hoặc sai nghĩa so với `nghia`. Đừng để hai ô cùng đúng — máy chỉ chấm theo `ok`.
3. Thứ tự cột = thứ tự ghép câu: `chu` + cột 1 + cột 2 + cột 3. Với câu có trạng từ tần suất, đặt cột **Trạng từ** trước cột **Động từ** (`You | always | play tennis | after school`).
4. `nghia` là tiếng Việt, hiện ngay trên câu — nhờ nó mà ô sai nghĩa mới chấm được công bằng.
5. Đáp án được **xáo trộn mỗi lượt**, không cần tự đổi vị trí.

## Bộ dữ liệu đang có

| Bộ | Số câu | Nguồn |
|---|---|---|
| Mẫu 1 · Hiện tại đơn + giờ + thứ | 6 | viết tay theo hoạt động trong sách |
| SM1…SM6 · kho câu cũ | 10 · 8 · 9 · 6 · 8 · 3 | chuyển từ `sentences.txt` của game Xếp thành câu |
| Open world A2 · kho câu cũ | 11 | như trên |

Chuyển tự động: tách câu thành **chủ ngữ | động từ | phần cuối** (chỉ lấy câu có cụm `at/on/in/after/before/every`), rồi lấy 2 cụm từ **câu khác cùng sách** làm phương án nhiễu — nhờ câu tiếng Việt hiện trên đầu nên phương án nhiễu luôn sai nghĩa.

## Đếm giờ

Mặc định 30 giây/câu. Đổi bằng `?tg=45` trên đường dẫn (5–120 giây), ví dụ `xep-cau.html?tg=45`.
10 giây cuối: thanh chuyển vàng, có tiếng tích tắc dồn dập; 5 giây cuối đỏ + rung.

## Thêm một bộ bài

Thêm vào mảng `"bo"`:

```json
{ "id": "sm4-u3", "ten": "SM4 · Unit 3 · Giờ & thứ", "sach": "SM4", "unit": 3, "cau": [ ... ] }
```

Hiện game dùng `bo[0]`. Khi có nhiều bộ, sửa `state.bo = d.bo[0]` thành chọn theo `GAME.bai()` (sách + unit học sinh đang học) để tự khớp như các game khác.

## Hai chế độ

- **Ở nhà**: tính điểm đúng/sai, ghi điểm theo mã HV qua `GAME.ghi` / `GAME.ketThuc`, cuối bài hiện sao.
- **Trên lớp**: 2 đội Xanh/Đỏ, sai thì đội kia được "cướp điểm", cuối ván hiện đội thắng. Chế độ này **không cộng điểm** vào phiếu học viên.
