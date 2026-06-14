Dưới đây là phiên bản **cập nhật** của `SHARED_CONTEXT.md` dựa trên các gợi ý cải thiện. File này đã được sửa lỗi mâu thuẫn cổng, bổ sung version API, error format, role matrix, order workflow, database collections, và coding rules nhẹ cho AI agent.

````markdown
# SHARED_CONTEXT.md — Nguồn Sự Thật Chung

**Cập nhật lần cuối:** 2026-06-14 17:30 UTC  
**Cập nhật bởi:** Lead Agent  
**Phiên bản:** 20260614-1730

---

## 0. QUICK REFERENCE (dành cho AI Agent & Developer mới)

| Mục              | Nội dung chính                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| **Base URL**     | `http://localhost:5000/api/v1` (backend dev)                                      |
| **Auth**         | JWT Bearer token (trừ `/auth/login`, `/auth/register`, `/payment/vnpay-callback`) |
| **Naming**       | `snake_case` cho JSON và database fields                                          |
| **Date**         | ISO8601 (UTC)                                                                     |
| **Error format** | `{ success, error_code, message, request_id }`                                    |
| **Role Matrix**  | Xem mục 6                                                                         |

---

## 1. API CONTRACTS (Hợp đồng API)

_Base URL: `http://localhost:5000/api/v1` (development)_  
_Sản phẩm: thêm tiền tố `/v1` để dễ dàng nâng cấp sau này._

### 📌 Error Response Format (áp dụng cho mọi endpoint lỗi)

```json
{
  "success": false,
  "error_code": "PRODUCT_NOT_FOUND",
  "message": "Không tìm thấy sản phẩm với id ...",
  "request_id": "req_abc123"
}
```
````

Các HTTP status code: 400, 401, 403, 404, 422, 500.

---

### 📌 Xác thực (Auth)

| Method | Path             | Request                                           | Response                                           | Status         |
| ------ | ---------------- | ------------------------------------------------- | -------------------------------------------------- | -------------- |
| POST   | `/auth/register` | `{ username, password, full_name, email, phone }` | `{ message, user: { id, username, email, role } }` | ✅ IMPLEMENTED |
| POST   | `/auth/login`    | `{ username, password }`                          | `{ token, user: { id, username, email, role } }`   | ✅ IMPLEMENTED |
| GET    | `/auth/me`       | (Bearer)                                          | `{ id, username, full_name, email, phone, role }`  | ✅ IMPLEMENTED |
| PUT    | `/auth/me`       | (Bearer) `{ full_name, phone }` (optional)        | `{ message, user }`                                | 🔄 IN PROGRESS |

---

### 📌 Sản phẩm (Products)

| Method | Path            | Request                                                              | Response                                   | Status         |
| ------ | --------------- | -------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| GET    | `/products`     | Query: `page, limit, search, brand, minPrice, maxPrice`              | `{ items: Product[], total, page, limit }` | ✅ IMPLEMENTED |
| GET    | `/products/:id` | (none)                                                               | `Product`                                  | ✅ IMPLEMENTED |
| POST   | `/products`     | (ADMIN) `{ name, brand, price, image, stock_quantity, description }` | `Product`                                  | ✅ IMPLEMENTED |
| PUT    | `/products/:id` | (ADMIN) các trường cập nhật                                          | `Product`                                  | ✅ IMPLEMENTED |
| DELETE | `/products/:id` | (ADMIN)                                                              | `{ message }`                              | ✅ IMPLEMENTED |

---

### 📌 Giỏ hàng (Cart)

| Method | Path                | Request                             | Response                                                                               | Status         |
| ------ | ------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| GET    | `/cart`             | (Bearer)                            | `{ items: [{ product_id, product_name, unit_price, quantity, total }], total_amount }` | ✅ IMPLEMENTED |
| POST   | `/cart`             | (Bearer) `{ product_id, quantity }` | giỏ hàng mới                                                                           | ✅ IMPLEMENTED |
| PUT    | `/cart/:product_id` | (Bearer) `{ quantity }`             | giỏ hàng mới                                                                           | ✅ IMPLEMENTED |
| DELETE | `/cart/:product_id` | (Bearer)                            | `{ message }`                                                                          | ✅ IMPLEMENTED |

---

### 📌 Đơn hàng (Orders)

| Method | Path                           | Request                                                                                                                          | Response                                  | Status         |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------- |
| POST   | `/orders`                      | (Bearer) `{ shipping_name, shipping_phone, shipping_address, prescription_text, prescription_image (optional), payment_method }` | `{ order_id, total_amount, payment_url }` | ✅ IMPLEMENTED |
| GET    | `/orders/my-orders`            | (Bearer)                                                                                                                         | `Order[]` (kèm items)                     | ✅ IMPLEMENTED |
| GET    | `/orders/:id`                  | (Bearer, quyền theo role)                                                                                                        | `Order + items + payment + verification`  | ✅ IMPLEMENTED |
| PUT    | `/orders/:id/confirm-received` | (Bearer, CUSTOMER)                                                                                                               | `{ message, status }`                     | ✅ IMPLEMENTED |
| PUT    | `/orders/:id/cancel`           | (Bearer, CUSTOMER) `{ reason }` (optional)                                                                                       | `{ message, status }`                     | ✅ IMPLEMENTED |
| GET    | `/orders`                      | (SALE/ADMIN) Query: `status, userId, page, limit`                                                                                | Danh sách đơn (phân trang)                | 🔄 IN PROGRESS |

---

### 📌 Xác minh (Verification)

| Method | Path                              | Request                            | Response                                       | Status         |
| ------ | --------------------------------- | ---------------------------------- | ---------------------------------------------- | -------------- |
| GET    | `/verification/pending`           | (SALE/ADMIN)                       | Danh sách đơn `AWAITING_VERIFICATION`          | ✅ IMPLEMENTED |
| POST   | `/verification/approve/:order_id` | (SALE/ADMIN) `{ note }` (optional) | `{ message, order_status }`                    | ✅ IMPLEMENTED |
| POST   | `/verification/reject/:order_id`  | (SALE/ADMIN) `{ reason }`          | `{ message, order_status }`                    | ✅ IMPLEMENTED |
| GET    | `/verification/order/:order_id`   | (SALE/ADMIN)                       | `{ verified_by, action, reason, verified_at }` | 🔄 IN PROGRESS |

---

### 📌 Thanh toán (Payment)

| Method | Path                       | Request                       | Response                                                   | Status         |
| ------ | -------------------------- | ----------------------------- | ---------------------------------------------------------- | -------------- |
| POST   | `/payment/vnpay-callback`  | (VNPay gửi – không cần token) | (redirect hoặc HTML)                                       | ✅ IMPLEMENTED |
| GET    | `/payment/order/:order_id` | (Bearer)                      | `{ amount, method, status, transaction_id, payment_time }` | ✅ IMPLEMENTED |

---

### 📌 Admin & Dashboard

| Method | Path                             | Request                                                         | Response                                                                | Status         |
| ------ | -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------- |
| GET    | `/admin/users`                   | (ADMIN) Query: `role, status`                                   | Danh sách User                                                          | 🔄 IN PROGRESS |
| POST   | `/admin/users`                   | (ADMIN) `{ username, password, full_name, email, phone, role }` | User vừa tạo                                                            | 🔄 IN PROGRESS |
| PUT    | `/admin/users/:id/toggle-status` | (ADMIN)                                                         | `{ message, status }`                                                   | 🔄 IN PROGRESS |
| GET    | `/admin/dashboard`               | (ADMIN)                                                         | `{ total_orders, total_revenue, pending_verification, top_products[] }` | ⏳ READY       |
| POST   | `/admin/refunds`                 | (ADMIN) `{ order_id, amount, reason }`                          | `{ message, refund }`                                                   | ⏳ READY       |
| PUT    | `/admin/refunds/:id/complete`    | (ADMIN)                                                         | `{ message, order_status }`                                             | ⏳ READY       |

---

### 📌 Upload ảnh

| Method | Path      | Request                                   | Response  | Status         |
| ------ | --------- | ----------------------------------------- | --------- | -------------- |
| POST   | `/upload` | (Bearer) `multipart/form-data` file field | `{ url }` | ✅ IMPLEMENTED |

---

## 2. CANONICAL DATA TYPES

- **Naming Convention:** `snake_case` (JSON và database)
- **Date format:** ISO8601, UTC (ví dụ: `2026-06-14T15:30:00Z`)

**Product**:
`_id`, `name`, `brand`, `price`(number), `image`, `stock_quantity`, `description`

**Order**:
`_id`, `user_id`, `status`(enum), `total_amount`, `prescription_text`, `prescription_image`, `created_at`

**OrderItem**:
`order_id`, `product_id`, `quantity`, `unit_price`

**Payment**:
`order_id`, `amount`, `method`, `status`(enum), `transaction_id`, `payment_time`

**Verification**:
`order_id`, `verified_by`, `action`(enum), `note`, `verified_at`

**Refund**:
`order_id`, `amount`, `reason`, `status`(enum)

---

## 3. ORDER WORKFLOW (Luồng trạng thái đơn hàng)

```text
[Khởi tạo]
PENDING
   │ (thanh toán VNPay thành công)
   ▼
AWAITING_VERIFICATION
   │ (Sale APPROVE)
   ▼
CONFIRMED
   │ (Customer bấm "Đã nhận hàng" hoặc Admin xác nhận)
   ▼
COMPLETED
```

**Các nhánh hủy/hoàn tiền:**

```text
PENDING ──(Customer hủy)──► CANCELLED
AWAITING_VERIFICATION ──(Customer hủy hoặc Sale REJECT)──► CANCELLED
CANCELLED (nếu đã thanh toán) ──(Admin tạo refund)──► REFUNDED
```

- **Lưu ý:** Không thể chuyển từ `CONFIRMED` về `CANCELLED` (chỉ có thể chuyển sang `COMPLETED` hoặc `REFUNDED` nếu có lỗi đặc biệt – xử lý thủ công).

---

## 4. DATABASE COLLECTIONS (MongoDB)

| Collection      | Ghi chú                                   |
| --------------- | ----------------------------------------- |
| `users`         | Lưu thông tin đăng nhập, role, trạng thái |
| `products`      | Sản phẩm (gọng kính)                      |
| `carts`         | Giỏ hàng tạm, mỗi dòng là một item        |
| `orders`        | Đơn hàng chính                            |
| `order_items`   | Chi tiết sản phẩm trong đơn               |
| `payments`      | Giao dịch thanh toán                      |
| `verifications` | Lịch sử xác minh bởi Sale                 |
| `refunds`       | Yêu cầu/ghi nhận hoàn tiền                |

**Quan hệ tham chiếu (không có foreign key vật lý, nhưng dùng ObjectId):**

- `carts.user_id` → `users._id`
- `carts.product_id` → `products._id`
- `orders.user_id` → `users._id`
- `order_items.order_id` → `orders._id`
- `order_items.product_id` → `products._id`
- `payments.order_id` → `orders._id`
- `verifications.order_id` → `orders._id`
- `verifications.verified_by` → `users._id`
- `refunds.order_id` → `orders._id`
- `refunds.processed_by` → `users._id`

---

## 5. SHARED DEPENDENCIES

| Thành phần  | Backend                   | Frontend                    | Ghi chú                                  |
| ----------- | ------------------------- | --------------------------- | ---------------------------------------- |
| Auth        | `jsonwebtoken` + `bcrypt` | Axios interceptor gắn token | JWT secret đồng nhất                     |
| Date        | native `Date` → ISO8601   | `date-fns`                  | Không dùng `moment`                      |
| HTTP client | (server)                  | `axios`                     | Base URL: `http://localhost:5000/api/v1` |
| Upload      | `multer` + `cloudinary`   | `FormData` + axios          | Giới hạn 10MB                            |
| Env vars    | `dotenv`                  | `process.env` (Vite)        | Dùng chung tên biến                      |

---

## 6. ROLE MATRIX (tóm tắt quyền truy cập)

| API Group                                                                                 | CUSTOMER           | SALE | ADMIN |
| ----------------------------------------------------------------------------------------- | ------------------ | ---- | ----- |
| `/auth/*` (trừ register/login)                                                            | ✅                 | ✅   | ✅    |
| `/products` GET                                                                           | ✅                 | ✅   | ✅    |
| `/products` POST/PUT/DELETE                                                               | ❌                 | ❌   | ✅    |
| `/cart/*`                                                                                 | ✅                 | ❌   | ❌    |
| `/orders` POST, `/orders/my-orders`, `/orders/:id/confirm-received`, `/orders/:id/cancel` | ✅                 | ❌   | ❌    |
| `/orders` GET (danh sách tất cả)                                                          | ❌                 | ✅   | ✅    |
| `/verification/*`                                                                         | ❌                 | ✅   | ✅    |
| `/payment/order/:order_id`                                                                | (chỉ đơn của mình) | ✅   | ✅    |
| `/admin/*`                                                                                | ❌                 | ❌   | ✅    |
| `/upload`                                                                                 | ✅                 | ✅   | ✅    |

---

## 7. ENVIRONMENT INFO

| Môi trường  | Database                               | API URL                        | Frontend URL            |
| ----------- | -------------------------------------- | ------------------------------ | ----------------------- |
| Development | `mongodb://localhost:27017/optics_dev` | `http://localhost:5000/api/v1` | `http://localhost:3000` |
| Staging     | (chưa có)                              | (chưa có)                      | (chưa có)               |
| Production  | (chưa deploy)                          | (chưa deploy)                  | (chưa deploy)           |

- Backend dev cổng mặc định: **5000** (Node.js + Express)
- Frontend dev cổng mặc định: **3000** (React/Vite)

---

## 8. AI AGENT CODING RULES (tóm tắt từ Constitution)

- **Không dùng `any`** trong TypeScript.
- **Không truy vấn database trực tiếp từ Controller** – phải qua Service.
- **Business logic chỉ nằm trong Service**.
- **API trả JSON theo đúng định dạng** (thành công hoặc error format).
- **Luật bất biến xem `CONSTITUTION.md`** (SEC, ARCH, ENG layers).

---

## 9. KNOWN BREAKING CHANGES

| Ngày       | Thay đổi                                                 | Impact                       | Status     |
| ---------- | -------------------------------------------------------- | ---------------------------- | ---------- |
| 2026-06-10 | Tách `verification` thành collection riêng               | FE cần gọi API mới; BE đã có | ✅ SYNCED  |
| 2026-06-12 | Đổi `order_list` → `orders` trong response               | FE sửa tên biến              | ✅ SYNCED  |
| 2026-06-14 | Bỏ `shipping_address_detail`, chỉ giữ `shipping_address` | FE bỏ trường dư              | ⚠️ PENDING |
| 2026-06-14 | **Thêm tiền tố `/v1` vào tất cả API**                    | FE update base URL           | ✅ SYNCED  |

---

## 10. AI AGENT SELF-CHECK (trước khi thay đổi)

- [ ] Đã đọc toàn bộ file này?
- [ ] Đã kiểm tra Role Matrix xem có quyền thực hiện thay đổi không?
- [ ] Nếu sửa API, đã cập nhật mục 1 và báo Lead Agent?
- [ ] Có breaking change? → cập nhật mục 9 trước khi commit.
- [ ] Đã kiểm tra snake_case và error format?
- [ ] Môi trường dev có đang chạy đúng cổng 5000 không?

---

**Lưu ý quan trọng:**

- File này là **nguồn sự thật duy nhất** cho API, data model, quyền, workflow.
- Mọi thay đổi phải được **Lead Agent** phê duyệt và cập nhật phiên bản.
- Commit file này vào Git sau mỗi lần cập nhật.

---

\_End of SHARED_CONTEXT.md
