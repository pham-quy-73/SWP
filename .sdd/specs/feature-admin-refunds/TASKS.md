# TASKS.md — Danh sách task: Quản lý Hoàn tiền (Refunds Management)

**Spec ref:** `refunds.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R001** | ✅ Thiết lập `Refund` model | `src/backend/models/Refund.js` | 0.5h | — | U-2 | Schema đúng; chứa các trường bắt buộc; ref sang Order. |
| **R002** | ✅ Phân quyền router hoàn tiền | `src/backend/routes/refund.routes.js` | 0.5h | — | U-1 | Áp dụng middleware authenticate + requireRole MANAGER/ADMIN cho toàn bộ router. |
| **R003** | ✅ Vô hiệu hóa biến thể | `src/backend/controllers/RefundController.js` (inActivateVariant) | 1.0h | R001 | E-3 -> E-5 | PATCH cập nhật ProductVariant.status = 'INACTIVE', trả 404 nếu sai id. |
| **R004** | ✅ Danh sách đơn ảnh hưởng | `src/backend/controllers/RefundController.js` (getAffectedOrders) | 1.5h | R003 | E-6, E-7 | Tìm đơn hàng đang xử lý có chứa sản phẩm cha của variant bị vô hiệu hóa. |
| **R005** | ✅ Gom lô và Tạo yêu cầu hoàn tiền | `src/backend/controllers/RefundController.js` (createBatch) | 2.0h | R004 | E-8 -> E-10, U-3 | Tạo Refund PENDING cho các đơn đã PAID. Hủy đơn hàng và tự động cộng hoàn trả tồn kho. Tránh tạo trùng (idempotent). |
| **R006** | ✅ Danh sách yêu cầu chờ duyệt | `src/backend/controllers/RefundController.js` (getReadyRefunds) | 1.0h | R005 | E-11 | Trả về danh sách Refund PENDING kèm thông tin người nhận và tài khoản ngân hàng. |
| **R007** | ✅ Phê duyệt hoàn tiền | `src/backend/controllers/RefundController.js` (checkoutRefund) | 1.5h | R006 | E-12, E-13 | Chuyển Refund -> COMPLETED, Order -> REFUNDED, Payment -> UNPAID. |
| **R008** | ✅ Từ chối hủy đơn (Khôi phục) | `src/backend/controllers/RefundController.js` (rejectCancellation) | 1.0h | — | E-14 | Phục hồi đơn hàng về trạng thái trước khi hủy và trừ lại tồn kho. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Phân hệ quản lý hoàn tiền đã được hoàn tất cài đặt chính xác, đồng bộ hóa endpoints và logic an toàn dòng tiền theo đúng đặc tả kỹ thuật.
