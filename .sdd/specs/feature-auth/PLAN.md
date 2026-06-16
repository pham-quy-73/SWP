# KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (PLAN.md)
# Khung kiến trúc: Node.js + Express + Mongoose + React (Tailwind CSS)

## 1. ARCHITECTURAL APPROACH
* **Backend Isolation Layer:** Áp dụng nguyên tắc thiết kế `Controller → Service → Model`. Logic kiểm tra tính toàn vẹn của dữ liệu đầu vào sử dụng thư viện `Joi` ở tầng Middleware trước khi đi vào Controller.
* **Asynchronous Mail Pipeline:** Tiến trình gửi email qua `Nodemailer` sẽ được bọc trong một khối thực thi bất đồng bộ độc lập (không sử dụng `await` ở luồng chính của API `/register`) nhằm đảm bảo thời gian phản hồi cho client < 300ms.
* **Frontend Component Separation:** Tuân thủ cấu trúc `Pages → Hooks → Services → Axios`. Biến các Form UI thành Presentational Components (chỉ nhận props và hiển thị), chuyển toàn bộ logic xử lý form, quản lý trạng thái loading và validation sang cho Custom Hooks đảm nhận.

## 2. COMPONENTS
* **`User.js` (Mongoose Model):** Quản lý định nghĩa Schema cấu trúc dữ liệu, tích hợp Pre-save hook để tự động hóa việc băm mật khẩu bằng `bcrypt`.
* **`MailService.js`:** Cấu hình Transporter kết nối với hệ thống SMTP và biên dịch HTML template cho thư kích hoạt.
* **`AuthService.js`:** Chứa lõi nghiệp vụ logic (`register`, `login`, `verifyEmail`, `googleLogin`).
* **`AuthController.js` & `auth.routes.js`:** Điều phối dữ liệu, validate schema đầu vào bằng `Joi` và phân tuyến endpoint.
* **`AuthLayout.jsx`:** Layout bọc ngoài hiển thị khung nền đồng bộ cho cả trang Login và Register.
* **`LoginForm.jsx` & `RegisterForm.jsx`:** Giao diện nhập liệu chi tiết tích hợp Tailwind CSS và trạng thái disabled/loading.

## 3. DATA FLOW
* **Luồng đăng ký & Kích hoạt:**
  Customer điền Form -> Click Đăng ký -> API Backend validate -> Lưu DB (is_email_verified = false) -> Kích hoạt tiến trình ngầm gửi Mail kích hoạt -> API trả về HTTP 201 cho Client hiển thị thông báo check hòm thư.
* **Luồng click Link từ Email:**
  User click link -> Gọi API GET của Backend -> Backend check token hợp lệ -> Đổi trạng thái User thành true -> Backend gọi `res.redirect()` điều hướng trình duyệt của User quay về trang Frontend (`/login?verified=true`).

## 4. DEPENDENCIES
1. Cài đặt các thư viện cần thiết cho Backend: `bcrypt`, `jsonwebtoken`, `joi`, `nodemailer`, `google-auth-library`.
2. Khai báo các cấu hình placeholder trong tệp `.env` (`JWT_SECRET`, `SMTP_USER`, `SMTP_PASS`, `GOOGLE_CLIENT_ID`).
3. Viết mã nguồn theo thứ tự: Bảng mẫu dữ liệu (Model) -> Dịch vụ lõi (Services) -> Bộ điều phối (Controllers) -> Giao diện (Frontend Hooks & Forms).

## 5. RISKS & MITIGATIONS
* **Risk (Email Delivery Failure):** Cấu hình SMTP gặp sự cố hoặc kết nối mạng bị gián đoạn khiến email kích hoạt không gửi đi được nhưng tài khoản vẫn được tạo trong DB, dẫn đến việc tài khoản bị treo vĩnh viễn.
  * **Mitigation:** Bọc hàm gửi mail của `MailService` trong khối `try/catch`. Nếu phát sinh lỗi gửi mail, hệ thống sẽ tự động log lại chi tiết bằng `winston` nhưng vẫn trả về mã thành công cho người dùng, đồng thời lưu vết để hỗ trợ tính năng gửi lại mail sau này.

## 6. QUESTIONS FOR HUMAN
* Định dạng link kích hoạt gửi trong email cho môi trường Local Development sẽ được cấu hình cố định là `http://localhost:8080/api/auth/verify-email?token=...` đúng không?