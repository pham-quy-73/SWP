# PHÂN RÃ TÁC VỤ (TASKS.md) - FEATURE AUTH
# Tổng số tác vụ: 8 | Tổng thời gian ước tính: ~25 Giờ

> **Quy tắc thực thi chuẩn SDD:** Mọi tác vụ phải mang tính chất nguyên tử, hoạt động độc lập, thời gian thực hiện tối đa không quá 4 giờ, và có Unit Test/Integration Test đi kèm để nghiệm thu.

| ID | Tên Tác Vụ Kỹ Thuật | File(s) ảnh hưởng dự kiến | Thời gian | Cần xong trước | Tiêu chí hoàn thành (DoD) |
|---|---|---|---|---|---|
| **T01** | Khởi tạo cấu trúc Mongoose Model User | `backend/src/models/User.js` | 3 giờ | Không | Định nghĩa đầy đủ các trường dữ liệu (first_name, last_name, dob, avatar_url...). Viết thành công `pre('save')` hook băm mật khẩu bằng `bcrypt`. Có index cho username/email. |
| **T02** | Xây dựng MailService phát hỏa thư điện tử | `backend/src/services/MailService.js` | 3 giờ | Không | Cấu hình thành công Nodemailer với cấu trúc SMTP. Viết hàm `sendActivationEmail` sinh mã HTML chứa URL kích hoạt động. |
| **T03** | Triển khai AuthService luồng Đăng ký & Kích hoạt | `backend/src/services/AuthService.js` | 4 giờ | T01, T02 | Viết hàm `register` sinh chuỗi crypto token ngẫu nhiên, lưu DB trạng thái chưa kích hoạt. Viết hàm `verifyEmail` xử lý check hạn và kích hoạt tài khoản. |
| **T04** | Triển khai AuthService luồng Đăng nhập hệ thống | `backend/src/services/AuthService.js` | 3 giờ | T01 | Viết hàm `login` so sánh mật khẩu qua `bcrypt.compare`. Chặn đăng nhập nếu `is_email_verified === false` hoặc `deleted_at !== null`. Sinh khóa JWT Token. |
| **T05** | Tích hợp Google OAuth2 Server-side Validation | `backend/src/services/AuthService.js` | 4 giờ | T04 | Cài đặt `google-auth-library`. Viết hàm `googleLogin` tiếp nhận `idToken`, xác thực trực tiếp với Google, tự động tạo tài khoản hoặc trả mã JWT nếu đã tồn tại. |
| **T06** | Hoàn thiện API Controller & Joi Validation Layer | `backend/src/controllers/AuthController.js`, `routes/` | 3 giờ | T03, T04, T05 | Tạo middleware validate bằng Joi. Viết các endpoint `/register`, `/login`, `/verify-email`, `/google`. Xử lý lỗi tập trung qua `next(error)`. |
| **T07** | Phát triển Frontend Layout & Pages | `frontend/src/components/layout/AuthLayout.jsx`, `pages/` | 2 giờ | Không | Xây dựng thành công `AuthLayout` dùng chung. Khởi tạo `LoginPage.jsx` và `RegisterPage.jsx` để bọc các form giao diện. |
| **T08** | Phát triển Giao diện LoginForm & Hook | `frontend/src/features/auth/components/LoginForm.jsx`, `hooks/` | 3 giờ | T06, T07 | Tạo Custom Hook `useLoginForm` quản lý state bằng `react-hook-form`. Tạo component `LoginForm` có đầy đủ UI bôi đỏ khi lỗi và các nút tiện ích Autofill (Dev Mode). |