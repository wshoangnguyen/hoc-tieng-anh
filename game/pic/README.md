# Kho hình flashcard

732 ảnh cho 734 từ vựng Super Minds 1–6 (ảnh AI vẽ, dùng tự do).
Cập nhật: 2026-11-09

## Cách lấy ảnh cho một từ

1. Đọc `https://hoctienganhdelam.com/game/pic/index.json` (hoặc file `index.json` cùng thư mục).
2. Tìm từ trong object `tu` (khoá là từ tiếng Anh viết thường).
3. Dùng đúng trường `u` — đó là link ảnh chèn thẳng vào slide.

Ví dụ: `tu["apple"].u` = https://hoctienganhdelam.com/game/pic/apple.jpg

## Quy tắc

- Tên file = từ tiếng Anh viết thường + đuôi ảnh, giữ dấu cách
  (ví dụ `a cup of coffee.jpg`); nếu tự ghép URL thì phải mã hoá dấu cách thành `%20`.
- `co_anh: false` nghĩa là từ đó **chưa có ảnh** — báo lại cho giáo viên, không tự lấy ảnh ngoài.
- Ảnh 512×512, nền trắng, phù hợp thẻ từ vựng và slide.
- Danh sách `anh_le` là ảnh có trong kho nhưng không nằm trong bộ từ của 6 sách.

## Thiếu ảnh hiện tại

after, before.
