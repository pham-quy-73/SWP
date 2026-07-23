# TASKS.md — Danh sách task: Thanh toán VNPay (Payment Integration)

**Spec ref:** `payment.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo
**Lưu ý:** Risk Level CRITICAL — liên quan đến giao dịch tiền mặt thực tế.

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P001** | ✅ Yêu cầu thanh toán đáng tin cậy | `src/backend/controllers/PaymentController.js` (getPaymentRequirement) | 1.0h | — | U-1, U-2 | Trả về tổng tiền và chi tiết giá từng item lấy từ DB thông qua `PricingService`. |
| **P002** | ✅ Cấu hình môi trường VNPay | `.env` | 0.5h | — | NFR-1 | Định nghĩa đầy đủ `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`. |
| **P003** | ✅ Khởi tạo link thanh toán VNPay | `src/backend/controllers/PaymentController.js` (createPaymentUrl) | 1.5h | P002 | E-5 -> E-9 | Tạo link VNPay v2.1.0 có chữ ký HMAC-SHA512. Cập nhật `payment_initiated_at` trên đơn. |
| **P004** | ✅ Xác thực chữ ký callback | `src/backend/controllers/PaymentController.js` | 1.0h | — | U-4 | Đọc tham số callback, sắp xếp alphabet, verify chữ ký SHA512. |
| **P005** | ✅ VNPay ReturnURL Callback | `src/backend/controllers/PaymentController.js` (vnpayReturn) | 1.0h | P004 | E-10 -> E-12 | Xử lý redirect từ VNPay, gọi settle, chuyển hướng client về trang thành công/thất bại tương ứng. |
| **P006** | ✅ VNPay IPN Handler | `src/backend/controllers/PaymentController.js` (vnpayIpn) | 1.5h | P004 | E-13 -> E-18 | Lắng nghe IPN server-to-server, verify số tiền, trả về đúng spec response code của VNPay. |
| **P007** | ✅ Lõi xử lý Idempotent Settlement | `src/backend/controllers/PaymentController.js` (settleVnpayResult) | 2.0h | — | U-3, E-19, E-20 | Ghi nhận thanh toán thành công/thất bại. Chỉ xử lý khi đơn chưa `PAID`. |
| **P008** | ✅ Khôi phục đơn hàng quá hạn thanh toán | `src/backend/controllers/PaymentController.js` (settleVnpayResult) | 1.5h | P007 | E-21 | Nếu đơn đã bị tự động hủy nhưng trả tiền thành công, cố gắng khôi phục kho. Nếu không đủ kho, đưa vào hàng chờ hoàn tiền thủ công. |
| **P009** | ✅ Mock Checkout (Dev/Test) | `src/backend/controllers/PaymentController.js` (mockCheckout) | 1.0h | — | E-22 -> E-24 | Cho phép giả lập thanh toán thành công/thất bại trên local, chặn hoàn toàn trên production. |

### Tổng kết gap cần xử lý
- **Hiện tại:** Luồng thanh toán VNPay thực tế và Mock đã được cài đặt đầy đủ và chính xác trên backend, đáp ứng các tiêu chuẩn nghiệp vụ và bảo mật trong spec.
