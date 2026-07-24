# CONTEXT.md — Quản lý Đơn hàng (Order Management Feature)

## 1. PROBLEM STATEMENT
*   **Đơn hàng PENDING bị treo vô thời hạn:** Nếu khách không thanh toán sau khi đặt đơn, đơn hàng ở trạng thái PENDING sẽ giữ tồn kho vĩnh viễn, dẫn đến sản phẩm bị "lock" mà không bán được cho khách khác.
*   **Race condition tồn kho:** Khi nhiều khách cùng đặt mua sản phẩm chỉ còn ít hàng, nếu không có cơ chế trừ kho atomic, có thể dẫn đến kho âm hoặc overselling.
*   **Quản lý trạng thái phức tạp:** Đơn hàng Optics có vòng đời phức tạp hơn e-commerce thông thường vì liên quan đến đơn kính thuốc (prescription) cần kỹ thuật viên xác minh trước khi giao.
*   **Không có audit trail:** Manager đổi trạng thái đơn mà không ghi lại ai làm, lúc nào, lý do gì — gây khó khăn khi xử lý tranh chấp.

---

## 2. DOMAIN KNOWLEDGE
*   **Đơn hàng (Order):** Bản ghi tập hợp các mục mua (OrderItem), thông tin giao hàng, trạng thái, lịch sử thanh toán. Mỗi checkout tạo đúng 1 Order.
*   **Mục đơn hàng (OrderItem):** Gồm biến thể sản phẩm (variant), tròng kính tùy chọn (lens), số lượng, giá đơn vị, và thông số đơn kính (prescription) nếu có.
*   **State Machine:** Vòng đời: PENDING → (AWAITING_VERIFICATION nếu có đơn kính | CONFIRMED nếu chỉ gọng) → COMPLETED. Bất kỳ trạng thái nào trước terminal đều có thể → CANCELLED. CANCELLED + PAID → REFUNDED (qua luồng riêng).
*   **PricingService:** Nguồn giá duy nhất — tính từ DB, ưu tiên `discountPrice > 0`, không tin giá client gửi lên.
*   **Cleanup Job:** Background job chạy mỗi 5 phút, tự hủy đơn PENDING quá 15 phút (gia hạn 30 phút nếu khách đang ở trang VNPay).

---

## 3. STAKEHOLDERS
*   **Customer:** Tạo đơn, xem lịch sử, hủy đơn của mình.
*   **Manager:** Xem tất cả đơn, chuyển trạng thái theo state machine, sửa đơn kính, từ chối hủy.
*   **Admin:** Toàn quyền Manager + override state machine + xóa đơn vĩnh viễn.
*   **System (Cleanup Job):** Tự động hủy đơn PENDING quá hạn.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Trừ kho sử dụng conditional update MongoDB `{ quantity: { $gte: qty } }` — không bao giờ để kho âm.
*   **Tech:** MongoDB transaction chỉ hoạt động với replica set; code phải fallback cho standalone (manual rollback).
*   **Business:** Chính sách thanh toán 100% trước — không hỗ trợ thanh toán một phần hay COD.
*   **Business:** Tối đa 50 items per order để giới hạn tải DB.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng khi Admin xóa đơn hàng vĩnh viễn, các bản ghi Refund/Payment liên quan không bị ảnh hưởng (đơn chỉ xóa Order + OrderItem).
*   Giả định rằng đơn kính (có lens_id hoặc prescription) luôn cần qua AWAITING_VERIFICATION trước khi CONFIRMED.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần gửi email/SMS thông báo cho khách khi trạng thái đơn thay đổi không? (Hiện tại: không).
*   *Q2:* Có cần hỗ trợ sửa số lượng / thêm bớt sản phẩm sau khi đơn đã tạo không? (Hiện tại: không).
*   *Q3:* Cleanup job có cần hoạt động khác đi trong giờ cao điểm (ví dụ: gia hạn thêm) không?
