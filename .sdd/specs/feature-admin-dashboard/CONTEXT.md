# CONTEXT.md — Bảng phân tích doanh số (Dashboard Analytics Feature)
# Người viết: @antigravity | Ngày: 2026-06-23

## 1. PROBLEM STATEMENT
*   **Thiếu tầm nhìn trực quan về tình hình kinh doanh:** Người quản lý không thể đưa ra các kế hoạch nhập hàng hoặc chiến lược Marketing nếu phải duyệt từng hóa đơn bán hàng thủ công để cộng doanh thu.
*   **Bỏ sót sản phẩm sắp cháy hàng:** Việc không tự động phát hiện và tổng hợp các mặt hàng/variant sắp hết kho sẽ dẫn đến tình trạng kính mắt hết hàng kéo dài mà không kịp tái nhập kho.

---

## 2. DOMAIN KNOWLEDGE
*   **Tỷ lệ tăng trưởng (Growth Rate):** Biến động phần trăm doanh thu tháng này so với tháng trước đó trên các đơn hàng hoàn tất (`COMPLETED`).
*   **Cảnh báo hết kho (Low stock warning):** Định nghĩa là bất kỳ biến thể sản phẩm (SKU) có lượng tồn kho thực tế nhỏ hơn 10 đơn vị.

---

## 3. STAKEHOLDERS
*   **Manager / Admin:** Người sử dụng số liệu trực tiếp để hoạch định chiến lược kinh doanh.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Chỉ được phép cho các tài khoản gán quyền `MANAGER` hoặc `ADMIN` truy nhập API `/api/dashboard/revenue`. Hệ thống cần trích xuất trực tiếp từ DB Mongoose chứ không định sẵn/mock số liệu ảo ngoài thực tế.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng dữ liệu doanh thu chỉ tính từ các đơn hàng thành công thực sự ở trạng thái `COMPLETED` (không tính các đơn đặt `PENDING` hay các đơn `CANCELLED`).

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần tích xuất xuất khẩu dữ liệu sang định dạng excel/csv cho Manager tải xuống hay không? (Hiện tại: Chỉ hỗ trợ biểu diễn đồ họa/JSON hiển thị ở UI).
