# CONTEXT.md - Module Xác Thực & Định Danh (Authentication)
# Tech Stack: Node.js + Express + MongoDB (Mongoose) + React (Vite)
# Người lập: @Doan-Bao-Long | Ngày: 2026-06-13

## 1. PROBLEM STATEMENT
Hệ thống Optics Management (bản thu nhỏ) yêu cầu một cơ chế định danh và phân quyền an toàn cho 3 vai trò: CUSTOMER, SALE, và ADMIN. Hệ thống cần vận hành một luồng Đăng ký nghiêm ngặt cho Khách hàng (yêu cầu kích hoạt qua Email để tránh tài khoản ảo) và một luồng Đăng nhập hợp nhất (hỗ trợ cả tài khoản hệ thống lẫn tài khoản Google OAuth2). Hệ thống sử dụng JSON Web Token (JWT) cho mục đích xác thực Stateless.

## 2. DOMAIN KNOWLEDGE & CONSTRAINTS
* **Bảo mật mật khẩu (SEC-01):** Bắt buộc sử dụng `bcrypt` với cost factor ≥ 10 để băm mật khẩu trước khi lưu. Tuyệt đối không lưu plaintext.
* **Bảo mật Bí mật (SEC-02):** Khóa bí mật ký JWT (`JWT_SECRET`) và thông tin cổng Google OAuth2 phải được nạp hoàn toàn từ biến môi trường `.env`.
* **Quản lý Vòng đời Tài khoản (DATA-01):** Hệ thống áp dụng cơ chế Soft-delete qua trường `deleted_at`. Tài khoản bị đánh dấu xóa/khóa sẽ bị từ chối đăng nhập tức thì.
* **Xác thực Email (Traditional Verification):** Tài khoản đăng ký qua form truyền thống sẽ bị khóa quyền đăng nhập cho đến khi người dùng nhấn vào đường link kích hoạt được gửi qua hệ thống SMTP Mail.

## 3. STAKEHOLDERS
* **CUSTOMER:** Khách hàng sử dụng web để đăng ký, kích hoạt tài khoản, đăng nhập mua hàng và quản lý giỏ hàng.
* **SALE / ADMIN:** Nhân viên hệ thống sử dụng tài khoản nội bộ do ADMIN cấp để vào các phân hệ quản trị, xác minh đơn thuốc của khách.

## 4. ASSUMPTIONS (Giả định)
* Frontend lưu trữ JWT Token trong `localStorage` để đính kèm vào header `Authorization: Bearer <token>` ở các request tiếp theo.
* Người dùng đăng nhập qua Google OAuth2 mặc nhiên được công nhận là đã xác thực email và không cần mật khẩu hệ thống.

## 5. OPEN QUESTIONS
* Link xác thực gửi vào Email sẽ trỏ thẳng về API của Backend (Backend xử lý rồi tự động redirect trình duyệt về trang Frontend) hay trỏ về một trang trung gian của Frontend? (Chốt: Trỏ về API Backend để xử lý tập trung, sau đó dùng `res.redirect()` về Frontend).