# PLAN.md — Checkout & Thanh toán (Checkout Feature Implementation Plan)
# Người viết: @antigravity | Ngày: 2026-06-23

## 1. ARCHITECTURAL APPROACH
Hệ thống áp dụng luồng đặt hàng chuyển hướng thanh toán (Redirect Payment Pattern) kết hợp xử lý tồn kho nguyên tố, sử dụng tác vụ Worker chạy nền để tự động hóa việc giải phóng kho hàng treo.
*   **Atomic Inventory Reservation:** Trừ kho ngay lập tức khi tạo đơn để giữ hàng cho khách đang thanh toán.
*   **Checksum Verification:** 100% đối sánh chữ ký mã hóa VNPay phục vụ cập nhật trạng thái đơn.
*   **Background Expired Cleaner:** Worker ngầm giải quyết vấn đề giữ kho ảo của các giao dịch `PENDING` bị người dùng bỏ dở quá 15 phút.

## 2. COMPONENTS
*   **Order & OrderItem Models:** Chứa dữ liệu hóa đơn, sản phẩm con và thông tin thanh toán VNPay lưu ở các trường phẳng (`payment_status`, `transaction_id`, `paid_at`) + `status_history[]`. OrderItem nhúng `PrescriptionSchema` khi có `lens_id`.
*   **OrderController:**
    - Trách nhiệm: Nhận thông tin gửi lên dạng `multipart/form-data` chứa ảnh toa thuốc, trừ kho variant, khởi tạo bản ghi đơn hàng PENDING.
    - Interface: 
      - Input: `deliveryAddress`, `recipientName`, `phoneNumber`, `prescriptionImage` file.
      - Output: `{ code: 0, result: { orderId, order } }`.
*   **PaymentController:**
    - Trách nhiệm: Báo giá trước checkout (`/payment/orders/requirement`), tạo URL VNPay Sandbox, đối soát SHA512 + số tiền khi nhận callback để cập nhật đơn thành `AWAITING_VERIFICATION`/`CONFIRMED` (thành công) hoặc `CANCELLED` (thất bại). Kèm endpoint dev-only `mock-checkout`. Chữ ký sai / số tiền lệch → không đổi trạng thái đơn.
*   **Background Expired Cleaner (Worker trong server.js):**
    - Trách nhiệm: Quét định kỳ 5 phút/lần để hủy các đơn PENDING cũ hơn 15 phút và tự động hoàn trả kho.
*   **MyOrder & CheckoutPage (React Components):**
    - Trách nhiệm: Thu gom thông tin địa chỉ để lập đơn, cho phép khách hàng nhấn "Thanh toán lại" hoặc khách hàng tự "Hủy đơn" PENDING phục hồi kho.

## 3. DATA FLOW
1.  **Gửi đơn:** Người dùng gửi orders/create kèm tệp ảnh toa thuốc.
2.  **Đặt chỗ kho:** Backend giảm số lượng variant ứng biến. Đơn lưu ở trạng thái `PENDING`.
3.  **Thanh toán:** Gọi `/payment/checkout` lấy link VNPay, chuyển hướng người dùng sang Cổng Sandbox.
4.  **Callback (VNPay):** VNPay gửi phản hồi về `/api/payment/vnpay-callback`. Hệ thống kiểm tra SecureHash + đối chiếu số tiền + guard đơn `PENDING`. Thành công → `AWAITING_VERIFICATION` (đơn có tròng) hoặc `CONFIRMED` (còn lại), `payment_status=PAID`.
5.  **Dọn dẹp:** Nếu khách hủy hoặc quá 15 phút chưa thanh toán, đơn chuyển thành `CANCELLED` và hoàn lại kho.

## 4. DEPENDENCIES
*   **Thứ tự implement:**
    1. Thiết kế Schema `Order` và `OrderItem`.
    2. Viết dịch vụ tính tiền hàng trước checkout `/payment/orders/requirement`.
    3. Thực thi API `/orders/create` (trừ kho và lưu ảnh toa kính).
    4. Tích hợp thanh toán VNPay Sandbox cùng URL Callback kiểm chứng checksum.
    5. Viết Background Cleanup Job tích hợp vào `server.js`.
    6. Xây dựng giao diện đặt hàng FE và Lịch sử đơn hàng có hủy/thanh toán lại.

## 5. RISKS & MITIGATIONS
*   **Rủi ro 1: Race Condition khi nhiều khách tranh mua biến thể gọng kính cuối.**
    - Xác suất: Med | Biện pháp hiện tại: Bọc luồng tạo đơn trong transaction (khi MongoDB replica set), kiểm tra `variant.quantity < qty` rồi trừ kho bằng `$inc: { quantity: -qty }`.
    - **Nợ kỹ thuật:** đây là read-check-then-`$inc`, CHƯA phải điều kiện atomic `$gte: qty` trong một truy vấn duy nhất; ở chế độ standalone (không transaction) vẫn còn khe hở race. Cân nhắc chuyển sang `findOneAndUpdate({ _id, quantity: { $gte: qty } }, { $inc: { quantity: -qty } })` để chốt nguyên tử.
*   **Rủi ro 2: Khách giả mạo thanh toán thành công.**
    - Xác suất: High | Biện pháp: Luôn tạo chữ ký SHA512 từ các tham số nhận được trong Callback, so khớp chính xác 100% với `vnp_SecureHash` gửi kèm của VNPay.
*   **Rủi ro 3: Lỗi rò rỉ bộ nhớ hoặc xung đột tài nguyên từ Background Cleaner.**
    - Xác suất: Low | Biện pháp: Thực hiện query quét đơn hàng nhẹ nhàng, tối ưu hóa index (`status: 1`, `created_at: 1`), chạy ngầm an toàn qua setInterval của Node.js.

## 6. QUESTIONS FOR HUMAN
*   Địa chỉ Redirect khi thanh toán thất bại sẽ trỏ về trang HomePage chính hay thiết lập trang PaymentFailure chuyên dụng? (Hiện tại: Trỏ về trang Checkout thất bại).
