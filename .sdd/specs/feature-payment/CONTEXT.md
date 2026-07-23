# CONTEXT.md — Thanh toán VNPay (Payment Integration Feature)
# Người viết: @antigravity | Ngày: 2026-07-23

## 1. PROBLEM STATEMENT
*   **Thất thoát doanh thu do lệch thông tin thanh toán:** Nếu không có cơ chế đối soát chặt chẽ giữa số tiền trên link thanh toán VNPay và số tiền thực tế cần thanh toán lưu trong DB, kẻ xấu có thể can thiệp sửa đổi tham số link thanh toán để mua hàng với giá rẻ.
*   **Race condition giữa thanh toán và hủy đơn tự động:** Khi khách đang thực hiện thanh toán trên trang VNPay, hệ thống dọn dẹp chạy ngầm có thể hủy đơn do hết hạn 15 phút. Khi VNPay trả về kết quả thành công, đơn hàng đã bị hủy, dẫn đến khách mất tiền mà không nhận được hàng.
*   **Xử lý trùng lặp giao dịch (Idempotency):** Cổng VNPay gửi kết quả qua hai kênh: Return URL (trình duyệt của khách) và IPN (server-to-server). Cả hai kênh này đều có thể kích hoạt xử lý cập nhật trạng thái đơn, cần đảm bảo chỉ ghi nhận thanh toán đúng một lần.

---

## 2. DOMAIN KNOWLEDGE
*   **VNPay Gateway:** Cổng thanh toán bên thứ 3. Giao tiếp qua giao thức HTTP GET/POST có chữ ký bảo mật HMAC-SHA512.
*   **IPN (Instant Payment Notification):** Kênh giao tiếp trực tiếp server-to-server giữa VNPay và server của cửa hàng, là nguồn tin cậy nhất để xác nhận kết quả thanh toán.
*   **Idempotent Settlement:** Quá trình đối soát và cập nhật đơn hàng dựa trên kết quả VNPay, bảo vệ bằng cách kiểm tra trạng thái thanh toán hiện tại của Order trước khi cập nhật tiếp.
*   **Phục hồi đơn hết hạn (Auto-Expired Recovery):** Luồng xử lý đặc biệt khi VNPay báo thanh toán thành công nhưng đơn hàng đã bị hủy tự động. Hệ thống sẽ cố gắng trừ kho lại để khôi phục đơn, nếu hết kho thì giữ hủy và đưa vào hàng chờ hoàn tiền thủ công.

---

## 3. STAKEHOLDERS
*   **Customer:** Nhận link thanh toán, chuyển khoản qua VNPay, nhận kết quả thành công/thất bại trực quan.
*   **VNPay API:** Đối tác nhận yêu cầu tạo link và gửi thông tin đối soát.
*   **Manager/Admin:** Đối soát thủ công khi có sự cố khôi phục đơn thất bại do hết kho.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Mọi tham số gửi/nhận từ VNPay phải được verify chữ ký bằng HMAC-SHA512 và `VNP_HASH_SECRET`.
*   **Business:** Áp dụng chính sách thanh toán 100% trước, không chia nhỏ thanh toán.
*   **Security:** Chặn tính năng Mock Checkout trên môi trường `production`.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng tham số `vnp_TxnRef` luôn chứa chính xác ID dạng string của Order để định danh đơn hàng.
*   Giả định rằng IPN có thể đến trước hoặc sau Return URL và IPN có thể gửi lại nhiều lần nếu server không phản hồi đúng định dạng JSON yêu cầu.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần lưu lịch sử thô (raw log) của tất cả request IPN nhận được từ VNPay vào DB để tra cứu khi tranh chấp không? (Hiện tại: chỉ log ra console/file log server).
