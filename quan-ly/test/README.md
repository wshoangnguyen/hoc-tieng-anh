# Bộ kiểm tra tự động — web quản lý lớp

Chạy sau mỗi lần sửa `quan-ly/index.html`:

```bash
cd quan-ly && bash test/chay.sh
```

- In ra từng mục **PASS**/**FAIL**; thoát mã 0 nếu đạt hết, 1 nếu có mục lỗi.
- Cần `google-chrome` (hoặc đặt biến `CHROME=/đường/dẫn/chrome`) và `python3`.

## Đang kiểm những gì (40 mục)

1. **Điểm danh** — học sinh nghỉ/bảo lưu không lọt vào danh sách lớp, ghi/đọc/xoá điểm danh.
2. **Học phí** — nợ 1 tháng, đã đóng đủ, tổng nợ chỉ tính em đang học.
3. **Lưu trữ** — sĩ số, mục lưu trữ có em nghỉ/bảo lưu và không có em đang học, đưa lại lớp.
4. **Đặt sách** — ghi nhận/ bỏ ghi nhận, ngày đặt.
5. **Ngày thi** — đọc ngày, danh sách lớp sắp thi, xác nhận thi xong thì thôi nhắc.
6. **Đồng bộ nhiều máy** — gộp 3 chiều: giữ bản máy này khi trùng, gộp đủ khi hai máy sửa chỗ khác nhau, báo đúng chỗ xung đột.
7. **Nhật ký thao tác** — ghi đúng người/việc/nội dung, giới hạn 1000 mục, hộp nhật ký hiện và lọc được.
8. **Toàn vẹn dữ liệu** — dữ liệu lưu được thành JSON.

## Thêm mục mới

Mở `test/kiem-tra.html`, thêm vào `chayHet()`:

```js
ok("tên mục", điều_kiện_đúng_sai, "chi tiết khi sai");
bang("tên mục", giá_trị_thực, giá_trị_mong_đợi);
```

Muốn gọi hàm trong ứng dụng thì thêm tên hàm vào danh sách `window.__T` ở đầu khối `sc.textContent`.
