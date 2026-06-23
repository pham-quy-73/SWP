# TASKS.md — Danh sách task: User Management (Admin)

**Spec ref:** `users.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **U001** | ✅ Implement route `GET /api/users` có guard ADMIN + filter role/search | `routes/user.routes.js`, `controllers/UserController.js` (getAllUsers) | 1.0h | — | §3.1, §4.1 | Trả 200 + danh sách user (đã strip password); filter đúng theo `role`, `search` (regex trên username/email/first_name/last_name). 403 khi role ≠ ADMIN. |
| **U002** | ✅ `GET /api/users/:id` chi tiết 1 user | `UserController.getUserById` | 0.5h | U001 | §3 | 200 trả object user; 404 `USER_NOT_FOUND` khi id sai. |
| **U003** | ✅ `PUT /api/users/:id/role` đổi vai trò | `UserController.updateUserRole` | 1.0h | U001 | Validate role ∈ {CUSTOMER,SALE,MANAGER,SHIPPER,ADMIN}; cập nhật `user.role`, trả 200; 400 khi role rỗng/không hợp lệ; 404 khi user không tồn tại. |
| **U004** | ✅ `PUT /api/users/:id/status` khóa/mở (soft-delete) | `UserController.updateUserStatus` | 1.0h | U001 | `status:'INACTIVE'` → `deleted_at = new Date()`; `status:'ACTIVE'` → `deleted_at = null`. User bị khóa không login được (403 qua authMiddleware). |
| **U005** | ✅ `DELETE /api/users/:id` xóa vĩnh viễn | `UserController.deleteUser` | 0.5h | U001 | Xóa khỏi DB; 404 nếu không tìm thấy. Đơn hàng lịch sử liên quan KHÔNG bị ảnh hưởng (theo CONTEXT §5). |
| **U006** | ✅ **(FIXED)** Chặn Admin tự thao tác lên chính mình (tránh kẹt hệ thống) | `controllers/UserController.js` (guard trong updateUserRole/updateUserStatus/deleteUser) | 1.0h | U003-U005 | Risk #1 | Nếu `req.user._id === req.params.id` → trả 403 `SELF_ACTION_FORBIDDEN` cho cả 3 route role/status/delete. **Done 2026-06-23.** |
| **U007** | 🔶 **(BE done, FE todo)** Bổ sung phân trang cho `getAllUsers` (page, limit) | `controllers/UserController.js` ✅, `feature/admin/page/UserManagePage.jsx` ⬜ | 2.0h | U001 | §4.1 (query page/limit) | Response thêm `pagination: { page, limit, total, totalPages }`; FE thêm UI phân trang. Query sample: `?role=CUSTOMER&page=1&limit=20`. **BE done 2026-06-23; FE chưa wire UI phân trang.** |
| **U008** | ✅ Implement UI quản lý (FE) | `feature/admin/page/UserManagePage.jsx`, `feature/admin/layout/AdminLayout.jsx` | 3.0h | U001-U005 | §2 Story 1-3 | Bảng 2 view (Staff/Customer); modal đổi role; nút khóa/mở/xóa có confirm dialog; toast phản hồi; route `/admin`, `/admin/users`. |
| **U009** | ⬜ (Tuỳ chọn) Audit log thao tác Admin | mới: `middlewares/auditLog.js`, `models/AdminLog.js` | 3.0h | U003-U005 | CONTEXT §6 Q1 | Ghi `{ admin_id, action, target_user_id, before, after, timestamp }` mỗi khi đổi role/status/delete. |

### Tổng kết gap cần xử lý
- **Nên làm (bảo mật):** U006 — chặn self-action.
- **Theo spec:** U007 — phân trang.
- **Tuỳ chọn:** U009 — audit log (chờ Q4 confirm).
