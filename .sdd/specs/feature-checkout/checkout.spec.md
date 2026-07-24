# Feature: Checkout & Thanh toán VNPay — FULL SPECIFICATION

**Status:** Approved 
**Author:** AI Agent
**Tech Lead Approval:** Tech Lead
**Date:** 2026-07-19 · 
**Risk Level:** High (Thanh toán trực tuyến, Đồng bộ tồn kho, Background Worker)
**Related Specs:** `cart.spec.md`, `products.spec.md`, `refunds.spec.md`

> **Ghi chú đồng bộ:** Tài liệu này đã được rà soát lại theo mã nguồn thực tế trong
> `src/backend` (OrderController, PaymentController, models Order/OrderItem, orderCleanupJob,
> PricingService). Các mục có dấu **[SYNC]** là phần được chỉnh cho khớp với hành vi thật.

---

## 1. Business Context & Goals
Checkout là tính năng then chốt kết nối giỏ hàng của Khách hàng với nghiệp vụ tạo hóa đơn bán hàng và cổng thanh toán trực tuyến. Mục tiêu là giúp giao dịch được hoàn tất nhanh chóng qua cổng VNPay Sandbox, quản lý chặt chẽ số lượng tồn kho của các biến thể kính mắt, tự động giải phóng tồn kho ảo của các đơn hàng chưa hoàn tất thanh toán để người mua sau có thể tiếp cận sản phẩm.

Với các đơn có gắn tròng kính (lens) / đơn thuốc, hệ thống còn chèn thêm bước **xác minh đơn kính bởi kỹ thuật viên** trước khi xác nhận đơn.

### 1.1 Chính sách thanh toán (nguyên tắc) **[SYNC]**
*   **Thanh toán trước 100% cho MỌI loại đơn** — cả đơn chỉ gọng lẫn đơn gọng + tròng. Hệ thống **không hỗ trợ** trả một phần / đặt cọc; các field `paymentPercentage` (luôn `1.0`) và `remainingPaymentTotal` (luôn `0`) trong API báo giá chỉ tồn tại để FE render, không phải cấu hình.
*   **Khác biệt giữa hai loại đơn chỉ nằm ở trạng thái SAU thanh toán:**
    - Đơn chỉ gọng: `PENDING → CONFIRMED` (không cần con người can thiệp).
    - Đơn có tròng/toa thuốc: `PENDING → AWAITING_VERIFICATION` (KTV đối chiếu toa) `→ CONFIRMED`.
*   `AWAITING_VERIFICATION` là trạng thái **độc quyền của đơn có tròng**: chỉ đạt được tự động sau thanh toán khi đơn có `lens_id`/prescription/ảnh toa; MANAGER không có transition nào đi VÀO trạng thái này (chỉ ADMIN override, có audit log).
*   Nếu toa sai, KTV **sửa prescription trực tiếp** (endpoint 5.7) rồi duyệt — không hủy đơn + hoàn tiền trừ khi khách yêu cầu.

---

## 2. Stakeholders & User Personas
*   **Customer (Khách hàng):** Cần một quy trình thanh toán rõ ràng, hỗ trợ đính kèm ảnh toa kính thuốc dễ dàng, cho phép khôi phục thanh toán ("Thanh toán lại") hoặc tự hủy đơn khi đổi ý.
*   **Sale Staff / Kỹ thuật viên:** Tiếp nhận thông tin giao dịch chính xác (số tiền đã trả, mã giao dịch VNPay), và với đơn có tròng kính thì xác minh đơn kính (`AWAITING_VERIFICATION` → `CONFIRMED`).
*   **Manager / Admin (Quản trị):** Theo dõi tồn kho thực tế không bị over-selling, xử lý các đơn đã thanh toán nhưng bị hủy (luồng hoàn tiền), và theo dõi doanh thu từ giao dịch thành công.

---

## 3. User Stories (all paths)
*   **Story 1 (Happy Path — hàng gọng, không tròng):**
    Là khách hàng có giỏ hàng hợp lệ, khi tôi điền thông tin người nhận và nhấn "Đặt hàng", hệ thống trừ tồn kho các biến thể ngay lập tức, tạo đơn `PENDING`, rồi chuyển hướng tôi sang VNPay. Thanh toán thành công → đơn chuyển sang `CONFIRMED`.
*   **Story 2 (Happy Path — có tròng kính / đơn thuốc):** **[SYNC]**
    Là khách hàng đặt đơn có gắn tròng kính (kèm thông số hoặc ảnh toa thuốc), sau khi thanh toán thành công, đơn chuyển sang `AWAITING_VERIFICATION` để kỹ thuật viên đối chiếu đơn kính trước khi xác nhận.
*   **Story 3 (Alternative — Khôi phục thanh toán):**
    Là khách hàng đặt hàng xong nhưng lỡ tắt tab VNPay khi đơn ở `PENDING`, tại lịch sử đơn hàng tôi nhấn "Thanh toán lại" để được tạo lại link VNPay và tiếp tục.
*   **Story 4 (Alternative — Hủy đơn chủ động):** **[SYNC]**
    Là khách hàng có đơn `PENDING`, `AWAITING_VERIFICATION` hoặc `CONFIRMED`, khi tôi nhấn "Hủy đơn" (kèm lý do tùy chọn), hệ thống chuyển đơn thành `CANCELLED` và cộng trả tồn kho về MongoDB. Khách chỉ hủy được đơn của chính mình.
*   **Story 5 (Exception — Đơn hết hạn thanh toán):**
    Khi khách tạo đơn `PENDING` nhưng bỏ quên không thanh toán, worker chạy nền (quét mỗi 5 phút) tự động hủy đơn sau 15 phút và hoàn trả tồn kho, tránh găm kho ảo.
*   **Story 6 (Exception — Đơn đã thanh toán bị hủy → hoàn tiền):** **[SYNC]**
    Đơn đã `PAID` nhưng bị hủy sẽ vào danh sách chờ Manager/Admin xử lý hoàn tiền (xem `refunds.spec.md`). Manager có thể từ chối yêu cầu hủy và phục hồi trạng thái trước đó.

---

## 4. Acceptance Criteria (EARS)
*   **Tạo đơn hàng:**
    - **WHEN** người dùng đã đăng nhập gửi `POST /api/orders/create` (multipart) với danh sách item hợp lệ và (tùy chọn) ảnh toa thuốc.
    - **THE SYSTEM SHALL** định giá lại từng item theo giá DB (PricingService — không tin giá client), kiểm tra tồn kho, trừ `quantity` của `ProductVariant`, tạo `Order` (`PENDING`) và các `OrderItem`, ghi `status_history` khởi tạo, và trả HTTP `201`.
    - **IF** MongoDB chạy replica set, toàn bộ thao tác chạy trong một transaction; **ELSE** (standalone) fallback chạy tuần tự không transaction.
*   **Báo giá trước checkout:** **[SYNC]**
    - **WHEN** người dùng gửi `POST /api/payment/orders/requirement` với `{ items }`.
    - **THE SYSTEM SHALL** trả tổng tiền dự kiến (`orderTotal`, `requiredAmount`) và chi tiết từng item, dùng chung PricingService để số tiền báo giá khớp số tiền tính thật khi tạo đơn.
*   **Khởi tạo thanh toán:**
    - **WHEN** người dùng gửi `POST /api/payment/checkout` với `orderId`.
    - **THE SYSTEM SHALL** từ chối nếu đơn đã `CONFIRMED`/`COMPLETED`, ngược lại tạo URL VNPay ký SHA512 và trả về chuỗi URL.
*   **Callback VNPay:** **[SYNC]**
    - **WHEN** VNPay gọi `GET /api/payment/vnpay-callback`.
    - **THE SYSTEM SHALL** xác minh `vnp_SecureHash` (SHA512), đối chiếu `vnp_Amount == total_amount * 100`, và chỉ xử lý đơn đang `PENDING` (chống double-processing).
    - **IF** chữ ký sai HOẶC số tiền lệch → chỉ redirect về `/checkout/failure`, **KHÔNG** đổi trạng thái đơn.
    - **IF** hợp lệ và `vnp_ResponseCode = '00'` → đơn có tròng/đơn thuốc chuyển `AWAITING_VERIFICATION`, còn lại `CONFIRMED`; đặt `payment_status=PAID`, lưu `transaction_id`, `paid_at`.
    - **IF** hợp lệ nhưng `vnp_ResponseCode != '00'` → đơn `CANCELLED`, `payment_status=UNPAID` (lưu ý: không tự hoàn kho ở nhánh callback này).
*   **Hủy đơn (Customer):** **[SYNC]**
    - **WHEN** chủ đơn gửi `PUT /api/orders/:id/cancel`.
    - **THE SYSTEM SHALL** chỉ cho phép khi status ∈ `{PENDING, AWAITING_VERIFICATION, CONFIRMED}`; kiểm tra quyền sở hữu (CUSTOMER chỉ hủy đơn mình); hoàn kho variant (`$inc`); chuyển `CANCELLED`; ghi `status_history` kèm lý do; trả HTTP 200.
*   **Tác vụ dọn dẹp nền:** **[SYNC]**
    - **WHILE** máy chủ hoạt động, worker chạy mỗi 5 phút.
    - **THE SYSTEM SHALL** chỉ hủy đơn `PENDING` **chưa thanh toán** (`payment_status=UNPAID`) tạo cách hiện tại > 15 phút; **và** nếu khách đã tạo link thanh toán (`payment_initiated_at`) thì phải quá 30 phút kể từ lần tạo link gần nhất (tránh race với khách đang trên trang VNPay). Khi hủy: chuyển `CANCELLED`, hoàn kho, ghi `status_history` với note prefix `AUTO_EXPIRED:` (dấu nhận diện cho luồng phục hồi ở mục 5.4).

---

## 5. API Contracts
> **Base path:** tất cả route nằm dưới `/api`. Nhóm order còn được alias tại `/api/management/orders`.

### 5.1 Báo giá trước checkout **[SYNC]**
*   **Endpoint:** `POST /api/payment/orders/requirement` — Auth bắt buộc
*   **Payload:** `{ "items": [{ "productVariantId"|"variantId"|"productId", "lensId?", "quantity" }] }`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": {
        "orderTotal": 1200000,
        "requiredAmount": 1200000,
        "requiredPaymentTotal": 1200000,
        "remainingPaymentTotal": 0,
        "itemRequirements": [
          { "productVariantId": "…", "lensId": null, "unitPrice": 1000000,
            "lensPrice": 0, "itemTotal": 1200000, "paymentPercentage": 1.0, "requiredPayment": 1200000 }
        ]
      }
    }
    ```

### 5.2 Tạo đơn hàng mới
*   **Endpoint:** `POST /api/orders/create` — Auth bắt buộc
*   **Content-Type:** `multipart/form-data`
*   **Payload:** field `orderInfo` (JSON string: `{ items[], recipientName, phoneNumber, deliveryAddress, bankInfo? }`) + field `prescriptionImage` (file, tùy chọn)
*   **Response 201:** **[SYNC]**
    ```json
    {
      "code": 0,
      "message": "Tạo đơn hàng thành công",
      "result": { "orderId": "6704b…", "order": { … } }
    }
    ```

### 5.3 Khởi tạo link thanh toán VNPay
*   **Endpoint:** `POST /api/payment/checkout` — Auth bắt buộc
*   **Payload (JSON hoặc Query):** `{ "orderId": "6704b…" }`
*   **Response 200:** `{ "code": 0, "result": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?…" }`
*   **Điều kiện:** chỉ đơn `PENDING` (chưa thu tiền) mới tạo được link; CUSTOMER chỉ tạo được cho đơn của mình. Khi tạo link, hệ thống ghi `payment_initiated_at` để cleanup job gia hạn cửa sổ tự hủy.
*   **Lỗi:** đơn không `PENDING` → 400 `INVALID_STATUS`; không phải chủ đơn → 403 `FORBIDDEN`; thiếu cấu hình VNPay → 500 `CONFIG_ERROR`.

### 5.4 Callback & IPN xử lý phản hồi từ VNPay **[SYNC]**
*   **Endpoints:**
    - `GET /api/payment/vnpay-callback` — ReturnURL (kênh hiển thị cho khách, redirect về FE)
    - `GET /api/payment/vnpay-ipn` — IPN server-to-server (**nguồn xác nhận chính**, response `{RspCode, Message}` theo spec VNPay)
*   Hai kênh dùng chung logic chốt kết quả **idempotent** (`settleVnpayResult`): kênh nào về trước chốt đơn, kênh về sau không đổi trạng thái thêm.
*   **Hành vi (theo thứ tự kiểm tra):**
    1. Xác minh `vnp_SecureHash` (SHA512). Sai → callback redirect `failure` / IPN trả `RspCode 97`, **không đổi đơn**.
    2. Đối chiếu số tiền `vnp_Amount === total_amount*100`. Lệch → failure / `RspCode 04`, không đổi đơn.
    3. Đơn không `PENDING`: nếu đã PAID → success / `RspCode 02`; nếu là đơn bị **tự hủy quá hạn (AUTO_EXPIRED)** mà thanh toán hợp lệ về muộn → **phục hồi đơn** (trừ lại kho có điều kiện `$gte`; hết kho thì giữ `CANCELLED` + đánh dấu `PAID` để vào hàng đợi hoàn tiền của Manager).
    4. `vnp_ResponseCode='00'` → `AWAITING_VERIFICATION` (nếu có tròng/đơn thuốc) hoặc `CONFIRMED`; `payment_status=PAID`, lưu `transaction_id`, `paid_at`.
    5. `vnp_ResponseCode!='00'` → `CANCELLED` **+ hoàn kho** (đồng nhất với mọi đường hủy khác).
*   **Triển khai:** IPN URL phải đăng ký trong merchant portal VNPay trỏ về `/api/payment/vnpay-ipn`.

### 5.5 Mô phỏng thanh toán (dev-only) **[SYNC]**
*   **Endpoint:** `POST /api/payment/mock-checkout` — Auth bắt buộc; **bị chặn (403) khi `NODE_ENV=production`**
*   **Payload:** `{ "orderId", "simulateStatus": "SUCCESS" | khác }`
*   **Hành vi:** giả lập kết quả VNPay để test luồng success/failure mà không gọi cổng thật. `SUCCESS` áp dụng cùng logic chọn `AWAITING_VERIFICATION`/`CONFIRMED` như callback thật.

### 5.6 Các endpoint đơn hàng liên quan **[SYNC]**
| Method & Path | Quyền | Mô tả |
| :--- | :--- | :--- |
| `GET /api/orders/me` | Auth | Lịch sử đơn của khách (phân trang `page`, `size`, lọc `status`) |
| `PUT /api/orders/:id/cancel` | Auth (chủ đơn) | Hủy đơn + hoàn kho |
| `GET /api/orders` | MANAGER/ADMIN | Danh sách toàn bộ đơn |
| `GET /api/orders/:id` | CUSTOMER/MANAGER/ADMIN | Chi tiết đơn |
| `PUT /api/orders/:id/status` | MANAGER/ADMIN | Cập nhật trạng thái đơn (vào/ra `CANCELLED` tự đồng bộ tồn kho) |
| `PUT /api/orders/:id/items/:itemId/prescription` | MANAGER/ADMIN | KTV sửa đơn kính của item khi đơn `AWAITING_VERIFICATION` |
| `GET /api/orders/cancelled/paid` | MANAGER/ADMIN | Đơn đã thanh toán nhưng bị hủy (chờ hoàn tiền) |
| `PUT /api/orders/:id/reject-cancel` | MANAGER/ADMIN | Từ chối hủy, phục hồi trạng thái trước + trừ lại kho |
| `DELETE /api/orders/:id` | ADMIN | Xóa đơn + OrderItem liên quan |

### 5.7 KTV cập nhật đơn kính khi chờ xác minh **[SYNC]**
*   **Endpoint:** `PUT /api/orders/:id/items/:itemId/prescription` — MANAGER/ADMIN
*   **Điều kiện:** đơn phải đang `AWAITING_VERIFICATION`; item phải có `lens_id`.
*   **Payload:** `{ "prescription": { odSphere, odCylinder, odAxis, odAdd, odPd, osSphere, … , note }, "note?": "lý do sửa" }`
*   **Hành vi:** chuẩn hóa thông số cùng quy tắc lúc tạo đơn (số hỏng → 0, AXIS ngoài [0..180] → 0, note ≤ 500 ký tự); ảnh toa (`imageUrl`) giữ nguyên; ghi audit vào `status_history` của đơn (trạng thái không đổi).
*   **Lỗi:** `INVALID_STATUS` (400) nếu đơn không ở `AWAITING_VERIFICATION`; `NO_LENS` (400) nếu item không gắn tròng; `ITEM_NOT_FOUND` (404).
*   **Mục đích nghiệp vụ:** toa nhập sai số → KTV liên hệ khách, sửa rồi duyệt (`AWAITING_VERIFICATION → CONFIRMED`), thay vì hủy đơn + hoàn tiền.

---

## 6. Data Models & DB Schema **[SYNC]**

### 6.1 Order (`models/Order.js`)
> Lưu ý: mô hình dùng **flat fields snake_case**, KHÔNG có object nhúng `paymentInfo`.
```javascript
const OrderSchema = new mongoose.Schema({
  user_id:  { type: ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  total_amount:      { type: Number, required: true, min: 0 },
  prescription_text: { type: String, default: '' },
  prescription_image:{ type: String, default: '' }, // path ảnh toa (đơn-level)
  recipient_name:    { type: String, default: '' },
  phone_number:      { type: String, default: '' },
  delivery_address:  { type: String, default: '' },
  bank_info: { bank_name, bank_account_number, account_holder_name }, // phục vụ hoàn tiền
  payment_status:    { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
  transaction_id:    { type: String, default: '' },
  paid_at:           { type: Date },
  payment_initiated_at: { type: Date }, // lần gần nhất tạo link VNPay — cleanup job dựa vào để gia hạn
  status_history: [{ from_status, to_status(req), updated_by, updated_at, is_override, note }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
```

### 6.2 OrderItem (`models/OrderItem.js`)
```javascript
const OrderItemSchema = new mongoose.Schema({
  order_id:   { type: ObjectId, ref: 'Order', required: true },
  product_id: { type: ObjectId, ref: 'Product', required: true },
  variant_id: { type: ObjectId, ref: 'ProductVariant' },
  lens_id:    { type: ObjectId, ref: 'Lens', default: null },    // [2026-07-22] model Lens riêng (models/Lens.js, API /api/lenses)
  quantity:   { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true },                  // = basePrice + lensPrice
  prescription: { type: PrescriptionSchema, default: null }      // chỉ khi có lens_id
}, { timestamps: true });

// PrescriptionSchema (nhúng, _id:false): od_sphere/od_cylinder/od_axis[0..180]/od_add/od_pd,
// os_* tương ứng, note (≤500 ký tự), imageUrl (path ảnh toa của item).
```

---

## 7. Non-Functional Requirements **[SYNC]**
*   **Security — chữ ký:** Không cập nhật `CONFIRMED`/`AWAITING_VERIFICATION`/`PAID` nếu `vnp_SecureHash` không khớp SHA512.
*   **Security — số tiền:** Không tin `vnp_Amount` từ callback; phải khớp `total_amount*100` lưu ở DB.
*   **Idempotency:** ReturnURL + IPN dùng chung hàm chốt kết quả idempotent; callback lặp / refresh không thay đổi trạng thái đã chốt.
*   **Tồn kho:** Trừ kho khi tạo đơn bằng update **có điều kiện atomic** (`findOneAndUpdate {quantity: {$gte: qty}}` + `$inc`) — hai đơn đồng thời không thể làm kho âm; standalone mode tự rollback các variant đã trừ khi một item hết hàng giữa chừng. Hoàn kho qua `$inc` ở mọi đường hủy (customer cancel, manager cancel qua `/status`, thanh toán fail, cleanup job).
*   **Cấu hình bắt buộc (env):** `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_RETURN_URL`, `VNP_URL` (mặc định sandbox), `CLIENT_URL`. Thiếu → checkout trả 500 `CONFIG_ERROR`. **[2026-07-22]** `CLIENT_URL` nhận nhiều origin phân tách dấu phẩy (dùng cho CORS); mọi URL redirect (VNPay callback, verify email) lấy origin **đầu tiên** qua helper `utils/clientUrl.js` (`getClientBaseUrl`/`getCorsOrigins`) — không ghép trực tiếp biến env.

---

## 8. Error Handling Matrix **[SYNC]**
| Error Code | HTTP | Mô tả | Hành vi |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Thiếu item / thiếu orderId / payload sai | Từ chối |
| `VARIANT_NOT_FOUND` | 400 | Không tìm thấy biến thể khi định giá | Từ chối tạo đơn |
| `INVALID_LENS` | 400 | Tròng kính không hợp lệ / ngưng bán | Từ chối tạo đơn |
| `OUT_OF_STOCK` | 400 | Tồn kho variant không đủ | Từ chối, rollback |
| `ORDER_NOT_FOUND` | 404 | Không thấy đơn khi thanh toán / hủy | Báo lỗi |
| `ITEM_NOT_FOUND` | 404 | Không thấy OrderItem khi KTV sửa đơn kính | Báo lỗi |
| `NO_LENS` | 400 | Item không gắn tròng, không có đơn kính để sửa | Từ chối |
| `INVALID_STATUS` | 400 | Trạng thái không cho phép thao tác | Từ chối |
| `FORBIDDEN` | 403 | Không phải chủ đơn / mock-checkout ở production | Từ chối |
| `CONFIG_ERROR` | 500 | Chưa cấu hình VNPay | Từ chối khởi tạo thanh toán |

---

## 9. Edge Cases & Corner Cases **[SYNC]**
*   **Đóng tab khi thanh toán:** IPN server-to-server vẫn chốt đơn dù khách không quay lại ReturnURL; khách cũng có thể "Thanh toán lại" (gọi lại `/payment/checkout`) khi đơn còn `PENDING`.
*   **Thanh toán về muộn sau khi đơn bị tự hủy (AUTO_EXPIRED):** phục hồi đơn + trừ lại kho; nếu kho đã bị mua mất → giữ `CANCELLED` + `payment_status=PAID` để vào hàng đợi hoàn tiền — tiền của khách không bao giờ bị nuốt im lặng.
*   **Callback lặp / user refresh:** guard "chỉ xử lý `PENDING`" bỏ qua an toàn.
*   **Chữ ký sai / số tiền lệch:** không đổi trạng thái đơn (khác với hành vi cũ là tự `CANCELLED`).
*   **MongoDB standalone:** transaction không khả dụng → fallback chạy không transaction (mất tính nguyên tử tuyệt đối, chấp nhận trong môi trường dev).
*   **Đơn có tròng kính:** chèn thêm trạng thái trung gian `AWAITING_VERIFICATION` chờ kỹ thuật viên.
*   **Toa thuốc sai số:** KTV sửa prescription trực tiếp (endpoint 5.7) rồi duyệt — không cần hủy đơn + hoàn tiền.
*   **Manager từ chối hủy:** phục hồi trạng thái hợp lệ gần nhất và trừ lại kho.

---

## 10. Dependencies & Integration Points
*   **Multer middleware:** nhận `prescriptionImage` (lưu vào `uploads/`) trước khi vào controller.
*   **PricingService:** nguồn giá duy nhất, dùng chung cho báo giá và tạo đơn. Giá item = giá variant (`ProductVariant`, ưu tiên `discountPrice`) + giá tròng (**model `Lens` riêng** — [2026-07-22]; lens không tồn tại hoặc `INACTIVE` → 400 `INVALID_LENS`).
*   **VNPay Sandbox Merchant:** cấp môi trường thanh toán giả lập; cấu hình qua env.
*   **orderCleanupJob:** khởi động trong `server.js` sau khi `connectDB()` thành công.
*   **RefundController:** tiếp nhận các đơn đã thanh toán bị hủy (`refunds.spec.md`).

---

## 11. Testing Requirements
*   **Integration:** tạo đơn (trừ kho) → mô phỏng callback/mock-checkout thành công → kiểm tra chuyển `CONFIRMED` (gọng) hoặc `AWAITING_VERIFICATION` (có tròng).
*   **Security:** callback với chữ ký sai / số tiền lệch → không đổi trạng thái đơn, redirect failure.
*   **Idempotency:** callback lặp trên đơn đã chốt không thay đổi dữ liệu.
*   **Worker:** đơn `PENDING` tạo > 15 phút trước bị tự hủy và hoàn kho sau khi `cleanupExpiredOrders()` chạy.
*   **Hủy đơn:** chỉ chủ đơn hủy được; hoàn kho đúng số lượng; chặn trạng thái ngoài `{PENDING, AWAITING_VERIFICATION, CONFIRMED}`.
