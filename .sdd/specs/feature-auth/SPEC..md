# Đặc tả Hệ thống Xác thực (Auth Spec)
# Version: 1.0.0 | Status: APPROVED | Risk: Cao | Level: Formal

## 1. Context & Goal
Số hóa quy trình đăng ký, kích hoạt email, đăng nhập truyền thống và đăng nhập một chạm với Google. Đảm bảo dữ liệu khớp nối 100% với các trường dữ liệu trên UI Form và kiểm soát chặt chẽ trạng thái kích hoạt của tài khoản.

## 2. Actors & Roles
* **GUEST:** Người dùng vãng lai, được phép Đăng ký, Đăng nhập, và Xác thực Email.
* **SYSTEM:** Tiếp nhận payload, kiểm tra ràng buộc logic, gửi mail kích hoạt, xác thực Google ID Token và cấp phát JWT.

## 3. Functional Requirements (EARS Notation)
### 3.1 Ubiquitous (Luôn luôn đúng)
* THE system SHALL tự động chuyển đổi `email` và `username` về định dạng chữ thường (lowercase) và loại bỏ khoảng trắng thừa (trim) trước khi kiểm tra sự tồn tại hoặc lưu trữ vào MongoDB.

### 3.2 Event-driven (Phản ứng với sự kiện)
* WHEN nhận request `POST /api/auth/register`, THE system SHALL yêu cầu bắt buộc có `password`. Hệ thống SHALL lưu user với trạng thái `is_email_verified = false`, tạo một `verify_token` ngẫu nhiên có thời hạn 15 phút, kích hoạt tiến trình ngầm gửi mail kích hoạt và trả về HTTP 201.
* WHEN nhận request `GET /api/auth/verify-email?token=...`, THE system SHALL đối chiếu mã token. Nếu hợp lệ và còn hạn, hệ thống SHALL cập nhật `is_email_verified = true`, xóa token cũ và thực hiện `res.redirect()` về trang Login của Frontend.
* WHEN nhận request `POST /api/auth/google`, THE system SHALL sử dụng `google-auth-library` để verify `idToken` từ client. Nếu email chưa tồn tại, hệ thống SHALL tự động tạo tài khoản mới với `is_email_verified = true` (bỏ qua mật khẩu).
* WHEN nhận request `POST /api/auth/login`, THE system SHALL kiểm tra tính hợp lệ của thông tin đăng nhập thông qua cơ chế so sánh chuỗi băm của `bcrypt`.

### 3.3 State-driven (Hành vi liên tục trong trạng thái)
* WHILE trường `is_email_verified` của một User bằng `false`, THE system SHALL từ chối cấp phát mã JWT khi người dùng gọi API đăng nhập truyền thống và trả về lỗi HTTP 403 Forbidden.
* WHILE trường `deleted_at` của User khác `null` (tài khoản bị khóa), THE system SHALL chặn đứng mọi request đăng nhập và trả về HTTP 403.

## 4. Non-functional Requirements
* **UI/UX Standard:** Nút bấm Submit phải hiển thị trạng thái Loading (Spinner) và bị vô hiệu hóa (disabled) khi API đang xử lý để tránh lỗi double-request.
* **Dev Mode Feature:** Form đăng nhập phải tích hợp các nút tiện ích tự động điền (Autofill) tài khoản thử nghiệm dành riêng cho môi trường Development (Admin, Manager, Customer) để tăng tốc độ kiểm thử.

## 5. Data Model (MongoDB Schema)
Collection `users`:
* `username`: String, Unique, Required, Lowercase.
* `password`: String, Optional (Chỉ bắt buộc đối với luồng đăng ký thường, lưu chuỗi đã băm).
* `email`: String, Unique, Required, Lowercase.
* `first_name`: String, Required.
* `last_name`: String, Required.
* `phone`: String, Optional (Chỉ bắt buộc tại luồng Checkout).
* `dob`: Date, Optional (Ngày sinh của khách hàng).
* `avatar_url`: String, Default Null (Đường dẫn ảnh đại diện của khách).
* `google_id`: String, Unique, Sparse (Lưu ID định danh từ Google).
* `is_email_verified`: Boolean, Default: false.
* `verify_token`: String, Optional.
* `verify_token_expires`: Date, Optional.
* `role`: Enum `['CUSTOMER', 'SALE', 'ADMIN']`, Default: `CUSTOMER`.
* `deleted_at`: Date, Default: null.

## 6. Error Handling (Unwanted Patterns)
* WHERE dữ liệu đầu vào không đúng định dạng (email sai cú pháp, password < 6 ký tự), THE system SHALL trả về lỗi HTTP 400 Bad Request ngay tại tầng Middleware.
* WHERE user nhập sai thông tin đăng nhập, THE system SHALL trả về HTTP 401 Unauthorized kèm thông báo chung "Tên đăng nhập hoặc mật khẩu không chính xác" (Không chỉ rõ trường nào sai để bảo mật).
* WHERE link xác thực email (`verify_token`) bị quá hạn hoặc không khớp, THE system SHALL trả về HTTP 400 "Mã kích hoạt không hợp lệ hoặc đã hết hạn".

## 7. Acceptance Criteria
* [ ] Đăng ký tài khoản thường sinh ra bản ghi lưu trong DB với trạng thái chưa kích hoạt email.
* [ ] Gửi thành công email chứa đường dẫn URL xác thực dạng chuỗi ký tự ngẫu nhiên.
* [ ] Chặn đăng nhập thành công đối với tài khoản chưa kích hoạt email (Trả về mã 403).
* [ ] Đăng nhập Google tự động kích hoạt tài khoản mà không cần nhập mật khẩu.

## 8. Out of Scope
* KHÔNG thực hiện luồng khôi phục mật khẩu (Forgot Password qua mã OTP) trong phân rã tính năng này.