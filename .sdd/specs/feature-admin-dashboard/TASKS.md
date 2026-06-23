# TASKS.md — Danh sách task: Dashboard Analytics

**Spec ref:** `dashboard.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** code = `0` (Done/Verified), `~` (Đã code nhưng lệch spec), `1` (Todo)

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D001** | `~` Implement route `GET /api/dashboard/revenue` có guard role ADMIN/MANAGER | `src/backend/routes/dashboard.routes.js` | 0.5h | — | §3, §4 (Acceptance: truy vấn báo cáo) | Endpoint phản hồi 401/403 khi thiếu JWT hoặc role CUSTOMER/SALE; 200 khi có role đúng. Đã verify bằng Postman. |
| **D002** | `~` Tính tổng doanh thu COMPLETED + tăng trưởng % vs tháng trước | `src/backend/controllers/DashboardController.js` (getDashboardStats) | 1.0h | D001 | §3 (Doanh thu và Order mới), §4 | `result.revenue` = tổng `total_amount` của Order COMPLETED; `revenueGrowth` đúng công thức `(this-last)/last*100`. Test với dữ liệu tháng trước = 0. |
| **D003** | `~` Đếm đơn đang xử lý + đơn phát sinh hôm nay | `src/backend/controllers/DashboardController.js` | 0.5h | D001 | §3, §4 | `activeOrders` = count Order status ∈ {PENDING, AWAITING_VERIFICATION, CONFIRMED}; `ordersToday` = count Order created_at >= startOfToday. |
| **D004** | ⬜ **(GAP)** Sửa cảnh báo kho: chuyển từ `Product.stock_quantity` sang `ProductVariant.quantity < 10` | `src/backend/controllers/DashboardController.js` | 1.0h | D002 | §3 (Cảnh báo tồn kho thấp), §4 (Acceptance: quantity thực < 10) | `lowStockItems` = `ProductVariant.countDocuments({ quantity: { $lt: 10 } })`. Chạy với dữ liệu seed có variant quantity=5 → trả về đúng. |
| **D005** | ✅ (Đã có) Wire frontend hiển thị KPI | `src/frontend/.../ManagerDashboardPage.jsx`, `useManagerDashboard.js` | 0h | D002, D003 | §2 User Story 1, 3 | Trang Dashboard render được 3 thẻ Doanh thu / Đơn mới / Cảnh báo kho; có loading skeleton + error retry. |
| **D006** | ⬜ Viết integration test (tuỳ chọn) cho endpoint `/revenue` | `src/backend/__tests__/dashboard.test.js` (mới) | 2.0h | D004 | §4 | Test: 200 + đúng schema; 403 khi role CUSTOMER; số liệu KPI khớp DB seed. |

### Tổng kết gap cần xử lý
- **Bắt buộc:** D004 (đúng spec, hiện đang sai nguồn dữ liệu).
- **Tuỳ chọn:** D006 (test), Q1 trong PLAN (đồng bộ tên field).
