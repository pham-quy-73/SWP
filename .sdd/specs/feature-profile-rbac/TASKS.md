# PHÂN RÃ TÁC VỤ (TASKS.md) - FEATURE PROFILE & RBAC
# Tổng số tác vụ: 6 | Tổng thời gian ước tính: ~12 Giờ

> **Quy tắc thực thi chuẩn SDD:** Mọi tác vụ phải mang tính chất nguyên tử, hoạt động độc lập, thời gian thực hiện tối đa không quá 4 giờ, và có Unit Test/Integration Test đi kèm để nghiệm thu.

| ID | Tên Tác Vụ Kỹ Thuật | File(s) ảnh hưởng dự kiến | Thời gian | Cần xong trước | Tiêu chí hoàn thành (DoD) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T001** | Bổ sung field `role` vào User Schema | `models/User.js` | 0.5h | None | §5 | Schema lưu được user mới với `role='customer'`. |
| **T002** | Viết Middleware `protect` và `restrictTo` | `authMiddleware.js` | 2h | None | §3.1, §6 | Pass test case 401 khi mất token, 403 khi sai role. |
| **T003** | Viết API `GET /me` và `PATCH /profile` | `userController.js`, `userRoutes.js` | 3h | T001, T002 | §3.2, §6 | API loại bỏ được field `role` dù cố tình gửi lên. |
| **T004** | Cập nhật `AuthContext` xử lý F5 | `AuthContext.jsx` | 2h | T003 | §3.1 | F5 không bị giật lag, giữ được thông tin user. |
| **T005** | Viết `ProtectedRoute.jsx` và config Router | `ProtectedRoute.jsx`, `App.jsx` | 1.5h | T004 | §3.1, §6 | Bị đá văng về `/login` hoặc `/` chuẩn xác theo cấu hình role. |
| **T006** | Dựng giao diện `ProfilePage.jsx` | `ProfilePage.jsx` | 3h | T005 | §3.2, §8 | UI Luxury chuẩn, input Email bị disable (không cho sửa). |