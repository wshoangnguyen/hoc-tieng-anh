# 🦉 Hướng dẫn Deploy Chatbot cho hoctienganhdelam.com

Harvey không cần biết code — chỉ cần làm theo từng bước dưới đây.
Mất khoảng 15 phút để hoàn thành.

---

## 📋 Trước khi bắt đầu, cần chuẩn bị:

1. ✅ Đã có tài khoản GitHub (wshoangnguyen)
2. ✅ Web hoctienganhdelam.com đã chạy trên GitHub Pages
3. ⏳ Cần tạo tài khoản Render (miễn phí)

---

## BƯỚC 1: Tạo tài khoản Render (MIỄN PHÍ)

1. Vào https://render.com
2. Click "Get Started" hoặc "Sign Up"
3. Chọn **"Sign in with GitHub"** (dùng tài khoản wshoangnguyen)
4. Cho phép Render truy cập GitHub của bạn
5. Vào Dashboard, bạn sẽ thấy màn hình trống — OK!

---

## BƯỚC 2: Tạo Web Service trên Render

1. Trên Dashboard Render, click nút **"New +"** → chọn **"Web Service"**
2. Render sẽ hỏi bạn kết nối GitHub repo.
3. Tìm repo **"wshoangnguyen/hoc-tieng-anh"** → click **Connect**
4. Điền thông tin:
   - **Name**: `english-owl-chatbot` (hoặc tên gì bạn thích)
   - **Runtime**: Node (tự động nhận)
   - **Build Command**: `npm install` (Render tự điền)
   - **Start Command**: `cd chatbot && npm start`
   - **Root Directory**: để trống
   - **Instance Type**: Chọn **"Free"**
5. Kéo xuống phần **Environment Variables**, thêm:

   | Key | Value |
   |---|---|
   | `API_KEY` | *(Harvey nhập API key của DeepSeek vào đây)* |

6. Click **"Create Web Service"**
7. Đợi 3-5 phút cho Render build và deploy.
8. Khi thấy chữ **"Live"** màu xanh → thành công!
9. Ghi lại URL của bạn, ví dụ: `https://english-owl-chatbot.onrender.com`

---

## BƯỚC 3: Cập nhật file chat.html

1. Mở file `chat.html` trong repo
2. Tìm dòng:
   ```js
   const BACKEND_URL = 'https://YOUR-RENDER-APP.onrender.com/chat';
   ```
3. Thay `YOUR-RENDER-APP` bằng tên app Render của bạn
4. Save và commit lên GitHub

---

## BƯỚC 4: Kiểm tra

1. Vào https://hoctienganhdelam.com/chat.html
2. Gõ câu hỏi tiếng Anh bất kỳ
3. Nếu Thầy Cú trả lời → thành công! 🎉

---

## 🔧 Cách chỉnh sửa cách chatbot dạy sau này

Mở file `chatbot/server.js`, tìm dòng `SYSTEM_PROMPT`, sửa nội dung theo ý bạn.
Ví dụ:
- Muốn chatbot nghiêm khắc hơn → sửa "Warm, encouraging"
- Muốn chatbot không dùng tiếng Việt → xóa dòng "Use simple English mixed with Vietnamese"
- Muốn thêm nội dung bài học → thêm vào sau dòng "LESSON CONTEXT FROM TEACHER"

Sau khi sửa, commit lên GitHub → Render tự động deploy lại trong 2-3 phút.

---

## ❓ Hỏi đáp nhanh

**Q: Học sinh có chat miễn phí không?**
A: Có. Render Free cho 750 giờ/tháng (~25 giờ chat/ngày). DeepSeek API rất rẻ (~30đ/100 câu).

**Q: Có giới hạn gì không?**
A: Render Free sẽ "ngủ" sau 15 phút không dùng. Lần đầu vào sẽ mất 30-50 giây để "thức dậy". Nếu muốn nhanh hơn, nâng cấp lên gói $7/tháng.

**Q: Làm sao xem học sinh chat gì?**
A: Vào Render Dashboard → chọn app → tab "Logs". Tất cả câu hỏi đều hiện ở đó.

**Q: Muốn thêm API key ở đâu?**
A: Nếu chưa có DeepSeek API key, vào https://platform.deepseek.com → đăng ký → tạo API key (nạp 50.000đ dùng cả năm).
