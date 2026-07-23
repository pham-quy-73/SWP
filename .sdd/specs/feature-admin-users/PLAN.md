# PLAN.md — Implementation Plan: Quản lý thành viên (User Management)

**Status:** In-Progress (đã có code, cần bổ sung phân trang)
**Author:** AI Agent
**Date:** 2026-06-23
**Spec ref:** `users.spec.md`
**Priority:** Medium

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể

- **CRUD REST + Soft-delete via `deleted_at`:** API quản lý user tuân theo REST chuẩn. Trạng thái hoạt động/khóa được biểu diễn qua field `deleted_at` (null = ACTIVE, có giá trị = INACTIVE). Cách này bảo toàn lịch sử đơn hàng của user (assumption trong CONTEXT §5).
- **Role-guarded middleware:** Route `/api/users` áp dụng `requireRole(['ADMIN'])` duy nhất — chỉ Admin tối cao được thao tác. Tách biệt `GET /me` (cho mọi user đã login) khỏi các route admin.
- **Envelope response:** `{ code: 0, message, result }` đồng bộ toàn hệ thống.

### Pattern

| Pattern                    | Lý do                                                                                                                |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Controller class           | Đồng nhất với Dashboard/Refund.                                                                                      |
| Soft-delete (`deleted_at`) | Không mất dữ liệu lịch sử; `authMiddleware.authenticate` đã có sẵn check `deleted_at !== null` → tự động chặn login. |
| Whitelist role             | `allowedRoles` ở controller để chặn role không hợp lệ (`SHIPPER`...).                                                |

---

## 2. COMPONENTS

### Backend (đã có)

| Tên                                        | Trách nhiệm                | Interface                                                                     |
| :----------------------------------------- | :------------------------- | :---------------------------------------------------------------------------- |
| `user.routes.js` ✅                        | Mount routes + guard ADMIN | GET `/`, GET `/:id`, PUT `/:id/role`, PUT `/:id/status`, DELETE `/:id`        |
| `UserController` ✅                        | Logic CRUD                 | getAllUsers, getUserById, updateUserRole, updateUserStatus, deleteUser, getMe |
| `authMiddleware.requireRole(['ADMIN'])` ✅ | Guard                      | Có sẵn                                                                        |
| `User` model ✅                            | Schema                     | Có field `role`, `deleted_at`, hash password pre-save                         |

### Frontend (đã có)

| Tên                                        | Trách nhiệm                             |
| :----------------------------------------- | :-------------------------------------- |
| `feature/admin/layout/AdminLayout.jsx` ✅  | Khung sidebar/topbar cho admin          |
| `feature/admin/page/UserManagePage.jsx` ✅ | Bảng user, modal đổi role, khóa/mở, xóa |
| `App.jsx` ✅                               | Route `/admin`, `/admin/users`          |

---

## 3. DATA FLOW

```
Admin (role=ADMIN) login → JWT
  → UserManagePage mount → fetchUsers()
  → GET /api/users?role=MANAGER&search=... (Bearer JWT)
  → authenticate → requireRole(['ADMIN'])
  → UserController.getAllUsers:
        build query từ role/search → User.find().select('-password')
  → res.json({ code:0, result:[...] })
  → setUsersList → render bảng

[Đổi role]
  → AssignRoleModal → PUT /api/users/:id/role { role }
  → updateUserRole → validate role ∈ [CUSTOMER,SALE,MANAGER,SHIPPER,ADMIN]
  → user.role = ...; save → 200

[Khóa/Mở]
  → PUT /api/users/:id/status { status:'INACTIVE'|'ACTIVE' }
  → updateUserStatus → deleted_at = new Date() | null
  → Lần login sau bị authenticate chặn (403 FORBIDDEN)

[Xóa vĩnh viễn]
  → DELETE /api/users/:id → findByIdAndDelete → 200
```

---

## 4. DEPENDENCIES

### Thứ tự implement

1. **(đã xong)** `User` model với `role` + `deleted_at` + pre-hash password.
2. **(đã xong)** `authMiddleware` (verify JWT + check `deleted_at`).
3. **(đã xong)** `UserController`: 5 method CRUD + getMe.
4. **(đã xong)** `user.routes.js` với guard.
5. **(đã xong)** Frontend `UserManagePage` + `AdminLayout` + route.
6. **(GAP — cần làm)** Bổ sung **phân trang** cho `getAllUsers` (spec §4.1 liệt kê query `page`, `limit`; code hiện chưa xài).

### External dependencies

- Không thêm. Tận dụng `express`, `mongoose`, `axios`, `sonner`, `react-router-dom`.

---

## 5. RISKS & MITIGATIONS

| #   | Rủi ro                                                                                                                                                                          | Xác suất | Impact   | Mitigation                                                                                                                     |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------- | :------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Admin tự khóa/xóa chính mình** — gây kẹt hệ thống không còn ADMIN nào.                                                                                                        | Med      | **High** | Trong controller: nếu `req.user._id === req.params.id` thì từ chối thao tác khóa/xóa/đổi role với lỗi `SELF_ACTION_FORBIDDEN`. |
| 2   | **Bao泄露 password** — getAllUsers có `.select('-password')` ✓ nhưng updateUserRole/updateUserStatus dùng `user.toObject()` rồi `delete password`. Đảm bảo cả 2 path đều strip. | Low      | High     | Đã xử lý. Review đảm bảo không route nào quên select.                                                                          |
| 4   | **Không phân trang** — spec nêu query `page`/`limit` nhưng code trả toàn bộ. Bảng user lớn sẽ chậm.                                                                             | Med      | Med      | Implement pagination ở `getAllUsers`.                                                                                          |
| 5   | **Soft-delete không wire với login** — nếu middleware quên check `deleted_at`, user bị khóa vẫn login được.                                                                     | Low      | **High** | Đã verify `authMiddleware.authenticate` dòng 19-21 đang chặn. Test lại sau mỗi thay đổi.                                       |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có cần ngăn Admin tự thao tác lên chính tài khoản mình (khóa/xóa/đổi role) không? _(Đề xuất: CÓ — tránh kẹt hệ thống.)_
- **Q2:** Spec §4.1 có query `page`/`limit` — có muốn implement phân trang ngay không, hay để sau? _(Đề xuất: làm luôn vì spec đã nêu.)_
- **Q3:** Role `SHIPPER` (CONTEXT §2 chỉ liệt kê 4 role nhưng model có 5) có được phép gán không? _(Đề xuất: giữ vì model đã có, nhưng nên thống nhất tài liệu.)_
- **Q4:** CONTEXT §6 Q1 — có cần audit log khi Admin đổi role/khóa user không? _(Hiện tại: chưa làm.)_
