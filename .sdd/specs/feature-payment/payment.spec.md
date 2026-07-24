# Feature: Thanh toán VNPay (Payment Integration) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-15
**Priority:** Critical  
**Risk Level:** Critical (Giao dịch tài chính thực, tích hợp cổng thanh toán bên thứ 3, rủi ro mất tiền)  
**Related Specs:** `feature-orders`, `feature-checkout`, `feature-admin-refunds`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Cửa hàng Optics áp dụng chính sách **thanh toán trước 100%** cho tất cả đơn hàng. Hệ thống tích hợp **VNPay** — cổng thanh toán trực tuyến phổ biến tại Việt Nam — để xử lý thanh toán qua thẻ ngân hàng, ví điện tử. Ngoài ra, hệ thống cung cấp **Mock Checkout** để phát triển và kiểm thử mà không cần VNPay sandbox thực.

**Pain point hiện tại:**
- Khách thanh toán xong nhưng đóng trình duyệt trước khi redirect về → cần IPN (server-to-server) làm nguồn xác nhận chính
- Đơn bị cleanup job tự hủy trong lúc khách đang thanh toán trên VNPay → cần cơ chế phục hồi đơn khi thanh toán về muộn
- Rủi ro thanh toán trùng (duplicate payment) khi cả ReturnURL và IPN cùng về → cần idempotent settlement
- Giá hiển thị trên checkout khác giá thực khi tạo đơn → cần nguồn giá duy nhất (PricingService)

### 1.2 Goals

1. **Tích hợp VNPay chuẩn**: Hỗ trợ VNPay API v2.1.0 với HMAC-SHA512 signature verification
2. **Idempotent settlement**: Cùng một đơn được gọi settle nhiều lần (IPN retry, user refresh) không gây side effect
3. **Phục hồi đơn hết hạn**: Khi cleanup job hủy đơn nhưng khách đã trả tiền, tự động phục hồi nếu còn kho, hoặc đánh dấu PAID cho luồng hoàn tiền thủ công
4. **Nguồn giá tin cậy**: Payment Requirement API dùng chung PricingService với createOrder để giá luôn khớp
5. **Bảo mật**: Chống IDOR (khách không được thanh toán đơn của người khác), chặn mock-checkout trên production

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Payment |
| :--- | :--- | :--- |
| **CUSTOMER** | Khách hàng | Tính toán yêu cầu thanh toán, khởi tạo link VNPay, mock-checkout (chỉ đơn của mình) |
| **MANAGER/ADMIN** | Quản lý | Được phép gọi checkout/mock-checkout cho bất kỳ đơn nào (không bị chặn IDOR) |
| **VNPay Gateway** | Bên thứ 3 | Gửi ReturnURL callback (redirect browser) và IPN (server-to-server) sau khi khách thanh toán |
| **System (PricingService)** | Hệ thống | Tính giá từ DB cho payment requirement — nguồn giá duy nhất |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
> - Backend: `src/backend/controllers/PaymentController.js`
> - Service: `src/backend/services/PricingService.js`
> - Routes: `src/backend/routes/payment.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE system SHALL calculate all prices using `PricingService.priceOrderItem()` — NEVER trust client-submitted prices. Rule: `finalUnitPrice = pickPrice(variant.price, variant.discountPrice) + pickPrice(lens.price, lens.discountPrice)` where `pickPrice` returns `discountPrice` if `> 0`, otherwise `price`.

- **U-2:** THE system SHALL enforce 100% prepayment policy: `paymentPercentage` is ALWAYS `1.0`, `remainingPaymentTotal` is ALWAYS `0`. These fields exist for UI rendering compatibility but SHALL NOT imply partial payment support.

- **U-3:** THE `settleVnpayResult()` function SHALL be idempotent — calling it multiple times for the same order SHALL NOT change the outcome beyond the first call.

- **U-4:** THE system SHALL verify VNPay callback signatures using HMAC-SHA512 with `VNP_HASH_SECRET` on ALL parameters (sorted alphabetically, excluding `vnp_SecureHash` and `vnp_SecureHashType`).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Tính toán Yêu cầu Thanh toán (Payment Requirement)

- **E-1:** WHEN Customer submits `POST /api/payment/orders/requirement` with `{ items: [{ productVariantId, lensId?, quantity }] }`, THE system SHALL iterate over each item, price it via PricingService, and return:
  ```json
  {
    "code": 0,
    "result": {
      "orderTotal": 1500000,
      "requiredAmount": 1500000,
      "requiredPaymentTotal": 1500000,
      "remainingPaymentTotal": 0,
      "itemRequirements": [{
        "productVariantId": "...",
        "lensId": "...",
        "unitPrice": 500000,
        "lensPrice": 250000,
        "itemTotal": 750000,
        "paymentPercentage": 1.0,
        "requiredPayment": 750000
      }]
    }
  }
  ```

- **E-2:** WHEN `items` array is empty or missing, THE system SHALL return HTTP 400 `VALIDATION_ERROR`.

- **E-3:** WHEN `items.length > 50`, THE system SHALL return HTTP 400 `VALIDATION_ERROR`.

- **E-4:** WHEN `quantity` is not a positive integer, THE system SHALL return HTTP 400 `VALIDATION_ERROR`.

#### 3.2.2 Khởi tạo Link Thanh toán VNPay (Checkout)

- **E-5:** WHEN authenticated user submits `POST /api/payment/checkout` with `{ orderId }` (or query param), THE system SHALL validate: (1) order exists, (2) IDOR check for CUSTOMER role (`order.user_id === req.user._id`), (3) order status is `PENDING`.

- **E-6:** WHEN order is not PENDING, THE system SHALL return HTTP 400 with contextual message: if `payment_status === 'PAID'` → `'Đơn hàng này đã được thanh toán.'`; otherwise → `'Đơn hàng không còn ở trạng thái chờ thanh toán.'`.

- **E-7:** WHEN VNPay config is incomplete (missing `VNP_TMN_CODE`, `VNP_HASH_SECRET`, or `VNP_RETURN_URL`), THE system SHALL return HTTP 500 `CONFIG_ERROR`.

- **E-8:** WHEN checkout is valid, THE system SHALL construct VNPay payment URL with parameters:
  - `vnp_Version`: `'2.1.0'`
  - `vnp_Command`: `'pay'`
  - `vnp_TmnCode`: from `VNP_TMN_CODE` env
  - `vnp_Amount`: `order.total_amount * 100` (VNPay format: amount in cents)
  - `vnp_TxnRef`: `order._id.toString()`
  - `vnp_ReturnUrl`: from `VNP_RETURN_URL` env
  - Sign with HMAC-SHA512 using `VNP_HASH_SECRET`

- **E-9:** WHEN payment URL is generated, THE system SHALL set `order.payment_initiated_at = new Date()` (extends cleanup job grace period by 30 minutes) and return HTTP 200 `{ code: 0, result: paymentUrl }`.

#### 3.2.3 VNPay ReturnURL Callback

- **E-10:** WHEN VNPay redirects browser to `GET /api/payment/vnpay-callback` with signed query params, THE system SHALL: (1) verify HMAC signature, (2) find order by `vnp_TxnRef`, (3) call `settleVnpayResult()`, (4) redirect browser to frontend success/failure page.

- **E-11:** WHEN signature is invalid OR order not found, THE system SHALL redirect to `${clientUrl}/checkout/failure`.

- **E-12:** WHEN settlement outcome is `SUCCESS`, `RECOVERED`, or `ALREADY_PAID`, THE system SHALL redirect to `${clientUrl}/checkout/success?orderId=...&email=...`.

#### 3.2.4 VNPay IPN (Server-to-Server)

- **E-13:** WHEN VNPay sends IPN to `GET /api/payment/vnpay-ipn`, THE system SHALL verify signature and respond with VNPay-spec JSON format `{ RspCode, Message }`.

- **E-14:** WHEN signature is invalid, THE system SHALL respond `{ RspCode: '97', Message: 'Invalid signature' }`.

- **E-15:** WHEN order is not found, THE system SHALL respond `{ RspCode: '01', Message: 'Order not found' }`.

- **E-16:** WHEN `vnp_Amount` does not match `order.total_amount * 100`, THE system SHALL respond `{ RspCode: '04', Message: 'Invalid amount' }`.

- **E-17:** WHEN order is already paid or finalized, THE system SHALL respond `{ RspCode: '02', Message: 'Order already confirmed' }`.

- **E-18:** WHEN settlement succeeds (any outcome), THE system SHALL respond `{ RspCode: '00', Message: 'Confirm success' }`.

#### 3.2.5 Settlement Logic (settleVnpayResult — Shared)

- **E-19:** WHEN `vnp_ResponseCode === '00'` AND order is `PENDING`, THE system SHALL:
  - Determine next status: `AWAITING_VERIFICATION` if order has prescription, `CONFIRMED` otherwise
  - Set `payment_status = 'PAID'`, `transaction_id`, `paid_at`
  - Record status history
  - Return `{ outcome: 'SUCCESS' }`

- **E-20:** WHEN `vnp_ResponseCode !== '00'` AND order is `PENDING`, THE system SHALL:
  - Restore inventory for all order items (same as cancelOrder)
  - Set status to `CANCELLED`, `payment_status = 'UNPAID'`
  - Return `{ outcome: 'FAILED' }`

- **E-21:** WHEN `vnp_ResponseCode === '00'` AND order is `CANCELLED` with `AUTO_EXPIRED` history note (cleanup job killed it), THE system SHALL attempt recovery:
  - Try to re-decrement stock for all items (conditional `$gte`)
  - IF stock sufficient: restore order to post-payment status, return `{ outcome: 'RECOVERED' }`
  - IF stock insufficient: rollback partial decrements, keep CANCELLED but set `payment_status = 'PAID'` (enters refund queue), return `{ outcome: 'RECOVERED_NO_STOCK' }`

#### 3.2.6 Mock Checkout (Dev/Test Only)

- **E-22:** WHEN `POST /api/payment/mock-checkout` is called in `production` environment, THE system SHALL return HTTP 403 `FORBIDDEN`.

- **E-23:** WHEN `simulateStatus === 'SUCCESS'`, THE system SHALL: determine next status (AWAITING_VERIFICATION or CONFIRMED based on prescription), set `payment_status = 'PAID'`, `transaction_id = 'MOCK_TXN_' + Date.now()`, return redirect URL to success page.

- **E-24:** WHEN `simulateStatus !== 'SUCCESS'` (failure), THE system SHALL: restore inventory for all items, set status to `CANCELLED`, `payment_status = 'UNPAID'`, return redirect URL to failure page.

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE order has `status !== 'PENDING'`, THE checkout endpoint SHALL reject payment link creation (prevent double payment or payment on dead orders).

- **S-2:** WHILE order has `payment_status === 'PAID'` AND `status === 'CANCELLED'`, THE order SHALL appear in refund management queue for Manager processing.

- **S-3:** WHILE `NODE_ENV === 'production'`, THE mock-checkout endpoint SHALL be completely disabled.

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE VNPay IPN arrives BEFORE ReturnURL callback, THE settlement SHALL complete on IPN; WHEN ReturnURL arrives, `settleVnpayResult` SHALL detect `ALREADY_PAID` and simply redirect to success page without re-processing.

- **N-2:** WHERE cleanup job auto-cancels an order AND VNPay IPN arrives with successful payment AFTER cancellation, THE system SHALL detect `AUTO_EXPIRED` marker in history and attempt order recovery (E-21).

- **N-3:** WHERE Customer attempts to pay for another user's order, THE system SHALL return HTTP 403 `FORBIDDEN` (IDOR prevention).

- **N-4:** WHERE `vnp_Amount` from VNPay callback differs from `order.total_amount * 100`, THE system SHALL reject the transaction as `AMOUNT_MISMATCH` (tamper detection).

- **N-5:** WHERE VNPay IPN encounters an unhandled exception, THE system SHALL respond `{ RspCode: '99', Message: 'Unknown error' }` (VNPay will retry).

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Security):** VNPay signature verification SHALL use HMAC-SHA512 with `VNP_HASH_SECRET`. ALL environment variables (`VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`) SHALL be loaded from `.env` — NEVER hardcoded.

- **NFR-2 (Idempotency):** Settlement logic SHALL be called from BOTH ReturnURL and IPN without side effects on repeated calls. State checks at the beginning of `settleVnpayResult` prevent double-processing.

- **NFR-3 (Availability):** VNPay IPN endpoint SHALL always return HTTP 200 (VNPay spec requirement) even on internal errors — using `RspCode: '99'` to signal retry.

- **NFR-4 (Amount Validation):** THE system SHALL validate `vnp_Amount` against DB-stored `total_amount * 100` to detect request tampering. Integer comparison prevents floating-point issues.

---

## 5. Data Model (Mô hình dữ liệu)

Payment data is stored directly on the `Order` document (no separate Payment collection):

| Field on `Order` | Type | Purpose |
| :--- | :--- | :--- |
| `payment_status` | String (`UNPAID` / `PAID`) | Trạng thái thanh toán |
| `transaction_id` | String | Mã giao dịch VNPay (`vnp_TransactionNo`) hoặc `MOCK_TXN_...` |
| `paid_at` | Date | Thời điểm thanh toán thành công |
| `payment_initiated_at` | Date | Thời điểm tạo link VNPay (gia hạn cleanup 30 phút) |

**Không có collection riêng cho Payment** — thiết kế này giảm JOIN khi query đơn hàng + trạng thái thanh toán.

### VNPay Parameters Mapping

| VNPay Param | DB Field | Conversion |
| :--- | :--- | :--- |
| `vnp_TxnRef` | `order._id` | Direct ObjectId string |
| `vnp_Amount` | `order.total_amount` | `× 100` (VNPay = cents) |
| `vnp_TransactionNo` | `order.transaction_id` | Direct string |
| `vnp_ResponseCode` | — | `'00'` = success, else failure |

---

## 6. Error Handling (Xử lý lỗi)

| Error Code | HTTP Status | Trigger | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Items rỗng, quantity invalid, thiếu orderId | Trả lỗi |
| `ORDER_NOT_FOUND` | 404 | Order ID không tồn tại | Trả lỗi |
| `FORBIDDEN` | 403 | IDOR: Customer thanh toán đơn người khác; mock-checkout trên production | Trả lỗi |
| `INVALID_STATUS` | 400 | Thanh toán đơn không phải PENDING, hoặc đơn đã thanh toán | Trả lỗi kèm message ngữ cảnh |
| `CONFIG_ERROR` | 500 | VNPay env vars chưa cấu hình | Trả lỗi (server-side) |
| `VARIANT_NOT_FOUND` | 400 | PricingService không tìm thấy variant | Trả lỗi từ PricingError |
| `INVALID_LENS` | 400 | Tròng kính không hợp lệ / INACTIVE | Trả lỗi từ PricingError |
| VNPay RspCode `97` | 200 | Chữ ký VNPay không hợp lệ | Trả `{ RspCode: '97' }` |
| VNPay RspCode `01` | 200 | Đơn hàng không tồn tại | Trả `{ RspCode: '01' }` |
| VNPay RspCode `04` | 200 | Số tiền không khớp | Trả `{ RspCode: '04' }` |
| VNPay RspCode `02` | 200 | Đơn đã xử lý rồi | Trả `{ RspCode: '02' }` |
| VNPay RspCode `99` | 200 | Lỗi hệ thống không xác định | Trả `{ RspCode: '99' }` — VNPay sẽ retry |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** Customer có đơn hàng PENDING với `total_amount = 500000`  
  **When** Customer gọi `POST /api/payment/checkout`  
  **Then** Hệ thống trả URL VNPay chứa `vnp_Amount=50000000` (× 100), `vnp_TxnRef = orderId`

- **Given** VNPay IPN gửi callback với `vnp_ResponseCode = '00'` và chữ ký hợp lệ  
  **When** Hệ thống xử lý IPN  
  **Then** Order chuyển sang CONFIRMED hoặc AWAITING_VERIFICATION, `payment_status = 'PAID'`

- **Given** Cleanup job đã hủy đơn (AUTO_EXPIRED) nhưng VNPay IPN về với `responseCode = '00'`  
  **When** Hệ thống xử lý IPN  
  **Then** Nếu còn kho: phục hồi đơn (RECOVERED); nếu hết kho: giữ CANCELLED nhưng đánh dấu PAID (RECOVERED_NO_STOCK)

- **Given** VNPay IPN đã xử lý đơn thành công  
  **When** ReturnURL callback đến sau  
  **Then** `settleVnpayResult` trả `ALREADY_PAID`, redirect về success page (idempotent)

- **Given** Môi trường production  
  **When** Request `POST /api/payment/mock-checkout`  
  **Then** Hệ thống trả HTTP 403 FORBIDDEN

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** hỗ trợ thanh toán một phần (partial payment / installments).
- **KHÔNG** hỗ trợ thanh toán COD (Cash on Delivery).
- **KHÔNG** hỗ trợ nhiều cổng thanh toán — chỉ VNPay.
- **KHÔNG** lưu thông tin thẻ ngân hàng của khách (tokenization).
- **KHÔNG** tự động hoàn tiền qua VNPay API — hoàn tiền xử lý thủ công bởi Manager.
- **KHÔNG** gửi email xác nhận thanh toán thành công cho khách.
- **KHÔNG** hỗ trợ thanh toán đa tiền tệ — chỉ VND.
