# Feature: Quản lý Hoàn tiền (Refund Management) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-23  
**Priority:** High  
**Risk Level:** High (Giao dịch hoàn tiền, thay đổi trạng thái đơn hàng, vô hiệu hóa biến thể sản phẩm)  
**Related Specs:** `feature-orders`, `feature-payment`, `feature-products`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Hệ thống hoàn tiền xử lý hai trường hợp chính:
1. **Đơn hủy đã thanh toán**: Khách thanh toán VNPay xong rồi hủy đơn, hoặc đơn bị hủy bởi Manager → cần hoàn tiền
2. **Dừng bán sản phẩm**: Manager quyết định ngưng bán một biến thể (variant) → tất cả đơn đang xử lý chứa sản phẩm cha của biến thể đó cần được hủy và hoàn tiền hàng loạt

Quy trình hoàn tiền gồm 5 bước tuần tự: (1) Vô hiệu hóa biến thể → (2) Xem đơn ảnh hưởng → (3) Tạo lô hoàn tiền → (4) Xem danh sách chờ duyệt → (5) Phê duyệt hoàn tiền.

**Pain point hiện tại:**
- Hoàn tiền thủ công qua ngân hàng, cần theo dõi trạng thái từng yêu cầu
- Cần gom nhiều đơn thành lô (batch) để xử lý hiệu quả
- Khi dừng bán sản phẩm, cần tự động xác định đơn nào bị ảnh hưởng

### 1.2 Goals

1. **Hoàn tiền đơn lẻ**: Manager tạo yêu cầu hoàn cho từng đơn CANCELLED đã thanh toán
2. **Hoàn tiền hàng loạt**: Batch refund khi dừng bán variant → tự hủy đơn liên quan
3. **Phê duyệt 2 bước**: Tạo yêu cầu PENDING → đối soát → phê duyệt COMPLETED
4. **Cập nhật trạng thái liên hoàn**: Refund COMPLETED → Order REFUNDED → Payment UNPAID

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền |
| :--- | :--- | :--- |
| **MANAGER** | Quản lý | Toàn quyền: vô hiệu hóa variant, xem đơn ảnh hưởng, tạo lô hoàn tiền, xem danh sách chờ duyệt, phê duyệt hoàn tiền, từ chối hủy đơn |
| **ADMIN** | Quản trị | Tất cả quyền của MANAGER |
| **CUSTOMER** | Khách hàng | **KHÔNG** có quyền truy cập (chặn bởi `requireRole(['MANAGER', 'ADMIN'])`) |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
> - Backend: `src/backend/controllers/RefundController.js`, `src/backend/models/Refund.js`
> - Routes: `src/backend/routes/refund.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** ALL refund endpoints SHALL require authentication with role `MANAGER` or `ADMIN` (enforced by `router.use(authenticate)` + `router.use(requireRole(['MANAGER', 'ADMIN']))`).

- **U-2:** THE Refund `status` field SHALL be limited to enum `['PENDING', 'COMPLETED', 'FAILED']` with default `'PENDING'`.

- **U-3:** THE refund `amount` SHALL equal `order.total_amount` when `payment_status === 'PAID'`, otherwise `0`.

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Xem Đơn hàng Hủy Đã Thanh toán

- **E-1:** WHEN Manager requests `GET /api/orders/cancelled/paid` with optional `page`, `size` query params, THE system SHALL return paginated list of orders matching `{ status: 'CANCELLED', payment_status: 'PAID' }`, populated with `user_id`, sorted by `created_at` descending.

- **E-2:** WHEN returning results, THE system SHALL map each order to response format:
  ```json
  {
    "orderId": "...", "recipientName": "...", "phoneNumber": "...",
    "totalAmount": 500000, "paidAmount": 500000,
    "orderStatus": "CANCELLED", "deliveryAddress": "...",
    "cancelReason": "Khách hàng yêu cầu hủy đơn", "createdAt": "..."
  }
  ```
  The `cancelReason` is extracted from the most recent CANCELLED entry in `status_history`.

#### 3.2.2 Vô hiệu hóa Biến thể (Step 1)

- **E-3:** WHEN Manager requests `PATCH /api/refunds/variant/:variantId/in-activate`, THE system SHALL set `ProductVariant.status = 'INACTIVE'` using `findByIdAndUpdate`.

- **E-4:** WHEN variant not found, THE system SHALL return HTTP 404 `VARIANT_NOT_FOUND`.

- **E-5:** WHEN successful, THE system SHALL return HTTP 200:
  ```json
  { "code": 0, "message": "Vô hiệu hóa biến thể thành công", "result": {...} }
  ```

#### 3.2.3 Xem Đơn hàng Bị Ảnh hưởng (Step 2)

- **E-6:** WHEN Manager requests `GET /api/refunds/affected-orders/:variantId`, THE system SHALL:
  1. Find the variant to get its `productId`
  2. Find ALL OrderItems with matching `product_id` (parent product — not just the specific variant)
  3. Find orders with those `order_id` values AND `status ∈ ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED']`
  4. Return list with populated user info

- **E-7:** WHEN variant not found, THE system SHALL return HTTP 404 `VARIANT_NOT_FOUND`.

#### 3.2.4 Tạo Lô Hoàn tiền (Step 3 — Batch Create)

- **E-8:** WHEN Manager submits `POST /api/refunds/create-batch` with `{ orderIds: [...] }`, THE system SHALL validate `orderIds` is a non-empty array.

- **E-9:** WHEN valid, THE system SHALL iterate over each orderId:
  1. Find order — skip if not found
  2. Calculate `refundAmount = order.total_amount` if `payment_status === 'PAID'`, otherwise `0`
  3. Change order status to `CANCELLED` with history entry `'Hủy đơn hàng phục vụ tiến trình hoàn tiền hàng loạt'`
  4. Create Refund document with `{ order_id, amount: refundAmount, reason, status: 'PENDING' }`

- **E-10:** WHEN batch creation succeeds, THE system SHALL return HTTP 200 with array of created Refund documents.

#### 3.2.5 Xem Danh sách Hoàn tiền Chờ Duyệt (Step 4)

- **E-11:** WHEN Manager requests `GET /api/refunds/ready`, THE system SHALL return all Refund documents with `status === 'PENDING'`, populated with `order_id` → `user_id`, mapped to format:
  ```json
  {
    "refundId": "...", "amount": 500000, "reason": "...", "status": "PENDING",
    "order": {
      "orderId": "...", "recipientName": "...", "totalAmount": 500000,
      "paidAmount": 500000, "bankInfo": { "bank_name", "bank_account_number", "account_holder_name" }
    }
  }
  ```

#### 3.2.6 Phê duyệt Hoàn tiền (Step 5 — Checkout Refund)

- **E-12:** WHEN Manager submits `POST /api/refunds/:refundId/refund-checkout`, THE system SHALL:
  1. Find Refund by ID — if not found, return HTTP 404 `REFUND_NOT_FOUND`
  2. Set `refund.status = 'COMPLETED'`
  3. Find associated Order → set `order.status = 'REFUNDED'`, `order.payment_status = 'UNPAID'`
  4. Record status history: `'Hoàn tiền thành công. Mã yêu cầu hoàn: ${refundId}'`

- **E-13:** WHEN checkout succeeds, THE system SHALL return HTTP 200:
  ```json
  { "code": 0, "message": "Hoàn tiền thành công", "result": null }
  ```

#### 3.2.7 Từ chối Hủy Đơn (Phục hồi)

- **E-14:** WHEN Manager submits `PUT /api/refunds/reject-cancel/:orderId` with optional `{ reason }`, THE system SHALL delegate to `OrderController.rejectCancellation()` — restoring order to previous status and re-decrementing stock (see `feature-orders` spec E-17, E-18).

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE Refund has `status === 'PENDING'`, THE Manager can phê duyệt (checkout) to move to `COMPLETED`.

- **S-2:** WHILE Refund has `status === 'COMPLETED'`, THE associated Order SHALL have `status === 'REFUNDED'` and `payment_status === 'UNPAID'`.

- **S-3:** WHILE a ProductVariant has `status === 'INACTIVE'`, THE system SHALL prevent new orders containing that variant's parent product from being created (enforced by PricingService).

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE `orderIds` array is empty or missing in batch creation, THE system SHALL return HTTP 400 `VALIDATION_ERROR`.

- **N-2:** WHERE an orderId in the batch does not exist in DB, THE system SHALL skip that entry (no error, continue processing remaining).

- **N-3:** WHERE Refund ID does not exist when attempting checkout, THE system SHALL return HTTP 404 `REFUND_NOT_FOUND`.

- **N-4:** WHERE associated Order has already been deleted (edge case), THE refund checkout SHALL still update refund status to COMPLETED but skip order status update.

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Security):** ALL refund endpoints require `MANAGER` or `ADMIN` role. Middleware applied at router level (`router.use`).

- **NFR-2 (Data Integrity):** Batch operations iterate sequentially (not parallel) to prevent race conditions on order status updates.

- **NFR-3 (Traceability):** Every status change on Order documents includes `updated_by: req.user._id` for audit trail.

---

## 5. Data Model (Mô hình dữ liệu)

### Collection: `refunds`

| Field | Type | Required | Default | Constraints / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `order_id` | ObjectId (ref: Order) | ✅ | — | Đơn hàng cần hoàn tiền |
| `amount` | Number | ✅ | — | Số tiền hoàn (= `order.total_amount` nếu PAID) |
| `reason` | String | — | — | Lý do hoàn tiền |
| `status` | String (Enum) | — | `'PENDING'` | `PENDING`, `COMPLETED`, `FAILED` |
| `created_at` | Date (auto) | — | `Date.now` | Timestamps: `createdAt → created_at` |
| `updated_at` | Date (auto) | — | `Date.now` | Timestamps: `updatedAt → updated_at` |

### Refund Lifecycle

```
  ┌─────────┐    Manager phê duyệt    ┌────────────┐
  │ PENDING │ ────────────────────────→│ COMPLETED  │
  └─────────┘                          └────────────┘
                                              │
                                              │ Side effects:
                                              │ • Order.status → REFUNDED
                                              │ • Order.payment_status → UNPAID
                                              ▼
                                       [Terminal State]
```

### Related Order Status Flow

```
  CANCELLED + PAID  ──→ (Refund PENDING)
                   ──→ (Refund COMPLETED) ──→ Order.status = REFUNDED
                                               Order.payment_status = UNPAID
```

---

## 6. Error Handling (Xử lý lỗi)

| Error Code | HTTP Status | Trigger | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | `orderIds` rỗng hoặc thiếu trong batch | Trả lỗi |
| `VARIANT_NOT_FOUND` | 404 | Variant ID không tồn tại khi in-activate hoặc xem affected | Trả lỗi |
| `REFUND_NOT_FOUND` | 404 | Refund ID không tồn tại khi checkout | Trả lỗi |
| `ORDER_NOT_FOUND` | 404 | Order ID không tồn tại khi reject-cancel | Trả lỗi |
| `INVALID_STATUS` | 400 | Reject-cancel trên đơn không phải CANCELLED | Trả lỗi |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** Đơn hàng X đã CANCELLED và `payment_status = 'PAID'`  
  **When** Manager mở trang danh sách đơn hủy đã thanh toán  
  **Then** Đơn X xuất hiện trong danh sách kèm số tiền đã thanh toán và lý do hủy

- **Given** Manager vô hiệu hóa biến thể V thuộc sản phẩm P  
  **When** Manager xem danh sách đơn ảnh hưởng (`affected-orders/:variantId`)  
  **Then** Hiển thị tất cả đơn đang xử lý (PENDING/AWAITING/CONFIRMED) có chứa sản phẩm P

- **Given** Manager chọn 3 đơn hàng cần hoàn tiền  
  **When** Gửi `POST /api/refunds/create-batch` với `{ orderIds: [id1, id2, id3] }`  
  **Then** 3 Refund PENDING được tạo, 3 đơn chuyển sang CANCELLED

- **Given** Refund R đang ở trạng thái PENDING  
  **When** Manager gửi `POST /api/refunds/:refundId/refund-checkout`  
  **Then** Refund R → COMPLETED, Order tương ứng → REFUNDED, `payment_status → UNPAID`

- **Given** Đơn hàng Y đã CANCELLED nhưng Manager muốn khôi phục  
  **When** Manager gửi `PUT /api/refunds/reject-cancel/:orderId`  
  **Then** Đơn Y phục hồi về trạng thái trước CANCELLED, tồn kho được trừ lại

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** tự động hoàn tiền qua VNPay Refund API — hoàn tiền thực hiện thủ công qua chuyển khoản ngân hàng.
- **KHÔNG** hỗ trợ hoàn tiền một phần (partial refund) — luôn hoàn toàn bộ `total_amount`.
- **KHÔNG** gửi email/SMS thông báo hoàn tiền cho khách hàng.
- **KHÔNG** hỗ trợ lịch sử audit chi tiết cho từng bước hoàn tiền (chỉ ghi trên Order.status_history).
- **KHÔNG** hỗ trợ trạng thái `FAILED` trên Refund (hiện tại chỉ dùng PENDING → COMPLETED).
- **KHÔNG** hỗ trợ tự động phát hiện đơn cần hoàn tiền — Manager phải chủ động xem danh sách.
