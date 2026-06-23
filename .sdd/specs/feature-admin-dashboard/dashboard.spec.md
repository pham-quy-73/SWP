# Feature: Bảng phân tích doanh số (Dashboard Analytics) — LIGHT SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Date:** 2026-06-23  
**Risk Level:** Low (Read-only aggregation query)

---

## 1. Business Context
Ban giám đốc và Manager cần một giao diện tổng quát để nắm bắt sức khỏe tài chính và hoạt động kinh doanh hàng ngày của Optics. Việc trích xuất nhanh thông số doanh thu, tỷ lệ tăng trưởng so với tháng trước, lượng đơn hàng mới phát sinh và đưa ra các cảnh báo hết kho sớm giúp quản trị đưa ra định hướng kinh doanh kịp thời.

---

## 2. User Stories
*   **Story 1 (Happy Path - Quản trị viên theo dõi doanh thu):**  
    Là Manager/Admin, tôi mở trang Dashboard quản trị và xem biểu đồ doanh số cùng tỷ lệ tăng trưởng phần trăm để đưa ra kế hoạch điều chỉnh giá sản phẩm gọng kính.
*   **Story 3 (Happy Path - Cảnh báo tồn kho thấp):**  
    Là Manager/Admin, tôi xem mục cảnh báo hết hàng trên dashboard để lập danh sách nhập thêm hàng cho những kính mắt có số lượng variant nhỏ hơn 10.

---

## 3. Technical Implementation
*   **Được cung cấp qua API:** `GET /api/dashboard/revenue` (phân quyền cho MANAGER/ADMIN).
*   **Aggregation logic (Mongoose/Express):**
    - **Doanh thu và Order mới:** Truy vấn trực tiếp hóa đơn `Order` có status = `COMPLETED` trong tháng này và tính toán tổng số tiền, so sánh chéo tháng trước.
    - **Cảnh báo tồn kho thấp:** Truy vấn từ bảng `product_variants` những bản ghi có trường `quantity` nhỏ hơn 10.

---

## 4. Acceptance Criteria
*   **Truy vấn báo cáo thành công:**
    - **WHEN** Manager/Admin tải trang Dashboard có gọi API `GET /api/dashboard/revenue`
    - **THE SYSTEM SHALL** tổng hợp dữ liệu thời gian thực và trả về JSON chuẩn chứa: `totalRevenue`, `growthRate`, `totalOrders`, `lowStockItems`.
*   **Danh sách cảnh báo chính xác:** Các biến thể xuất hiện trong danh sách tồn kho thấp bắt buộc phải có giá trị số lượng `quantity` thực trong DB `< 10`.
