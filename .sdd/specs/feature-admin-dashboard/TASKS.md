# TASKS.md — Danh sách task: Bảng phân tích doanh số (Dashboard Analytics)

**Spec ref:** `dashboard.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D001** | ✅ API Báo cáo bảo mật | `src/backend/routes/dashboard.routes.js` | 0.5h | — | U-1 | Mount router và áp dụng middleware authenticate + requireRole MANAGER/ADMIN. |
| **D002** | ✅ Doanh thu & Tăng trưởng GMT+7 | `src/backend/controllers/DashboardController.js` | 1.0h | D001 | U-2, U-3, E-2, E-3 | Tính toán doanh thu đơn COMPLETED, chuẩn hóa múi giờ Việt Nam, tính % tăng trưởng không bị lỗi chia cho 0. |
| **D003** | ✅ Đếm số lượng đơn hàng hoạt động | `src/backend/controllers/DashboardController.js` | 0.5h | D001 | E-4, E-5 | Đếm đơn đang xử lý (PENDING/AWAITING/CONFIRMED) và đơn hàng phát sinh hôm nay. |
| **D004** | ✅ Cảnh báo tồn kho biến thể | `src/backend/controllers/DashboardController.js` | 1.0h | D001 | E-6 | Đếm số lượng ProductVariant có trạng thái ACTIVE và số lượng tồn kho < 10. |
| **D005** | ✅ Thống kê xu hướng gọng kính | `src/backend/controllers/DashboardController.js` | 1.5h | D001 | E-7 | Aggregation tìm top 5 gọng kính bán chạy nhất từ các đơn hàng không bị hủy. |
| **D006** | ✅ Thống kê xu hướng tròng kính | `src/backend/controllers/DashboardController.js` | 1.5h | D001 | E-8 | Aggregation tìm top 3 tròng kính được chọn nhiều nhất từ các đơn hàng không bị hủy. |
| **D007** | ✅ Tính tỷ lệ đơn hàng cắt tròng thuốc | `src/backend/controllers/DashboardController.js` | 1.0h | D001 | E-9 | Tính toán phần trăm đơn hàng có chứa lens_id trên tổng số sản phẩm bán ra. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Toàn bộ các yêu cầu tính toán báo cáo tài chính, xu hướng bán chạy và đếm kho đã được cài đặt hoàn tất và chạy chính xác ở backend.
