# TASKS.md — Danh sách task: Quản lý Đơn hàng (Order Management)

**Spec ref:** `orders.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo
**Lưu ý:** Risk Level CRITICAL — liên quan trực tiếp đến dòng tiền, tồn kho và y tế.

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **O001** | ✅ Single Source of Truth Pricing | `src/backend/services/PricingService.js` | 1.0h | — | U-1 | Dùng `priceOrderItem` để lấy giá từ DB gọng/tròng, ưu tiên discountPrice. |
| **O002** | ✅ Trừ kho atomic chống âm | `src/backend/controllers/OrderController.js` | 1.0h | — | U-2 | Sử dụng `findOneAndUpdate` với `{ quantity: { $gte: requiredQty } }` và `$inc`. |
| **O003** | ✅ Ghi nhận lịch sử trạng thái | `src/backend/models/Order.js`, `src/backend/controllers/OrderController.js` | 0.5h | — | U-3 | Đẩy thông tin trạng thái cũ, mới, người sửa, ghi chú vào `status_history`. |
| **O004** | ✅ Tạo đơn hàng bọc Transaction | `src/backend/controllers/OrderController.js` (createOrder) | 2.5h | O001, O002 | E-1 -> E-7 | wrap trong mongoose session/transaction; fallback manual rollback cho standalone DB. |
| **O005** | ✅ Xem lịch sử đơn hàng cá nhân | `src/backend/controllers/OrderController.js` (getMyOrders) | 1.0h | — | E-8 -> E-10 | Phân trang, sort created_at giảm dần, populate items, gán remainingAmount = total_amount cho PENDING. |
| **O006** | ✅ Xem tất cả đơn hàng (Manager/Admin) | `src/backend/controllers/OrderController.js` (getAllOrders) | 1.0h | — | E-11 | Trả toàn bộ danh sách đơn hàng cho Manager/Admin, sort created_at giảm dần. |
| **O007** | ✅ Xem chi tiết đơn hàng | `src/backend/controllers/OrderController.js` (getOrderById) | 1.0h | — | E-12 -> E-14 | Trả chi tiết đơn kèm populate, check IDOR cho Customer. Backfill prescription imageUrl từ order level nếu item rỗng. |
| **O008** | ✅ Hủy đơn hàng (Customer) | `src/backend/controllers/OrderController.js` (cancelOrder) | 1.0h | O003 | E-15, E-16 | Cho phép hủy đơn PENDING/AWAITING_VERIFICATION/CONFIRMED của mình, hoàn trả tồn kho. |
| **O009** | ✅ Từ chối hủy đơn (Manager/Admin) | `src/backend/controllers/OrderController.js` (rejectCancellation) | 1.0h | O003 | E-17, E-18 | Hoàn lại trạng thái trước khi hủy, trừ tồn kho trở lại. |
| **O010** | ✅ Cập nhật trạng thái (Manager/Admin) | `src/backend/controllers/OrderController.js` (updateOrderStatus) | 1.5h | O003 | E-19 -> E-23 | Kiểm tra VALID_TRANSITIONS cho MANAGER, cho phép ADMIN override ghi is_override = true. Xử lý trừ/hoàn kho khi đổi qua/lại CANCELLED. |
| **O011** | ✅ Cập nhật đơn kính (KTV/Manager) | `src/backend/controllers/OrderController.js` (updateItemPrescription) | 1.0h | — | E-24, E-25 | Cho phép sửa prescription của item khi đơn ở AWAITING_VERIFICATION. |
| **O012** | ✅ Xóa đơn hàng (Admin) | `src/backend/controllers/OrderController.js` (deleteOrder) | 0.5h | — | E-26, E-27 | ADMIN được xóa vĩnh viễn đơn hàng và các order item. |
| **O013** | ✅ Tự động dọn dẹp đơn quá hạn | `src/backend/jobs/orderCleanupJob.js` | 1.5h | O002 | E-28, E-29 | Tìm đơn PENDING, UNPAID, quá 15 phút (30 phút nếu có payment_initiated_at) để tự động hủy và hoàn kho. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Các tính năng đã được code đầy đủ và hoạt động khớp với spec. Không phát hiện gap lớn nào trong luồng xử lý chính.
