# CONTEXT.md — Bảng phân tích doanh số (Dashboard Analytics Feature)

## 1. PROBLEM STATEMENT

- **Thiếu dữ liệu tổng quát về tình hình kinh doanh:** Người quản lý và ban giám đốc không thể đưa ra các kế hoạch nhập hàng, điều chỉnh giá bán hoặc chiến lược Marketing nếu phải duyệt từng hóa đơn bán hàng thủ công để cộng doanh thu.
- **Bỏ sót sản phẩm sắp cháy hàng:** Việc không tự động phát hiện và tổng hợp các biến thể sản phẩm sắp hết kho sẽ dẫn đến tình trạng kính mắt hết hàng kéo dài mà không kịp tái nhập kho.
- **Khó phân tích xu hướng mua hàng:** Không nắm bắt được đâu là dòng gọng kính/tròng kính bán chạy nhất và tỷ lệ cắt tròng thuốc để phân bổ nhân sự kỹ thuật viên khúc xạ phù hợp.

---

## 2. DOMAIN KNOWLEDGE

- **Tỷ lệ tăng trưởng doanh thu (Revenue Growth):** Phần trăm thay đổi doanh thu tháng này so với tháng trước đó trên các đơn hàng hoàn tất (`COMPLETED`), tính toán dựa trên múi giờ Việt Nam (GMT+7).
- **Cảnh báo tồn kho thấp (Low stock items):** Số lượng biến thể sản phẩm hoạt động (`ACTIVE`) có lượng tồn thực tế nhỏ hơn 10 đơn vị (`ProductVariant.quantity < 10`).
- **Xu hướng bán chạy (Best Sellers):** Top 5 gọng kính bán nhiều nhất, top 3 tròng kính được chọn nhiều nhất và tỷ lệ đơn có cắt tròng kính y tế thuốc (`prescriptionRatio`) trên tổng số sản phẩm bán ra.

---

## 3. STAKEHOLDERS

- **Manager/Admin:** Người trực tiếp xem dữ liệu báo cáo, theo dõi biến động doanh thu, nhận cảnh báo kho và phân tích xu hướng bán để ra quyết định kinh doanh.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)

- **Tech:** Chỉ được phép cho các tài khoản gán quyền `MANAGER` hoặc `ADMIN` truy nhập API `/api/dashboard/revenue`.
- **Tech:** Dữ liệu doanh thu chỉ được tính từ đơn hàng đã hoàn tất giao hàng thực tế (`status = 'COMPLETED'`).
- **Business:** Phải chuẩn hóa múi giờ Việt Nam (GMT+7) khi tính toán các mốc thời gian ngày/tháng để tránh lệch số liệu báo cáo so với thực tế hoạt động.

---

## 5. ASSUMPTIONS (giả định — cần confirm)

- Giả định rằng các phép tính toán doanh thu và tỷ lệ tăng trưởng không cần lưu cache (truy vấn realtime từ DB) vì lượng dữ liệu giao dịch của cửa hàng hiện tại chưa quá lớn.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)

- _Q1:_ Có cần tích xuất báo cáo sang định dạng Excel/PDF cho Manager tải xuống không? (Hiện tại: Chỉ hỗ trợ xem trực quan trên UI).
