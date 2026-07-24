# Feature: Quản lý Đơn hàng (Order Management) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-23  
**Priority:** Critical  
**Risk Level:** Critical (Giao dịch tài chính, quản lý tồn kho, dữ liệu đơn kính y tế)  
**Related Specs:** `feature-payment`, `feature-products`, `feature-checkout`, `feature-admin-refunds`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Hệ thống Optics Management xoay quanh vòng đời đơn hàng — từ lúc khách hàng đặt mua gọng kính (có hoặc không kèm tròng kính thuốc) cho đến khi đơn hoàn thành hoặc bị hủy. Đây là feature cốt lõi nhất, kết nối:
- **Sản phẩm & Tồn kho** (ProductVariant): trừ kho khi tạo đơn, hoàn kho khi hủy
- **Thanh toán** (VNPay / Mock): đơn PENDING → thanh toán → CONFIRMED/AWAITING_VERIFICATION
- **Hoàn tiền** (Refund): đơn đã thanh toán bị hủy → đi vào luồng refund
- **Đơn kính y tế** (Prescription): đơn có tròng kính cần KTV xác minh trước khi giao

**Pain point hiện tại:**
- Đơn hàng PENDING bị treo vô thời hạn nếu khách không thanh toán → cần cleanup job tự động
- Race condition khi nhiều khách cùng mua sản phẩm tồn kho ít → cần trừ kho atomic
- Đơn kính thuốc sai thông số → cần KTV sửa trực tiếp thay vì hủy toàn bộ đơn
- Manager bị giới hạn state machine nhưng Admin cần override khi có tình huống đặc biệt

### 1.2 Goals

1. **Tạo đơn hàng atomic**: Trừ tồn kho + tạo Order + tạo OrderItem trong cùng một transaction (fallback khi MongoDB standalone)
2. **State Machine nghiêm ngặt**: Manager chỉ được chuyển trạng thái theo quy tắc; Admin có quyền override toàn bộ
3. **Bảo vệ tồn kho**: Không bao giờ để kho âm — sử dụng conditional update `$gte` trên mọi thao tác trừ kho
4. **Tự động dọn dẹp**: Đơn PENDING quá 15 phút không thanh toán sẽ bị hủy tự động, hoàn kho
5. **Hỗ trợ đơn kính**: KTV/Manager có thể sửa thông số đơn kính khi đơn ở trạng thái AWAITING_VERIFICATION
6. **Audit trail**: Mọi thay đổi trạng thái đều ghi lại trong `status_history` kèm người thực hiện và ghi chú

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Order Management |
| :--- | :--- | :--- |
| **CUSTOMER** | Khách hàng | Tạo đơn hàng, xem lịch sử đơn hàng của mình, hủy đơn PENDING/AWAITING_VERIFICATION/CONFIRMED (chỉ đơn của mình) |
| **MANAGER** | Quản lý | Xem tất cả đơn hàng, cập nhật trạng thái theo state machine, từ chối hủy đơn, sửa đơn kính. **KHÔNG** được override state machine, **KHÔNG** được xóa đơn, **KHÔNG** được chuyển sang REFUNDED thủ công |
| **ADMIN** | Quản trị | Toàn quyền: tất cả quyền của MANAGER + override state machine + xóa đơn hàng vĩnh viễn |
| **System (Cleanup Job)** | Hệ thống | Quét định kỳ 5 phút, tự động hủy đơn PENDING quá 15 phút chưa thanh toán (có gia hạn 30 phút nếu khách đang ở trang VNPay) |
| **System (PricingService)** | Hệ thống | Nguồn giá duy nhất — tính giá từ DB, không tin giá client gửi lên |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
> - Backend: `src/backend/controllers/OrderController.js`, `src/backend/models/Order.js`, `src/backend/models/OrderItem.js`
> - Service: `src/backend/services/PricingService.js`
> - Job: `src/backend/jobs/orderCleanupJob.js`
> - Routes: `src/backend/routes/order.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE system SHALL use `PricingService.priceOrderItem()` as the SINGLE SOURCE OF TRUTH for pricing — unit price is ALWAYS calculated from database (`ProductVariant.price/discountPrice` + `Lens.price/discountPrice`), NEVER from client-submitted values.

- **U-2:** THE system SHALL protect inventory from going negative by using MongoDB conditional update `{ quantity: { $gte: requiredQty } }` with `$inc: { quantity: -qty }` on ALL stock decrement operations.

- **U-3:** THE system SHALL record every status transition in the `status_history` array with fields: `from_status`, `to_status`, `updated_by` (User ObjectId), `updated_at`, `is_override` (Boolean), `note` (String).

- **U-4:** THE Order status enum SHALL be limited to: `PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REFUNDED`.

- **U-5:** THE payment_status field SHALL be limited to: `UNPAID`, `PAID`.

- **U-6:** THE system SHALL limit maximum items per order to 50 to prevent abuse (excessive DB queries per order creation).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Tạo Đơn Hàng (Create Order — Customer)

- **E-1:** WHEN Customer submits `POST /api/orders/create` with payload `{ orderInfo: { items, recipientName, deliveryAddress, phoneNumber, bankInfo } }`, THE system SHALL wrap the entire flow (validate → price → decrement stock → create Order → create OrderItems) in a MongoDB transaction; IF MongoDB is standalone (no replica set), SHALL fallback to non-transactional execution with manual rollback on failure.

- **E-2:** WHEN creating order, THE system SHALL validate each item's `quantity` is a positive integer (≥ 1); IF invalid, SHALL return HTTP 400 `VALIDATION_ERROR`.

- **E-3:** WHEN `phoneNumber` is provided, THE system SHALL validate it matches Vietnamese format `^(\+84|0)\d{8,10}$` (after removing spaces, dots, dashes); IF invalid, SHALL return HTTP 400 `VALIDATION_ERROR`.

- **E-4:** WHEN `bankInfo.bank_account_number` is provided, THE system SHALL validate it contains only digits; IF invalid, SHALL return HTTP 400 `VALIDATION_ERROR`.

- **E-5:** WHEN an item has `lensId`, THE system SHALL validate the `prescription` object against strict medical constraints: SPH in `[-20.00..20.00]`, CYL in `[-6.00..6.00]`, AXIS in `[1..180]` (mandatory if CYL !== 0), ADD in `[0.75..4.00]`, and PD in `[20.0..40.0]`. If any field is invalid or out of range, the system SHALL return HTTP 400 `VALIDATION_ERROR` with a descriptive message. WHEN item has NO `lensId`, THE system SHALL ignore the prescription and set `prescription = null`.

- **E-6:** WHEN variant stock is insufficient during conditional decrement (`findOneAndUpdate` returns null), THE system SHALL rollback all previously decremented variants (in non-transaction mode) and return HTTP 400 `OUT_OF_STOCK` with message specifying color name and available quantity.

- **E-7:** WHEN order creation succeeds, THE system SHALL return HTTP 201 with:
  ```json
  { "code": 0, "message": "Tạo đơn hàng thành công", "result": { "orderId": "...", "order": {...} } }
  ```

#### 3.2.2 Xem Lịch sử Đơn hàng (My Orders — Customer)

- **E-8:** WHEN Customer requests `GET /api/orders/me` with optional query params (`page`, `size`, `status`), THE system SHALL return paginated list of orders owned by `req.user._id`, sorted by `created_at` descending, with populated items including product name, variant details (colorName, sizeLabel, SKU, imageUrl), lens info, and prescription.

- **E-9:** WHEN processing individual order items, IF an error occurs (e.g., deleted product reference), THE system SHALL gracefully degrade by returning a placeholder entry `{ orderName: 'Đơn hàng lỗi dữ liệu', items: [] }` instead of failing the entire request.

- **E-10:** WHEN calculating `remainingAmount`, THE system SHALL return `total_amount` for PENDING orders (unpaid) and `0` for all other statuses (policy: 100% prepayment required).

#### 3.2.3 Xem Tất Cả Đơn hàng (All Orders — Manager/Admin)

- **E-11:** WHEN Manager/Admin requests `GET /api/orders` with optional `status` query param, THE system SHALL return all orders (no pagination) with populated `user_id` (username, email, first_name, last_name, phone), sorted by `created_at` descending.

#### 3.2.4 Xem Chi tiết Đơn hàng (Order Detail)

- **E-12:** WHEN any authenticated user requests `GET /api/orders/:id`, THE system SHALL return order details with populated `user_id`, `status_history.updated_by`, and all OrderItems with populated `product_id`, `variant_id`, `lens_id`.

- **E-13:** WHEN requesting user has role `CUSTOMER` AND `order.user_id._id !== req.user._id`, THE system SHALL return HTTP 403 `FORBIDDEN`.

- **E-14:** WHEN an OrderItem has prescription with all-zero sphere/cylinder AND the order has `prescription_image`, THE system SHALL backfill `prescription.imageUrl` from `order.prescription_image` (compatibility: image-only prescriptions uploaded at order level).

#### 3.2.5 Hủy Đơn hàng (Cancel Order — Customer)

- **E-15:** WHEN Customer requests `PUT /api/orders/:id/cancel` with optional `{ reason }`, THE system SHALL validate: (1) order exists, (2) Customer owns the order (`order.user_id === req.user._id`), (3) order status is one of `PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED`.

- **E-16:** WHEN cancellation is valid, THE system SHALL restore inventory for ALL items in the order using `$inc: { quantity: +item.quantity }`, set status to `CANCELLED`, record history with cancel reason, and return HTTP 200.

#### 3.2.6 Từ chối Hủy Đơn (Reject Cancellation — Manager/Admin)

- **E-17:** WHEN Manager/Admin requests `PUT /api/orders/:id/reject-cancel` with optional `{ reason }`, THE system SHALL validate order exists AND has status `CANCELLED`.

- **E-18:** WHEN rejecting cancellation, THE system SHALL: (1) find the most recent non-CANCELLED status in `status_history` (default: `CONFIRMED`), (2) decrement stock back for all items, (3) restore order to that previous status, (4) record history with rejection reason.

#### 3.2.7 Cập nhật Trạng thái (Update Status — Manager/Admin)

- **E-19:** WHEN Manager/Admin requests `PUT /api/orders/:id/status` with `{ status, note? }`, THE system SHALL validate `status` is one of the allowed enum values.

- **E-20:** WHEN user role is `MANAGER`, THE system SHALL enforce the following State Machine:
  ```
  PENDING             → [CANCELLED]
  AWAITING_VERIFICATION → [CONFIRMED, CANCELLED]
  CONFIRMED           → [COMPLETED, CANCELLED]
  COMPLETED           → [] (terminal)
  CANCELLED           → [] (terminal)
  REFUNDED            → [] (terminal)
  ```
  Additionally, MANAGER SHALL NOT be allowed to manually transition to `REFUNDED` (reserved for refund flow only).

- **E-21:** WHEN user role is `ADMIN`, THE system SHALL bypass the state machine (override) and allow ANY status transition, logging `is_override: true` and emitting a security audit log to console.

- **E-22:** WHEN transitioning TO `CANCELLED` (from non-CANCELLED), THE system SHALL restore inventory for all items.

- **E-23:** WHEN transitioning FROM `CANCELLED` (to non-CANCELLED, e.g., ADMIN override), THE system SHALL decrement inventory for all items.

#### 3.2.8 Cập nhật Đơn kính (Update Prescription — Manager/Admin)

- **E-24:** WHEN Manager/Admin requests `PUT /api/orders/:id/items/:itemId/prescription` with `{ prescription, note? }`, THE system SHALL validate: (1) order exists, (2) order status is `AWAITING_VERIFICATION`, (3) OrderItem belongs to the order, (4) OrderItem has `lens_id` (gắn tròng kính).

- **E-25:** WHEN updating prescription, THE system SHALL validate values using same strict rules as creation (E-5), return HTTP 400 `VALIDATION_ERROR` if invalid, preserve existing `imageUrl`, save the updated prescription, and record an audit trail in `status_history` (status unchanged, note references the item ID and reason).

#### 3.2.9 Xóa Đơn hàng (Delete Order — Admin Only)

- **E-26:** WHEN Admin requests `DELETE /api/orders/:id`, THE system SHALL permanently delete the Order document AND all associated OrderItem documents using `findByIdAndDelete` + `deleteMany`.

- **E-27:** WHEN deletion succeeds, THE system SHALL return HTTP 200 `{ code: 0, message: 'Đơn hàng và các sản phẩm liên quan đã được xóa thành công' }`.

#### 3.2.10 Auto-Cleanup Job (System)

- **E-28:** WHEN the cleanup job runs (every 5 minutes via `setInterval`), THE system SHALL find all orders matching: `status === 'PENDING'` AND `payment_status === 'UNPAID'` AND `created_at < 15 minutes ago` AND (`payment_initiated_at` is null OR `payment_initiated_at < 30 minutes ago`).

- **E-29:** WHEN an expired order is found, THE system SHALL restore inventory for all items, set status to `CANCELLED`, record history with note prefix `AUTO_EXPIRED:` (used by payment callback to detect and recover auto-expired orders).

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE order has `status === 'PENDING'`, THE system SHALL allow: checkout (create VNPay link), cancel, mock-checkout. THE system SHALL NOT allow: update to REFUNDED (by Manager).

- **S-2:** WHILE order has `status === 'AWAITING_VERIFICATION'`, THE system SHALL allow: update prescription by KTV/Manager, transition to CONFIRMED or CANCELLED.

- **S-3:** WHILE order has `status === 'CONFIRMED'`, THE system SHALL allow: transition to COMPLETED or CANCELLED.

- **S-4:** WHILE order has `status === 'COMPLETED'` OR `'REFUNDED'`, THE order SHALL be in a terminal state — no further transitions allowed (except by ADMIN override).

- **S-5:** WHILE order has `status === 'CANCELLED'` AND `payment_status === 'PAID'`, THE order SHALL appear in the refund management dashboard (`RefundController.getCancelledPaidOrders`).

### 3.4 Optional / Where (Tùy chọn)

- **O-1:** WHERE MongoDB supports replica set, THE system SHALL use `session.withTransaction()` for atomic order creation; WHERE MongoDB is standalone (error code 20), SHALL fallback to sequential execution with manual rollback.

- **O-2:** WHERE order contains items with `lens_id` or non-empty `prescription`, THE system SHALL route to `AWAITING_VERIFICATION` after payment instead of `CONFIRMED` (prescription orders need KTV review).

- **O-3:** WHERE `prescriptionImage` file is uploaded via `multer`, THE system SHALL save to `/uploads/` and assign URL to the matching item's `prescription.imageUrl`.

### 3.5 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE two customers simultaneously attempt to purchase the last unit of a variant, THE system SHALL use conditional decrement (`quantity: { $gte: qty }`) — the second request SHALL fail with `OUT_OF_STOCK` without causing negative inventory.

- **N-2:** WHERE Manager attempts to transition order to `REFUNDED` manually, THE system SHALL return HTTP 400 `FORBIDDEN_TRANSITION`.

- **N-3:** WHERE Manager attempts an invalid state transition (e.g., COMPLETED → PENDING), THE system SHALL return HTTP 400 `INVALID_TRANSITION`.

- **N-4:** WHERE Customer attempts to cancel an order not belonging to them, THE system SHALL return HTTP 403 `FORBIDDEN`.

- **N-5:** WHERE Customer attempts to cancel an order in COMPLETED/CANCELLED/REFUNDED state, THE system SHALL return HTTP 400 `INVALID_STATUS`.

- **N-6:** WHERE cleanup job encounters a race condition with a concurrent payment callback, THE payment callback SHALL use the `AUTO_EXPIRED` history note to detect and recover the order (see `feature-payment` spec).

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Atomicity):** Order creation (stock decrement + Order + OrderItems) SHALL be wrapped in a MongoDB transaction when replica set is available. Fallback to manual rollback SHALL handle all partial-failure scenarios.

- **NFR-2 (Performance):** Cleanup job SHALL run at 5-minute intervals (`setInterval(fn, 300_000)`), processing expired orders sequentially. SHALL NOT impact API response times.

- **NFR-3 (Security):** Route-level authorization enforced via `authenticate` + `requireRole()` middleware:
  - `POST /create`, `GET /me`, `PUT /:id/cancel` → authenticated (any role)
  - `GET /`, `PUT /:id/status`, `PUT /:id/items/:itemId/prescription`, `PUT /:id/reject-cancel` → `MANAGER` or `ADMIN`
  - `DELETE /:id` → `ADMIN` only

- **NFR-4 (Audit):** All status changes SHALL be logged in `status_history` with timestamp, actor, and override flag. ADMIN overrides SHALL additionally emit a `console.warn` with `[SECURITY AUDIT]` prefix.

- **NFR-5 (Data Integrity):** Order item `quantity` SHALL be validated as `Number.isInteger(qty) && qty >= 1` BEFORE any pricing or stock operations to prevent `$inc` from adding stock instead of subtracting.

---

## 5. Data Model (Mô hình dữ liệu)

### Collection: `orders`

| Field | Type | Required | Default | Constraints / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | ObjectId (ref: User) | ✅ | — | Chủ sở hữu đơn hàng |
| `status` | String (Enum) | ✅ | `'PENDING'` | `PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REFUNDED` |
| `total_amount` | Number | ✅ | — | `min: 0`. Tính từ PricingService, không nhận từ client |
| `prescription_text` | String | — | `''` | Ghi chú đơn kính (deprecated, dùng prescription trên item) |
| `prescription_image` | String | — | `''` | URL ảnh toa thuốc upload từ client |
| `recipient_name` | String | — | `''` | Tên người nhận hàng |
| `phone_number` | String | — | `''` | SĐT người nhận, validate VN format |
| `delivery_address` | String | — | `''` | Địa chỉ giao hàng |
| `bank_info.bank_name` | String | — | `''` | Tên ngân hàng (dùng cho hoàn tiền) |
| `bank_info.bank_account_number` | String | — | `''` | Số tài khoản (chỉ chứa chữ số) |
| `bank_info.account_holder_name` | String | — | `''` | Tên chủ tài khoản |
| `payment_status` | String (Enum) | — | `'UNPAID'` | `UNPAID`, `PAID` |
| `transaction_id` | String | — | `''` | Mã giao dịch VNPay |
| `paid_at` | Date | — | — | Thời điểm thanh toán thành công |
| `payment_initiated_at` | Date | — | — | Thời điểm khách tạo link VNPay (cleanup job dùng để gia hạn) |
| `status_history[]` | Array of Subdocument | — | — | Xem bảng con bên dưới |
| `created_at` | Date (auto) | — | `Date.now` | Timestamps plugin |
| `updated_at` | Date (auto) | — | `Date.now` | Timestamps plugin |

**Subdocument: `status_history`**

| Field | Type | Required | Default |
| :--- | :--- | :---: | :--- |
| `from_status` | String | — | `''` |
| `to_status` | String | ✅ | — |
| `updated_by` | ObjectId (ref: User) | — | `null` |
| `updated_at` | Date | — | `Date.now` |
| `is_override` | Boolean | — | `false` |
| `note` | String | — | `''` |

### Collection: `orderitems`

| Field | Type | Required | Default | Constraints / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `order_id` | ObjectId (ref: Order) | ✅ | — | |
| `product_id` | ObjectId (ref: Product) | ✅ | — | |
| `variant_id` | ObjectId (ref: ProductVariant) | — | — | |
| `lens_id` | ObjectId (ref: Lens) | — | `null` | Nếu có → đơn có tròng kính |
| `quantity` | Number | ✅ | — | `min: 1` |
| `unit_price` | Number | ✅ | — | Giá đơn vị (gọng + tròng) |
| `prescription` | Subdocument | — | `null` | Chỉ khi có `lens_id` |

**Subdocument: `prescription` (`_id: false`)**

| Field | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `od_sphere` | Number | `0` | SPH mắt phải |
| `od_cylinder` | Number | `0` | CYL mắt phải |
| `od_axis` | Number | `0` | Trục mắt phải [0..180] |
| `od_add` | Number | `0` | ADD mắt phải |
| `od_pd` | Number | `0` | PD mắt phải |
| `os_sphere` | Number | `0` | SPH mắt trái |
| `os_cylinder` | Number | `0` | CYL mắt trái |
| `os_axis` | Number | `0` | Trục mắt trái [0..180] |
| `os_add` | Number | `0` | ADD mắt trái |
| `os_pd` | Number | `0` | PD mắt trái |
| `note` | String | `''` | Ghi chú KTV (max 500 ký tự) |
| `imageUrl` | String | `''` | URL ảnh toa thuốc |

### State Machine Diagram

```
  ┌─────────┐    Thanh toán thành công     ┌──────────────────────┐
  │ PENDING │ ──────────────────────────→ │ AWAITING_VERIFICATION │
  └────┬────┘  (có đơn kính/toa thuốc)    └──────────┬───────────┘
       │                                              │
       │  Thanh toán thành công                       │ KTV xác minh OK
       │  (chỉ gọng, không toa)                      ▼
       │                              ┌────────────────────┐
       └─────────────────────────────→│    CONFIRMED       │
                                      └────────┬───────────┘
                                               │
                                               │ Giao hàng hoàn tất
                                               ▼
                                      ┌────────────────────┐
                                      │    COMPLETED       │
                                      └────────────────────┘

  Bất kỳ trạng thái nào (trừ terminal) ──→ CANCELLED (hủy đơn)
  CANCELLED + PAID ──→ REFUNDED (qua luồng hoàn tiền)
  ADMIN có thể override: bất kỳ → bất kỳ
```

---

## 6. Error Handling (Xử lý lỗi)

| Error Code | HTTP Status | Trigger | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Items rỗng, quantity invalid, SĐT sai format, STK không phải số, thiếu status, thiếu prescription | Trả lỗi, không tạo/cập nhật |
| `OUT_OF_STOCK` | 400 | Tồn kho không đủ (conditional decrement fail) | Rollback các variant đã trừ, trả lỗi kèm tên màu + số lượng còn |
| `VARIANT_NOT_FOUND` | 400 | `PricingService` không tìm thấy variant | Trả lỗi từ PricingError |
| `INVALID_LENS` | 400 | Tròng kính không tồn tại hoặc đã INACTIVE | Trả lỗi từ PricingError |
| `ORDER_NOT_FOUND` | 404 | Order ID không tồn tại | Trả lỗi |
| `ITEM_NOT_FOUND` | 404 | OrderItem không thuộc đơn hàng | Trả lỗi |
| `FORBIDDEN` | 403 | Customer xem/hủy đơn của người khác | Trả lỗi, không cho phép |
| `INVALID_STATUS` | 400 | Hủy đơn đã COMPLETED/CANCELLED/REFUNDED, sửa prescription khi không phải AWAITING_VERIFICATION | Trả lỗi |
| `INVALID_TRANSITION` | 400 | Manager vi phạm state machine | Trả lỗi kèm thông báo chuyển đổi không hợp lệ |
| `FORBIDDEN_TRANSITION` | 400 | Manager cố chuyển sang REFUNDED thủ công | Trả lỗi |
| `NO_LENS` | 400 | Sửa prescription cho item không gắn tròng | Trả lỗi |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

### 7.1 Tạo Đơn Hàng

- **Given** Customer đăng nhập và có sản phẩm trong giỏ hàng  
  **When** Customer gửi `POST /api/orders/create` với payload hợp lệ  
  **Then** Hệ thống trả HTTP 201, tạo Order với status `PENDING`, tạo OrderItems tương ứng, trừ tồn kho ProductVariant

- **Given** Hai customer đồng thời đặt mua variant chỉ còn 1 sản phẩm  
  **When** Cả hai gửi request tạo đơn  
  **Then** Chỉ một request thành công, request còn lại nhận `OUT_OF_STOCK`, tồn kho = 0 (không âm)

### 7.2 Hủy Đơn Hàng

- **Given** Customer có đơn hàng PENDING  
  **When** Customer gửi `PUT /api/orders/:id/cancel`  
  **Then** Order chuyển sang CANCELLED, tồn kho được hoàn trả đầy đủ

### 7.3 State Machine

- **Given** Manager đang xem đơn CONFIRMED  
  **When** Manager gửi `PUT /:id/status` với `{ status: 'PENDING' }`  
  **Then** Hệ thống trả HTTP 400 `INVALID_TRANSITION`

- **Given** Admin đang xem đơn COMPLETED  
  **When** Admin gửi `PUT /:id/status` với `{ status: 'PENDING' }`  
  **Then** Hệ thống cho phép override, ghi `is_override: true`, emit security audit log

### 7.4 Cleanup Job

- **Given** Một đơn PENDING được tạo 20 phút trước, chưa thanh toán, chưa tạo link VNPay  
  **When** Cleanup job chạy  
  **Then** Đơn bị hủy tự động (CANCELLED), tồn kho hoàn trả, history ghi `AUTO_EXPIRED:`

### 7.5 Cập Nhật Đơn kính

- **Given** Manager xem đơn AWAITING_VERIFICATION có item gắn tròng  
  **When** Manager gửi `PUT /:id/items/:itemId/prescription` với thông số mới  
  **Then** Prescription được cập nhật, imageUrl giữ nguyên, history ghi audit trail

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** thực hiện phân tách đơn hàng (order splitting) — mỗi checkout tạo đúng một Order.
- **KHÔNG** hỗ trợ thanh toán một phần (partial payment) — luôn thanh toán 100% trước.
- **KHÔNG** hỗ trợ sửa số lượng/thêm bớt sản phẩm sau khi đơn đã tạo.
- **KHÔNG** hỗ trợ tracking vận chuyển (shipping tracking) trong phiên bản này.
- **KHÔNG** gửi email/SMS thông báo khi trạng thái đơn thay đổi.
- **KHÔNG** áp dụng mã giảm giá / voucher / coupon trên đơn hàng.
- **KHÔNG** hỗ trợ đổi trả sản phẩm (return/exchange) — chỉ có hủy và hoàn tiền.
