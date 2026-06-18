# SPEC.md - Profile & RBAC
# Version: 1.0.0 | Status: APPROVED & LOCKED | Owner: @tech-lead | Date: 2026-06-14

## 1. Context & Goal
Tạo trang hồ sơ cá nhân an toàn và thiết lập bộ lọc phân quyền middleware (Frontend + Backend) chống leo thang đặc quyền.

## 2. Actors & Roles
- **Guest:** Chưa đăng nhập.
- **Customer:** Xem và cập nhật thông tin của chính mình.
- **Admin:** Có quyền truy cập vào khu vực `/admin`.

## 3. Functional Requirements (EARS Notation)
- **STATE-DRIVEN:** WHILE ứng dụng khởi tạo (hoặc F5), THE hệ thống SHALL gọi `GET /api/auth/me` để đồng bộ lại thông tin `user` và `role`.
- **STATE-DRIVEN:** WHILE quá trình đồng bộ token đang diễn ra (`isLoading === true`), THE frontend SHALL hiển thị giao diện chờ và đóng băng chuyển hướng.
- **STATE-DRIVEN:** WHILE người dùng chưa đăng nhập, THE hệ thống SHALL chuyển hướng truy cập từ `/profile` hoặc `/admin/*` về `/login`.
- **UBIQUITOUS:** THE hệ thống SHALL giới hạn quyền truy cập các route `/admin` chỉ dành cho `role === 'admin'`.
- **EVENT-DRIVEN:** WHEN người dùng submit form cập nhật Profile, THE frontend SHALL gọi API `PATCH /api/users/profile`.
- **UBIQUITOUS:** THE backend SHALL bóc tách và loại bỏ (strip) các trường `role`, `password`, `email` khỏi payload cập nhật.

## 4. Non-functional Requirements
- Middleware kiểm tra Token và Role thực thi < 30ms (p95).
- Hiệu ứng chuyển trang mượt mà, không gây chớp nháy (flicker) giao diện.

## 5. Data Model
Mô hình `User` cập nhật thêm:
- `role`: String, Enum: ['customer', 'admin'], default: 'customer'.

## 6. Error Handling (UNWANTED)
- **UNWANTED:** WHERE Guest hoặc Customer truy cập Route `/admin`, THE frontend SHALL chuyển hướng về `/`.
- **UNWANTED:** WHERE Token gửi lên Backend không hợp lệ/hết hạn, THE backend SHALL trả về `401 Unauthorized` và THE frontend SHALL đưa về `/login`.
- **UNWANTED:** WHERE payload chứa field trái phép (`role="admin"`), THE backend SHALL lẳng lặng bỏ qua field đó (Silent Drop) và cập nhật các field hợp lệ còn lại.

## 7. Acceptance Criteria
- [ ] Truy cập `/profile` khi chưa đăng nhập -> bị chuyển về `/login`.
- [ ] Customer truy cập `/admin` -> bị chuyển về `/`.
- [ ] F5 (Tải lại trang) ở `/profile` -> Giữ nguyên trạng thái đăng nhập.
- [ ] Gửi request `PATCH` kèm `role: "admin"` -> Database không đổi role.

## 8. Out of Scope
- KHÔNG làm trang Dashboard cho Admin (chỉ làm Router Guard).
- KHÔNG cho phép đổi Email trong form này.
- KHÔNG làm chức năng Upload Avatar.