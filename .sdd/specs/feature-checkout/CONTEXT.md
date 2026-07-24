# CONTEXT.md — Checkout & Thanh toán VNPay (Checkout & Payment Feature)

## 1. PROBLEM STATEMENT
*   **Rủi ro găm giữ tồn kho ảo:** Khi khách hàng đặt mua kính mắt nhưng không thanh toán kịp thời (ví dụ: tắt tab thanh toán VNPay giữa chừng), hệ thống sẽ bị găm tồn kho ảo. Điều này khiến những khách hàng có nhu cầu thực sự không thể tiếp cận và mua sản phẩm đó.
*   **Giả mạo số liệu giao dịch thanh toán:** Nếu không có cơ chế đối soát chữ ký an toàn khi nhận phản hồi callback từ cổng thanh toán VNPay, hệ thống có thể bị kẻ xấu giả mạo thông tin thanh toán để trục lợi đơn hàng miễn phí.

---

## 2. DOMAIN KNOWLEDGE
*   **Hóa đơn mua hàng (Order):** Phiếu ghi nhận thông tin bán hàng với 6 trạng thái vòng đời: `PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REFUNDED`. Đơn có gắn tròng kính đi qua `AWAITING_VERIFICATION` (chờ kỹ thuật viên xác minh đơn kính) trước khi `CONFIRMED`. Thông tin thanh toán lưu bằng các trường phẳng (`payment_status`, `transaction_id`, `paid_at`) chứ không nhúng object `paymentInfo`.
*   **Tên miền VNPay Sandbox:** Cổng thanh toán giả lập trực tuyến phục vụ kiểm thử tích điểm giao dịch.
*   **Chữ ký bảo mật (vnp_SecureHash):** Chuỗi ký SHA512 đảm bảo tính toàn vẹn dữ liệu truyền nhận giữa máy chủ Optics và VNPay.
*   **Worker dọn dẹp nền (Cleanup Job):** Tiến trình ngầm tự động tìm kiếm để giải phóng các đơn hàng treo chưa thanh toán.

---

## 3. STAKEHOLDERS
*   **Người được lợi trực tiếp:**
    - Khách hàng (thanh toán an toàn, dễ dàng khôi phục thanh toán khi gặp sự cố, tự hủy đơn nhầm).
    - Cửa hàng (kiểm soát kho hàng chặt chẽ, tối ưu luồng hàng bán thực tế).
*   **Người chịu ảnh hưởng nghiệp vụ:**
    - Quản lý & Nhân viên đóng gói (nhận dữ liệu đơn hàng đã trả tiền chính xác để chuẩn bị giao hàng).

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:**
    - Chỉ cho phép sử dụng duy nhất cổng VNPay Merchant Sandbox (COD đã bị dừng vô thời hạn).
    - Phải triển khai dọn dẹp các đơn PENDING cũ trong vòng tối đa 15 phút, giải cứu tồn kho ngay trong ứng dụng Backend Express.
*   **Bảo mật:** Trạng thái đơn chuyển sang `CONFIRMED` bắt buộc phải khớp chữ ký `vnp_SecureHash` từ cổng VNPay đối chiều.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng khách hàng đồng ý với quy định tự động hủy giỏ hàng tạm thời (Zustand clear) sau khi đã chuyển sang trang liên kết VNPay.
*   Giả định rằng cổng VNPay Sandbox hoạt động ổn định và phản hồi IPN callback chính xác đến Router.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần áp dụng cơ chế khóa tài khoản hoặc cảnh báo nếu khách hàng có quá nhiều đơn hàng PENDING bị hủy liên tiếp hay không? (Hiện tại: Chưa triển khai hạn chế này).
