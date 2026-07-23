# Feature: Quản lý Tài khoản Hệ thống (Admin User Management) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-23  
**Priority:** High  
**Risk Level:** High (Security-critical, role escalation risk, data deletion)  
**Related Specs:** `feature-auth`, `feature-admin-dashboard`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Hệ thống Optics Management phân biệt rõ ràng giữa các vai trò người dùng:
- **CUSTOMER**: Khách hàng mua sắm
- **SALE**: Nhân viên bán hàng (đã được loại bỏ trong phiên bản hiện tại)
- **MANAGER**: Quản lý kho, sản phẩm, đơn hàng
- **ADMIN**: Quản trị viên tối cao với quyền quản lý tài khoản

**Pain point hiện tại:**
- Không có cơ chế tự phục vụ để Manager/Admin cấp phát tài khoản cho nhân viên mới
- Thiếu công cụ để khóa/mở khóa tài khoản khi phát hiện vi phạm hoặc nhân viên nghỉ việc
- Không kiểm soát được danh sách người dùng theo vai trò và trạng thái hoạt động
- Rủi ro bảo mật khi Admin có thể vô tình tự khóa chính mình hoặc thay đổi quyền của Admin khác

### 1.2 Goals

1. **Kiểm soát phân quyền chặt chẽ**: Admin có toàn quyền quản lý tài khoản MANAGER, nhưng KHÔNG được can thiệp vào tài khoản ADMIN khác
2. **Cấp phát tài khoản nhanh**: Tạo tài khoản nội bộ (MANAGER) không cần qua flow xác thực email
3. **Quản lý trạng thái linh hoạt**: Khóa/mở khóa tài khoản mà không xóa dữ liệu vĩnh viễn
4. **Tìm kiếm & lọc hiệu quả**: Hỗ trợ tìm theo tên/email/username và lọc theo vai trò
5. **Bảo mật cao**: Ngăn chặn tự can thiệp (self-action), bảo vệ tài khoản ADMIN khỏi bị khóa/xóa

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor                       | Vai trò    | Phân quyền với User Management                                                                                     |
| :-------------------------- | :--------- | :----------------------------------------------------------------------------------------------------------------- |
| **ADMIN**                   | Quản trị   | Toàn quyền: xem danh sách, tạo, sửa role, khóa/mở, xóa, reset password tài khoản CUSTOMER/MANAGER. **KHÔNG** được can thiệp vào ADMIN khác. |
| **MANAGER**                 | Quản lý    | **KHÔNG** có quyền truy cập trang User Management (route chặn bởi `requireRole(['ADMIN'])`)                        |
| **CUSTOMER**                | Khách hàng | **KHÔNG** có quyền                                                                                                 |
| **System (AuthMiddleware)** | Hệ thống   | Kiểm tra `deleted_at !== null` → từ chối đăng nhập (ngăn tài khoản bị khóa đăng nhập lại)                          |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:** 
> - Backend: `src/backend/routes/user.routes.js`, `src/backend/controllers/UserController.js`, `src/backend/models/User.js`
> - Frontend: `src/frontend/src/feature/admin/page/UserManagePage.jsx`, `src/frontend/src/feature/admin/hooks/useAdminUsers.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE User Management feature SHALL be accessible ONLY by users with role `ADMIN` (enforced by `authenticate, requireRole(['ADMIN'])` middleware on all routes except `/me`).
- **U-2:** THE system SHALL NEVER allow an ADMIN to modify their own `role` or `status` (self-action protection).
- **U-3:** THE system SHALL NEVER allow any operation (update status, delete, reset password) on accounts with `role === 'ADMIN'` except the viewing operation (protect all ADMIN accounts from being locked/deleted).
- **U-4:** THE `deleted_at` field SHALL serve as the soft-delete flag: `deleted_at !== null` means account is INACTIVE/locked; `deleted_at === null` means ACTIVE.
- **U-5:** THE password field SHALL be hashed with bcrypt (salt rounds: 12) via Mongoose pre-save hook before storing in database.

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Liệt kê & Tìm kiếm

- **E-1:** WHEN Admin requests `GET /api/users` with optional query params (`role`, `search`, `page`, `limit`), THE system SHALL return paginated user list (excluding `password` field) with response structure:
  ```json
  {
    "code": 0,
    "result": [{ "_id", "username", "email", "first_name", "last_name", "role", "deleted_at", "createdAt", "updatedAt" }],
    "pagination": { "page", "limit", "total", "totalPages" }
  }
  ```

- **E-2:** WHEN `search` query param is provided, THE system SHALL perform case-insensitive regex search across `username`, `email`, `first_name`, `last_name` fields using MongoDB `$or` operator.

- **E-3:** WHEN `role` query param is provided (e.g., `role=MANAGER`), THE system SHALL filter results to exact match `role.toUpperCase()`.

- **E-4:** WHEN `page` or `limit` are invalid (non-numeric, zero, negative), THE system SHALL clamp to safe defaults: `page = max(1, parseInt(page) || 1)`, `limit = max(1, parseInt(limit) || 20)`.

#### 3.2.2 Tạo Tài khoản Mới (Create User)

- **E-5:** WHEN Admin submits `POST /api/users` with payload `{ first_name, last_name, username, email, password, role }`, THE system SHALL validate all required fields are present (non-empty `first_name`, `last_name`, `username`, `email`, `password` with length >= 6).

- **E-6:** WHEN creating a new user, THE system SHALL check if `username` or `email` already exists in database; IF duplicate found, SHALL return HTTP 400 with `error_code: 'DUPLICATE_ERROR'`.

- **E-7:** WHEN `role` is provided and is one of `['CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN']`, THE system SHALL assign that role (uppercased); OTHERWISE SHALL default to `'MANAGER'`.

- **E-8:** WHEN user is created by Admin, THE system SHALL set `is_email_verified: true` (bypass email verification flow) and `deleted_at: null` (active by default).

- **E-9:** WHEN user creation succeeds, THE system SHALL return HTTP 201 with `{ code: 0, message: 'Cấp phát tài khoản thành công', result: { _id, username, email, role } }`.

#### 3.2.3 Cập Nhật Vai trò (Update Role)

- **E-10:** WHEN Admin requests `PUT /api/users/:id/role` with body `{ role }`, THE system SHALL validate `role` is one of `['CUSTOMER', 'SALE', 'MANAGER', 'ADMIN']`; OTHERWISE return HTTP 400 `VALIDATION_ERROR`.

- **E-11:** WHEN updating role, THE system SHALL check if `req.user._id.toString() === id` (self-action); IF true, SHALL return HTTP 403 `SELF_ACTION_FORBIDDEN: 'Bạn không thể thay đổi vai trò của chính mình'`.

- **E-12:** WHEN target user is not found, THE system SHALL return HTTP 404 `USER_NOT_FOUND`.

- **E-13:** WHEN role update succeeds, THE system SHALL return HTTP 200 with `{ code: 0, message: 'Cập nhật quyền thành công', result: { _id, role } }` (minimal response per spec).

#### 3.2.4 Khóa / Mở Khóa Tài khoản (Update Status)

- **E-14:** WHEN Admin requests `PUT /api/users/:id/status` with body `{ status }` where `status ∈ ['ACTIVE', 'INACTIVE']`, THE system SHALL validate status value; OTHERWISE return HTTP 400 `VALIDATION_ERROR`.

- **E-15:** WHEN target user has `role === 'ADMIN'`, THE system SHALL return HTTP 403 `FORBIDDEN: 'Không thể khóa tài khoản của Quản trị viên!'` (protect all ADMIN accounts from being locked).

- **E-16:** WHEN `status === 'INACTIVE'`, THE system SHALL set `deleted_at = new Date()`; WHEN `status === 'ACTIVE'`, SHALL set `deleted_at = null`.

- **E-17:** WHEN status update succeeds, THE system SHALL return HTTP 200 `{ code: 0, message: 'Cập nhật trạng thái thành công' }`.

#### 3.2.5 Xóa Vĩnh viễn Tài khoản (Delete User)

- **E-18:** WHEN Admin requests `DELETE /api/users/:id`, THE system SHALL check if target user has `role === 'ADMIN'`; IF true, SHALL return HTTP 403 `FORBIDDEN: 'Không thể xóa tài khoản Quản trị viên hệ thống!'`.

- **E-19:** WHEN target user is not ADMIN and exists, THE system SHALL permanently delete the user document from database using `findByIdAndDelete`.

- **E-20:** WHEN deletion succeeds, THE system SHALL return HTTP 200 `{ code: 0, message: 'Đã xóa vĩnh viễn' }`.

#### 3.2.6 Cấp Lại Mật khẩu (Reset Password)

- **E-21:** WHEN Admin requests `PUT /api/users/:id/reset-password` with body `{ newPassword }`, THE system SHALL validate `newPassword.length >= 6`; OTHERWISE return HTTP 400 `VALIDATION_ERROR: 'Mật khẩu mới phải từ 6 ký tự trở lên'`.

- **E-22:** WHEN target user has `role === 'ADMIN'`, THE system SHALL return HTTP 403 `FORBIDDEN: 'Không được phép cấp lại mật khẩu của Quản trị viên khác!'`.

- **E-23:** WHEN password reset succeeds, THE system SHALL set `user.password = newPassword` (triggers bcrypt hashing via Mongoose pre-save hook) and return HTTP 200 `{ code: 0, message: 'Cấp lại mật khẩu thành công' }`.

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE viewing user list, THE UI SHALL display users in a paginated table with columns: Avatar/Name/Email, Username, Role badge, Status badge (ACTIVE/INACTIVE), and Action menu.

- **S-2:** WHILE a user has `deleted_at !== null`, THE UI SHALL display status badge as "Đã khóa" (red badge); OTHERWISE "Đang hoạt động" (green badge with pulse dot).

- **S-3:** WHILE viewing a user with `role === 'ADMIN'`, THE action menu SHALL display "Cấp cao nhất" (disabled state) instead of action buttons (prevent any operation on ADMIN accounts).

- **S-4:** WHILE action menu is open for a non-ADMIN user, THE menu SHALL show options: "Cấp lại mật khẩu", "Khóa/Mở khóa tài khoản", "Xóa vĩnh viễn".

- **S-5:** WHILE user list is loading, THE UI SHALL display loading spinner with message "Đang đồng bộ...".

- **S-6:** WHILE user list is empty (no results matching filters), THE UI SHALL display empty state with icon and message "Không tìm thấy tài khoản nào".

### 3.4 Optional / Where (Tùy chọn)

- **O-1:** WHERE Admin chooses to create a new account, THE UI SHALL open a modal form with fields: `last_name` (Họ), `first_name` (Tên), `username`, `email`, `password`, `role` (dropdown defaulting to MANAGER).

- **O-2:** WHERE Admin chooses to reset password for a user, THE UI SHALL open a modal prompting for `newPassword` (minimum 6 characters) with validation before submission.

- **O-3:** WHERE pagination `totalPages > 1`, THE UI SHALL render "Trước/Sau" buttons at the bottom of the table; buttons SHALL be disabled when at first/last page.

### 3.5 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE Admin attempts to update their own role, THE system SHALL return HTTP 403 and SHALL NOT apply the change.

- **N-2:** WHERE Admin attempts to lock/delete/reset password of another ADMIN account, THE system SHALL return HTTP 403 and SHALL NOT apply the operation.

- **N-3:** WHERE a locked user (