# PLAN.md — Implementation Plan: Thanh toán VNPay (Payment Integration)

**Status:** Done (đã tích hợp code VNPay + Mock checkout)
**Author:** AI Agent
**Date:** 2026-07-23
**Spec ref:** `payment.spec.md`
**Risk Level:** Critical (giao dịch tài chính trực tiếp)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Secure Link Generation:** Sử dụng `PricingService` để tính toán chính xác tổng tiền của đơn hàng từ DB trước khi gửi yêu cầu cho VNPay. Không tin tưởng giá client truyền lên.
- **Idempotent State Controller:** Hàm `settleVnpayResult` dùng làm lõi xử lý kết quả cho cả Return URL và IPN. Kiểm tra trạng thái đơn hàng: nếu đã `PAID` thì lập tức trả về kết quả thành công mà không cập nhật lại DB.
- **Auto-Expired Recovery Mechanism:** Nếu đơn đã bị hủy bởi job dọn dẹp do quá hạn nhưng thanh toán thực tế thành công, tiến hành trừ kho lại. Nếu thành công -> khôi phục trạng thái (`AWAITING_VERIFICATION` hoặc `CONFIRMED`). Nếu thất bại -> giữ `CANCELLED`, đổi `payment_status = 'PAID'` để Manager hoàn tiền thủ công.
- **Environment Isolation:** Chặn cứng route `/mock-checkout` bằng kiểm tra `process.env.NODE_ENV === 'production'`.

### Pattern
| Pattern | Lý do |
| :--- | :--- |
| Shared Settlement Function | Tránh viết lặp logic ở Return URL route và IPN route. |
| HMAC-SHA512 Verification | Đảm bảo tính toàn vẹn dữ liệu từ VNPay. |
| Status-guarded Checkout | Chỉ cho phép tạo link thanh toán khi đơn hàng đang ở trạng thái `PENDING`. |

---

## 2. COMPONENTS

### Backend (đã có)
| Tên | Trách nhiệm | Interface |
| :--- | :--- | :--- |
| `payment.routes.js` ✅ | Định nghĩa các route thanh toán | POST `/orders/requirement`, POST `/checkout`, GET `/vnpay-callback`, GET `/vnpay-ipn`, POST `/mock-checkout` |
| `PaymentController` ✅ | Logic tạo link VNPay, verify chữ ký, đối soát IPN, Mock Checkout | 5 methods |
| `PricingService` ✅ | Tính giá đáng tin cậy | `priceOrderItem` |
| `Order` model ✅ | Lưu trữ thông tin payment trực tiếp trên đơn | `payment_status`, `transaction_id`, `paid_at`, `payment_initiated_at` |

### Frontend (đã có)
| Tên | Trách nhiệm |
| :--- | :--- |
| `CheckoutPage` ✅ | Gọi tính toán requirement, tạo đơn hàng và chuyển hướng sang VNPay |
| `PaymentResultPage` ✅ | Tiếp nhận redirect từ Return URL và hiển thị trạng thái thanh toán |

---

## 3. DATA FLOW

```
[Khởi tạo thanh toán]
  Customer click Thanh toán → POST /api/payment/checkout { orderId }
  → check status === 'PENDING'
  → set payment_initiated_at = now
  → build URL VNPay (HMAC-SHA512 với VNP_HASH_SECRET)
  → Trả về VNPay URL → Client redirect sang VNPay

[VNPay xử lý xong → IPN Callback (Server-to-Server)]
  VNPay gọi GET /api/payment/vnpay-ipn?vnp_SecureHash=...
  → Verify signature & check orderId, check vnp_Amount khớp total_amount
  → Gọi settleVnpayResult(order, transactionNo, responseCode)
      ├─ Nếu responseCode === '00' (Thành công):
      │   ├─ Check status: nếu 'PENDING' -> update 'PAID' + status tiếp theo
      │   └─ Nếu 'CANCELLED' (hết hạn):
      │        └─ Trừ kho lại: thành công -> khôi phục đơn; thất bại -> giữ hủy, mark 'PAID' để hoàn tiền.
      └─ Nếu responseCode !== '00' (Thất bại):
          └─ Hủy đơn, hoàn trả tồn kho.
  → Trả về JSON { RspCode: '00', Message: 'Confirm success' }
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Model `Order` có sẵn các trường payment.
2. **(đã xong)** `PricingService` hoàn chỉnh.
3. **(đã xong)** Tích hợp thuật toán HMAC-SHA512 để verify dữ liệu VNPay.
4. **(đã xong)** `PaymentController` xử lý logic VNPay & Mock.
5. **(đã xong)** Khớp nối frontend redirect và hiển thị kết quả.

### External dependencies
- `google-auth-library` (cho phần Google login trong auth), `crypto` (có sẵn trong Node.js để băm SHA512).

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Tấn công thay đổi số tiền (Price Tampering)** | Med | **High** | Verify số tiền `vnp_Amount` nhận được từ VNPay callback với `total_amount * 100` trong DB. Đã thực hiện. |
| 2 | **Double Payment / Double Settlement** | Med | High | Hàm `settleVnpayResult` kiểm tra `order.payment_status === 'PAID'` trước khi xử lý tiếp. Đã thực hiện. |
| 3 | **Hết kho khi khôi phục đơn hết hạn** | Low | Med | Nếu trừ kho lại thất bại, đánh dấu `payment_status = 'PAID'` nhưng giữ trạng thái đơn là `CANCELLED` để quản lý hoàn tiền thủ công. Đã thực hiện. |
| 4 | **Bảo mật Mock Checkout** | Low | **High** | Chặn Mock Checkout trên môi trường production bằng check `process.env.NODE_ENV`. Đã thực hiện. |

---

## 6. QUESTIONS FOR HUMAN
- **Q1:** Có cần hỗ trợ hoàn tiền tự động thông qua VNPay Refund API không? *(Đề xuất: Chưa tích hợp, xử lý thủ công bằng chuyển khoản là phương án an toàn nhất ở giai đoạn này.)*
