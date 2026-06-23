# Feature: Quản lý thành viên (User Management) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Admin  
**Date:** 2026-06-23  
**Priority:** Medium  

---

## 1. Business Context
Hệ thống cửa hàng Optics đòi hỏi cơ chế kiểm soát vai trò và phân quyền chặt chẽ của các thành viên. Khách hàng giao dịch mua bán, nhân viên Sale đóng gói đơn và Manager điều phối kho, còn Admin tối cao chịu trách nhiệm điều khiển trạng thái bật/tắt hoạt động của tài liệu người dùng và thiết lập phân vai linh hoạt.

---

## 2. User Stories
*   **Story 1 (Happy Path - Quản trị viên thay đổi vai trò):**  
    Là Admin, tôi chọn tài khoản khách hàng và cập nhật phân vai thành `SALE` để họ có thể nhận quyền trợ giúp xử lý trạng thái đơn hàng.
*   **Story 2 (Happy Path - Khôi phục/Vô hiệu hóa hoạt động):**  
    Là Admin, tôi có thể thay đổi trạng thái kích hoạt tài khoản của thành viên để tạm dừng quyền truy cập nếu phát hiện vi phạm.
*   **Story 3 (Happy Path - Xóa thành viên):**  
    Là Admin, tôi có thể xóa vĩnh viễn các tài khoản rác/tài khoản ảo ra khỏi database để tối ưu hóa dung lượng lưu trữ.

---

## 3. Acceptance Criteria (EARS)
*   **Lọc & Liệt kê người dùng:**
    - **WHEN** Admin truy tìm danh tính qua endpoint `GET /api/users` kèm query `role` hoặc `search`
    - **THE SYSTEM SHALL** trả về mã HTTP 200 kèm danh sách đối tượng người dùng thỏa mãn phân trang.
*   **Cập nhật Role:**
    - **WHEN** Admin gửi request thay đổi role của người dùng qua `PUT /api/users/:id/role`
    - **THE SYSTEM SHALL** cập nhật ngay trường `role` và trả về HTTP 200.
*   **Cập nhật Trạng thái:**
    - **WHEN** Admin điều chỉnh bật/tắt hoạt động qua `PUT /api/users/:id/status`
    - **THE SYSTEM SHALL** chuyển đổi cờ hoặc thiết lập thuộc tính `deleted_at` tương ứng.

---

## 4. API Contract

### 4.1 Liệt kê người dùng
*   **Endpoint:** `GET /api/users`
*   **Query params:** `role`, `search`, `page`, `limit`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": [
        { "_id": "...", "username": "...", "email": "...", "role": "CUSTOMER", "deleted_at": null }
      ]
    }
    ```

### 4.2 Cập nhật quyền (Role)
*   **Endpoint:** `PUT /api/users/:id/role`
*   **Payload:** `{ "role": "SALE" }`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "message": "Cập nhật quyền thành công",
      "result": { "_id": "...", "role": "SALE" }
    }
    ```

### 4.3 Khóa/Mở khóa tài khoản (Status)
*   **Endpoint:** `PUT /api/users/:id/status`
*   **Payload:** `{ "status": "INACTIVE" }` // Hoặc ACTIVE
*   **Response 200:**
    ```json
    {
      "code": 0,
      "message": "Cập nhật trạng thái thành công"
    }
    ```

---

## 5. Technical Constraints
*   **Mongoose Models:** Tương tác trực tiếp trên schema `User` (`users`).
*   **Chặn đăng nhập khi bị ngắt kích hoạt:**
    - Controller kiểm soát xác thực cần so sánh: nếu `deleted_at !== null` thì chặn lập tức không cấp JWT.

---

## 6. Out of Scope
*   Tự động phát hiện hành vi tấn công giả mạo (fraud detection) để tự khóa tài khoản mà không cần Admin can thiệp.
