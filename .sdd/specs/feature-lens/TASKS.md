# TASKS.md — Danh sách task: Quản lý Tròng kính (Lens Management)

**Spec ref:** `lens.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **L001** | ✅ Thiết lập `Lens` model | `src/backend/models/Lens.js` | 0.5h | — | U-1 -> U-3 | Tạo schema với tên, chất liệu bắt buộc, giá không âm, trạng thái mặc định ACTIVE. |
| **L002** | ✅ Tích hợp tính giá tròng kính | `src/backend/services/PricingService.js` | 0.5h | L001 | U-4 | PricingService hỗ trợ cộng thêm giá tròng kính, kiểm tra trạng thái hoạt động của tròng kính. |
| **L003** | ✅ API Lấy danh sách tròng kính | `src/backend/controllers/LensController.js` (getLenses) | 1.0h | L001 | E-1 | Hỗ trợ tìm kiếm không phân biệt hoa thường theo tên/chất liệu/mô tả; mặc định chỉ hiển thị ACTIVE. |
| **L004** | ✅ API Lấy chi tiết tròng kính | `src/backend/controllers/LensController.js` (getLensById) | 0.5h | L001 | E-2 | Trả về thông tin chi tiết tròng kính theo ID, trả 404 nếu không tìm thấy. |
| **L005** | ✅ API Tạo tròng kính mới | `src/backend/controllers/LensController.js` (createLens) | 1.0h | L001 | E-3, E-4 | Validate dữ liệu nghiêm ngặt trước khi tạo; phân quyền MANAGER/ADMIN. |
| **L006** | ✅ API Cập nhật tròng kính | `src/backend/controllers/LensController.js` (updateLens) | 1.0h | L001 | E-5 -> E-7 | Cho phép cập nhật từng phần (partial update); chặn cập nhật rỗng; bảo lưu các giá trị không đổi. |
| **L007** | ✅ API Xóa tròng kính (Soft-delete) | `src/backend/controllers/LensController.js` (deleteLens) | 0.5h | L001 | E-8, E-9 | Chuyển trạng thái tròng kính sang INACTIVE thay vì xóa vật lý khỏi DB. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Phân hệ quản lý danh mục tròng kính đã hoàn tất 100% phần backend, đảm bảo chạy đúng nghiệp vụ và an toàn dữ liệu lịch sử.
