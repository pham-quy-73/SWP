# CONTEXT.md — Quản lý Tròng kính (Lens Management Feature)

## 1. PROBLEM STATEMENT
*   **Đứt gãy dữ liệu lịch sử đơn hàng:** Nếu xóa trực tiếp (hard delete) một loại tròng kính khỏi DB, các đơn hàng cũ chứa loại tròng kính này sẽ bị lỗi khi truy vấn hoặc thống kê doanh thu.
*   **Sử dụng tròng kính đã dừng bán:** Khách hàng có thể cố tình gửi mã tròng kính cũ để đặt hàng nếu hệ thống không kiểm soát trạng thái hoạt động của tròng kính khi tính giá hoặc tạo đơn.
*   **Thiếu khả năng tự cập nhật giá khuyến mãi:** Cửa hàng cần linh hoạt điều chỉnh giá bán tròng kính (áp dụng giảm giá) mà không làm ảnh hưởng đến cấu trúc giá cơ bản lưu trong DB.

---

## 2. DOMAIN KNOWLEDGE
*   **Tròng kính (Lens):** Danh mục sản phẩm phụ trợ gồm tên, chất liệu (Polycarbonate, CR-39...), giá gốc, giá khuyến mãi và trạng thái hoạt động.
*   **Xóa mềm (Soft Delete):** Thay vì xóa bản ghi khỏi DB, hệ thống cập nhật trạng thái tròng kính thành `INACTIVE`. Điều này giữ cho dữ liệu lịch sử của đơn hàng cũ luôn hợp lệ khi populate.
*   **Ưu tiên giá khuyến mãi:** Khi tính giá, hệ thống luôn chọn `discountPrice` nếu giá trị này lớn hơn 0, nếu không sẽ dùng giá `price` gốc.

---

## 3. STAKEHOLDERS
*   **Manager/Admin:** Tạo tròng kính mới, sửa thông tin, cập nhật giá và ẩn tròng kính khi ngừng kinh doanh.
*   **Customer:** Xem và chọn tròng kính phù hợp từ danh sách đang bán để cắt kính thuốc khi đặt hàng.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Chỉ Manager và Admin có quyền thay đổi danh mục tròng kính (POST, PUT, DELETE).
*   **Tech:** Không cho phép xóa vật lý (hard delete) qua API công khai, tất cả lệnh xóa đều chuyển đổi trạng thái thành `INACTIVE`.
*   **Business:** Tròng kính có trạng thái `INACTIVE` tuyệt đối không được phép đưa vào đơn hàng mới.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng chất liệu tròng kính (`material`) là thông tin quan trọng cần bắt buộc nhập để khách hàng chọn lựa (phục vụ mục đích y tế/kỹ thuật).

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần phân chia tròng kính theo chiết suất (index như 1.56, 1.61, 1.67) để lọc nâng cao không? (Hiện tại: lưu tự do trong tên hoặc mô tả).
*   *Q2:* Có cần hỗ trợ upload hình ảnh minh họa cho tròng kính không? (Hiện tại: không).
