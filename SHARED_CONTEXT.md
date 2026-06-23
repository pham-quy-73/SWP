# SHARED_CONTEXT.md — Nguồn Sự Thật Chung

**Cập nhật lần cuối:** 2026-06-22 17:00 UTC  
**Cập nhật bởi:** Lead Agent  
**Phiên bản:** 3.0.0

---

## 0. QUICK REFERENCE

| Mục              | Nội dung                                                |
| ---------------- | ------------------------------------------------------- |
| **Base URL**     | `http://localhost:5000/api` (Dùng cho Auth/User/Product) |
| **Orders URL**   | `http://localhost:5000/orders` (hoặc `/api/orders`)     |
| **Payment URL**  | `http://localhost:5000/payment` (hoặc `/api/payment`)   |
| **Auth**         | JWT Bearer token (trừ login/register và VNPay callback) |
| **Naming**       | `snake_case` cho CSDL và API request/response           |
| **Date**         | ISO8601 (UTC)                                           |
| **Error format** | `{ error_code, message }`                               |
| **Role Matrix**  | Xem mục 6                                               |

---

## 1. API CONTRACTS

### 📌 Error Response Format (áp dụng cho mọi lỗi)

```json
{
  "error_code": "PRODUCT_NOT_FOUND",
  "message": "Không tìm thấy sản phẩm"
}
```

HTTP status codes: 400, 401, 403, 404, 500.

---

### 📌 Auth & Users

| Method | Path | Request | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | `{ username, password, email, first_name, last_name, phone... }` | `{ message, user }` | ✅ Thực tế |
| POST | `/api/auth/login` | `{ username, password }` | `{ token, user }` | ✅ Thực tế |
| POST | `/api/auth/google` | `{ idToken }` | `{ token, user }` | ✅ Thực tế |
| GET | `/api/auth/verify-email` | Query: `token` | (Redirect sang client) | ✅ Thực tế |
| GET | `/api/users/me` | (Bearer) | `{ code: 0, result: user }` | ✅ Thực tế |

---

### 📌 Products & Variants (Base: `/api/products`)

| Method | Path | Request | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Query filters | `{ code: 0, result: { items, page, size... } }` | ✅ Thực tế |
| GET | `/:id` | (none) | `Product` (không bọc wrapper) | ✅ Thực tế |
| POST | `/` | (MANAGER/ADMIN) `multipart/form-data` | `{ code: 0, result: Product }` | ✅ Thực tế |
| PUT | `/:id` | (MANAGER/ADMIN) `multipart/form-data` | `{ code: 0, result: Product }` | ✅ Thực tế |
| DELETE | `/:id` | (MANAGER/ADMIN) | `{ code: 0, message }` | ✅ Thực tế |
| GET | `/:productId/variants` | (none) | `{ success, result: variants }` | ✅ Thực tế |
| POST | `/:productId/variants`| (MANAGER/ADMIN) Variant JSON | `{ success, result: variant }` | ✅ Thực tế |
| PUT | `/:productId/variants/:variantId`| (MANAGER/ADMIN) fields | `{ success, result: variant }` | ✅ Thực tế |
| DELETE | `/:productId/variants/:variantId`| (MANAGER/ADMIN) | `{ success, message }` | ✅ Thực tế |

---

### 📌 Cart

> ⚠️ **Hệ thống KHÔNG có API giỏ hàng.** Giỏ hàng được quản lý ở Client thông qua Zustand và lưu tại LocalStorage (`vision-cart-storage`). Không dùng `carts` collection.

---

### 📌 Orders (Base: `/orders` hoặc `/api/orders`)

| Method | Path | Request | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/create` | (Bearer) **`multipart/form-data`**: field `orderInfo` (JSON String) + `prescriptionImage` (file) | `{ code: 0, message, result: { orderId, order } }` | ✅ Thực tế |
| GET | `/me` | (Bearer) | `{ code: 0, result: { items, totalItems, ... } }` | ✅ Thực tế |
| GET | `/:id` | (Bearer, quyền theo role) | `{ code: 0, result: { ...order, items } }` | ✅ Thực tế |
| PUT | `/:id/status`| (MANAGER/ADMIN) `{ status }` | `{ code: 0, message, result: order }` | ✅ Thực tế |
| PUT | `/:id/cancel`| (Bearer) | `{ code: 0, message, result: order }` | ✅ Thực tế |
| DELETE| `/:id` | (ADMIN only) | `{ code: 0, message }` | ✅ Thực tế |

---

### 📌 Payment (Base: `/payment` hoặc `/api/payment`)

| Method | Path | Request | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/orders/requirement` | (Bearer) `{ items: [ { productVariantId, quantity } ] }` | `{ code: 0, result: { orderTotal, itemRequirements } }` | ✅ Thực tế |
| POST | `/checkout` | (Bearer) `{ orderId }` hoặc query `?orderId=...` | `{ code: 0, result: paymentUrl }` | ✅ Thực tế |
| GET | `/vnpay-callback` | public (VNPay IPN request) | (Redirect về FE) | ✅ Thực tế |

* **Phương thức thanh toán hỗ trợ:** Duy nhất cổng trực tuyến `VNPAY` (COD bị tắt bỏ).

---

### 📌 Admin & Dashboard (Base: `/api`)

| Method | Path | Request | Response | Status |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/users` | (ADMIN) Query: `role, search` | `{ code: 0, result: users }` | ✅ Thực tế |
| PUT | `/users/:id/role` | (ADMIN) `{ role }` | `{ code: 0, message, result: user }` | ✅ Thực tế |
| PUT | `/users/:id/status`| (ADMIN) `{ status }` (ACTIVE/INACTIVE) | `{ code: 0, message, result: user }` | ✅ Thực tế |
| DELETE| `/users/:id` | (ADMIN) | `{ code: 0, message }` | ✅ Thực tế |
| GET | `/dashboard/revenue`| (MANAGER/ADMIN) | `{ code: 1000, message, result: stats }` | ✅ Thực tế |

---

## 2. CANONICAL DATA TYPES

- **Naming Convention:** `snake_case` (JSON và database)
- **Date format:** ISO8601, UTC

**Product:**
`_id`, `name`, `brand`, `category`, `gender`, `price`, `discountPrice`, `imageUrl`, `stock_quantity`, `status`

**ProductVariant:**
`_id`, `productId`, `colorName`, `frameFinish`, `lensWidthMm`, `bridgeWidthMm`, `templeLengthMm`, `sizeLabel`, `price`, `quantity`, `status`, `orderItemType` (IN_STOCK / PRE_ORDER)

**Order:**
`_id`, `user_id`, `status` (`PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REFUNDED`), `deliveryAddress`, `recipientName`, `phoneNumber`, `total_amount`, `prescription_text`, `prescription_image`, `created_at`, `updated_at`

**OrderItem:**
`_id`, `order_id`, `product_variant_id`, `quantity`, `unitPrice`

---

## 3. ROLE MATRIX

| API Group (Base) | CUSTOMER | SALE | MANAGER | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| `GET /api/products` | ✅ | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE /api/products` | ❌ | ❌ | ✅ | ✅ |
| `GET /orders/me`, `POST /orders/create` | ✅ | ❌ | ❌ | ❌ |
| `PUT /orders/:id/cancel` | ✅ | ✅ | ✅ | ✅ |
| `GET /orders` (All), `PUT /orders/:id/status` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /orders/:id` | ❌ | ❌ | ❌ | ✅ |
| `GET /api/users/*` (All users list / CRUD role) | ❌ | ❌ | ❌ | ✅ |
| `GET /api/dashboard/revenue` | ❌ | ❌ | ✅ | ✅ |

---

## 4. ENVIRONMENT INFO

- Development Server: **5000** (Node.js + Express)
- Frontend client: **3000** (hoặc port của Vite phát triển ở local)
- Cơ chế giải phóng rác: Quét dọn các đơn hàng `PENDING` quá 15 phút được chạy ngay trong file khởi động `server.js`.
