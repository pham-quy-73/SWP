# TASKS.md — Danh sách task: Đánh giá Sản phẩm (Feedback / Reviews)

**Spec ref:** `feedback.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F001** | ✅ Thiết lập `Feedback` model | `src/backend/models/Feedback.js` | 0.5h | — | U-1, U-2 | Schema đúng; rating min 1 max 5; compound index `{ user_id, order_id, product_id }`. |
| **F002** | ✅ Cấu hình route và upload ảnh | `src/backend/routes/feedback.routes.js` | 0.5h | — | NFR-1 | Mount multer upload.array('images', 5) cho các route thêm/sửa đánh giá. |
| **F003** | ✅ Tạo/Cập nhật đánh giá (Upsert) | `src/backend/controllers/FeedbackController.js` (createFeedback) | 1.5h | F001, F002 | E-1 -> E-5 | Check ownership đơn hàng. Auto-upsert nếu cặp `{ user, order, product }` trùng. Hỗ trợ dual-format parse. |
| **F004** | ✅ Lấy đánh giá cá nhân (My Feedbacks) | `src/backend/controllers/FeedbackController.js` (getMyFeedbacks) | 0.5h | F001 | E-6 | Lấy danh sách đánh giá của user đăng nhập, populate product. |
| **F005** | ✅ Lấy đánh giá của sản phẩm (Public) | `src/backend/controllers/FeedbackController.js` (getProductFeedbacks) | 0.5h | F001 | E-7 | Route public lấy tất cả feedback của sản phẩm, populate thông tin người dùng (first/last name, avatar). |
| **F006** | ✅ Lấy đánh giá theo đơn hàng | `src/backend/controllers/FeedbackController.js` (getOrderFeedbacks) | 0.5h | F001 | E-8 | Lấy feedback thuộc đơn hàng cụ thể của user đăng nhập. |
| **F007** | ✅ Xem chi tiết, cập nhật và xóa | `src/backend/controllers/FeedbackController.js` | 1.0h | F001 | E-9 -> E-12 | Cập nhật một phần (partial update); xóa bảo vệ ownership bằng `findOneAndDelete({ _id, user_id })`. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Phân hệ đánh giá đã được cài đặt đầy đủ logic backend, bảo đảm tính toàn vẹn thông qua database index và phân quyền chặt chẽ.
