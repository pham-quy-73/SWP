# 📄 Tài liệu API – Optics Management (Thu nhỏ)

**Phiên bản:** 1.0  
**Cơ sở URL:** `http://localhost:8080/api` (hoặc domain thực tế)  
**Định dạng dữ liệu:** JSON  
**Xác thực:** JWT token qua header `Authorization: Bearer <token>`

---

## 📌 Ghi chú chung

- Mỗi API đều có thể trả về mã lỗi chuẩn HTTP:
  - `200` – Thành công
  - `201` – Tạo thành công
  - `400` – Dữ liệu gửi lên không hợp lệ
  - `401` – Chưa xác thực (thiếu token hoặc token hết hạn)
  - `403` – Không có quyền (role không đủ)
  - `404` – Không tìm thấy tài nguyên
  - `500` – Lỗi server

- Các role: `CUSTOMER`, `SALE`, `ADMIN`. Quyền truy cập được ghi rõ ở từng API.

---

## 1. Xác thực (Auth)

### 1.1 Đăng ký tài khoản (CUSTOMER)

```http
POST /auth/register
```

**Request body:**

```json
{
  "username": "john_doe",
  "password": "123456",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "0912345678"
}
```

**Response (201):**

```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "65a1b2c3d4e5f6...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  }
}
```

### 1.2 Đăng nhập

```http
POST /auth/login
```

**Request:**

```json
{
  "username": "john_doe",
  "password": "123456"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  }
}
```

### 1.3 Lấy thông tin cá nhân (CUSTOMER, SALE, ADMIN)

```http
GET /auth/me
```

**Response (200):**

```json
{
  "id": "...",
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "0912345678",
  "role": "CUSTOMER"
}
```

### 1.4 Cập nhật thông tin cá nhân

```http
PUT /auth/me
```

**Request (chỉ gửi các trường cần cập nhật):**

```json
{
  "full_name": "Johnathan Doe",
  "phone": "0987654321"
}
```

**Response (200):**

```json
{
  "message": "Cập nhật thành công",
  "user": { ... }
}
```

---

## 2. Sản phẩm (Products) – CUSTOMER, SALE, ADMIN

### 2.1 Lấy danh sách sản phẩm (phân trang, tìm kiếm)

```http
GET /products?page=1&limit=10&search=rayban&brand=Rayban&minPrice=500000&maxPrice=2000000
```

**Query params:**

- `page` (default 1)
- `limit` (default 10)
- `search` (tìm theo tên hoặc brand)
- `brand`
- `minPrice`, `maxPrice`

**Response (200):**

```json
{
  "items": [
    {
      "_id": "...",
      "name": "Gọng Rayban Aviator",
      "brand": "Rayban",
      "price": 1500000,
      "image": "rayban.jpg",
      "stock_quantity": 50,
      "description": "..."
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 2.2 Lấy chi tiết sản phẩm

```http
GET /products/:id
```

**Response (200):**

```json
{
  "_id": "...",
  "name": "Gọng Rayban Aviator",
  "brand": "Rayban",
  "price": 1500000,
  "image": "rayban.jpg",
  "stock_quantity": 50,
  "description": "..."
}
```

### 2.3 Thêm sản phẩm (ADMIN)

```http
POST /products
```

**Request (multipart/form-data hoặc JSON):**

```json
{
  "name": "Gọng mới",
  "brand": "Gucci",
  "price": 2500000,
  "image": "gucci.jpg",
  "stock_quantity": 20,
  "description": "Hàng cao cấp"
}
```

**Response (201):** trả về sản phẩm vừa tạo.

### 2.4 Cập nhật sản phẩm (ADMIN)

```http
PUT /products/:id
```

**Request:** các trường cần sửa (tương tự như thêm).

**Response (200):** sản phẩm sau cập nhật.

### 2.5 Xóa / ẩn sản phẩm (ADMIN)

```http
DELETE /products/:id
```

**Response (200):** `{ "message": "Đã xóa sản phẩm" }`

---

## 3. Giỏ hàng (Cart) – CUSTOMER

### 3.1 Xem giỏ hàng của tôi

```http
GET /cart
```

**Response (200):**

```json
{
  "items": [
    {
      "product_id": "...",
      "product_name": "Gọng Rayban",
      "unit_price": 1500000,
      "quantity": 2,
      "total": 3000000
    }
  ],
  "total_amount": 3000000
}
```

### 3.2 Thêm sản phẩm vào giỏ

```http
POST /cart
```

**Request:**

```json
{
  "product_id": "...",
  "quantity": 1
}
```

**Response (200):** giỏ hàng sau khi thêm.

### 3.3 Cập nhật số lượng

```http
PUT /cart/:product_id
```

**Request:**

```json
{
  "quantity": 3
}
```

**Response (200):** giỏ hàng sau cập nhật.

### 3.4 Xóa sản phẩm khỏi giỏ

```http
DELETE /cart/:product_id
```

**Response (200):** `{ "message": "Đã xóa" }`

---

## 4. Đơn hàng (Orders)

### 4.1 Tạo đơn hàng từ giỏ (CUSTOMER)

```http
POST /orders
```

**Request:**

```json
{
  "shipping_name": "John Doe",
  "shipping_phone": "0912345678",
  "shipping_address": "123 Đường Láng, Hà Nội",
  "prescription_text": "OD: -2.0, OS: -1.5, PD: 62",
  "prescription_image": "https://cloudinary.com/...", // có thể null
  "payment_method": "VNPAY"
}
```

**Response (201):**

```json
{
  "order_id": "...",
  "total_amount": 3000000,
  "payment_url": "https://sandbox.vnpay.vn/payment?vnp_..."
}
```

> Sau khi tạo, khách hàng chuyển hướng đến `payment_url` để thanh toán. Hệ thống sẽ nhận callback từ VNPay để cập nhật trạng thái.

### 4.2 Lấy danh sách đơn hàng của tôi (CUSTOMER)

```http
GET /orders/my-orders
```

**Response (200):**

```json
[
  {
    "_id": "...",
    "status": "AWAITING_VERIFICATION",
    "total_amount": 3000000,
    "created_at": "2026-04-15T10:00:00Z",
    "order_items": [...]
  }
]
```

### 4.3 Lấy chi tiết đơn hàng (CUSTOMER, SALE, ADMIN)

```http
GET /orders/:id
```

**Response (200):** đầy đủ thông tin đơn + items + payment + verification.

### 4.4 Xác nhận đã nhận hàng (CUSTOMER)

```http
PUT /orders/:id/confirm-received
```

**Response (200):**

```json
{
  "message": "Đã xác nhận nhận hàng",
  "status": "COMPLETED"
}
```

Chỉ thực hiện được khi đơn đang `CONFIRMED`.

### 4.5 Hủy đơn hàng (CUSTOMER – chỉ khi PENDING hoặc AWAITING_VERIFICATION)

```http
PUT /orders/:id/cancel
```

**Request (optional):**

```json
{
  "reason": "Đổi ý"
}
```

**Response (200):**

```json
{
  "message": "Đã hủy đơn hàng",
  "status": "CANCELLED"
}
```

### 4.6 Lấy tất cả đơn hàng (SALE, ADMIN)

```http
GET /orders?status=AWAITING_VERIFICATION&page=1&limit=20
```

**Query params:** `status`, `userId`, `fromDate`, `toDate`

**Response (200):** danh sách đơn + phân trang.

### 4.7 Chuyển trạng thái đơn (ADMIN) – tuỳ chọn

```http
PUT /orders/:id/status
```

**Request:**

```json
{
  "status": "COMPLETED"
}
```

**Response (200):** thông báo thành công.

---

## 5. Xác minh đơn hàng (Verification) – SALE, ADMIN

### 5.1 Lấy danh sách đơn chờ xác minh

```http
GET /verification/pending
```

**Response (200):** danh sách đơn `AWAITING_VERIFICATION`.

### 5.2 Duyệt đơn (APPROVE)

```http
POST /verification/approve/:order_id
```

**Request (optional):**

```json
{
  "note": "Đơn thuốc hợp lệ"
}
```

**Response (200):**

```json
{
  "message": "Đã duyệt đơn",
  "order_status": "CONFIRMED"
}
```

### 5.3 Từ chối đơn (REJECT)

```http
POST /verification/reject/:order_id
```

**Request:**

```json
{
  "reason": "Đơn thuốc không rõ, thiếu thông tin"
}
```

**Response (200):**

```json
{
  "message": "Đã từ chối đơn",
  "order_status": "CANCELLED"
}
```

### 5.4 Xem lịch sử xác minh của một đơn (SALE, ADMIN)

```http
GET /verification/order/:order_id
```

**Response (200):** bản ghi verification.

---

## 6. Thanh toán (Payment)

### 6.1 Nhận callback từ VNPay (không cần token)

```http
POST /payment/vnpay-callback
```

**Request:** VNPay gửi đến dạng query params hoặc POST form. Hệ thống sẽ xử lý, cập nhật trạng thái thanh toán và chuyển đơn sang `AWAITING_VERIFICATION` nếu thành công.

**Response (200):** hiển thị trang thông báo kết quả cho khách.

### 6.2 Lấy thông tin thanh toán của đơn (CUSTOMER, SALE, ADMIN)

```http
GET /payment/order/:order_id
```

**Response (200):**

```json
{
  "amount": 3000000,
  "method": "VNPAY",
  "status": "PAID",
  "transaction_id": "VNPAY_123456",
  "payment_time": "2026-04-15T10:05:00Z"
}
```

---

## 7. Quản lý người dùng (User) – ADMIN

### 7.1 Lấy danh sách người dùng

```http
GET /admin/users?role=SALE&status=ACTIVE
```

**Response (200):**

```json
[
  {
    "id": "...",
    "username": "sale1",
    "email": "sale@example.com",
    "full_name": "Nguyễn Văn Sale",
    "role": "SALE",
    "status": "ACTIVE"
  }
]
```

### 7.2 Tạo tài khoản nhân viên (SALE hoặc ADMIN)

```http
POST /admin/users
```

**Request:**

```json
{
  "username": "sale_nguyen",
  "password": "123456",
  "full_name": "Nguyễn Thị Sale",
  "email": "sale.nguyen@shop.com",
  "phone": "0912345679",
  "role": "SALE"
}
```

**Response (201):** thông tin user vừa tạo.

### 7.3 Khóa / mở khóa tài khoản

```http
PUT /admin/users/:id/toggle-status
```

**Response (200):**

```json
{
  "message": "Tài khoản đã bị khóa",
  "status": "INACTIVE"
}
```

### 7.4 Xóa tài khoản (optional)

```http
DELETE /admin/users/:id
```

---

## 8. Dashboard – ADMIN

### 8.1 Lấy tổng quan đơn giản

```http
GET /admin/dashboard
```

**Response (200):**

```json
{
  "total_orders": 120,
  "total_revenue": 240000000,
  "pending_verification": 5,
  "top_products": [
    { "name": "Gọng Rayban", "sold": 45 },
    { "name": "Gọng Gucci", "sold": 30 }
  ]
}
```

---

## 9. Refund (Hoàn tiền – ghi nhận thủ công) – ADMIN

### 9.1 Tạo yêu cầu hoàn tiền cho đơn đã hủy

```http
POST /admin/refunds
```

**Request:**

```json
{
  "order_id": "...",
  "amount": 3000000,
  "reason": "Khách hủy đơn"
}
```

**Response (201):**

```json
{
  "message": "Đã tạo yêu cầu hoàn tiền",
  "refund": { ... }
}
```

### 9.2 Xác nhận đã hoàn tiền (thủ công)

```http
PUT /admin/refunds/:id/complete
```

**Response (200):**

```json
{
  "message": "Đã xác nhận hoàn tiền",
  "order_status": "REFUNDED"
}
```

### 9.3 Xem danh sách refund

```http
GET /admin/refunds?status=PENDING
```

**Response (200):** danh sách các refund.

---

## 10. Upload ảnh (chung)

```http
POST /upload
```

**Request:** `multipart/form-data` với field `file`

**Response (200):**

```json
{
  "url": "https://cloudinary.com/.../image.jpg"
}
```

Dùng để upload ảnh đơn thuốc hoặc ảnh sản phẩm.

---

## 📎 Mã trạng thái đơn hàng

| Status                  | Ý nghĩa                                   |
| ----------------------- | ----------------------------------------- |
| `PENDING`               | Chờ thanh toán                            |
| `AWAITING_VERIFICATION` | Đã thanh toán, chờ xác minh đơn thuốc     |
| `CONFIRMED`             | Đã xác minh, chờ khách xác nhận nhận hàng |
| `COMPLETED`             | Đã hoàn thành                             |
| `CANCELLED`             | Đã hủy                                    |
| `REFUNDED`              | Đã hoàn tiền (sau khi hủy)                |

---

## 🔒 Phân quyền tóm tắt

| API                            | CUSTOMER           | SALE | ADMIN |
| ------------------------------ | ------------------ | ---- | ----- |
| `/auth/*` (trừ login/register) | ✅                 | ✅   | ✅    |
| `/products` GET                | ✅                 | ✅   | ✅    |
| `/products` POST/PUT/DELETE    | ❌                 | ❌   | ✅    |
| `/cart/*`                      | ✅                 | ❌   | ❌    |
| `/orders/my-orders`            | ✅                 | ❌   | ❌    |
| `/orders` POST                 | ✅                 | ❌   | ❌    |
| `/orders/:id` GET              | (chỉ đơn của mình) | ✅   | ✅    |
| `/orders/:id/confirm-received` | ✅                 | ❌   | ❌    |
| `/verification/*`              | ❌                 | ✅   | ✅    |
| `/admin/*`                     | ❌                 | ❌   | ✅    |

---

**Ghi chú:** Đây là tài liệu API cơ bản cho dự án thu nhỏ. Khi triển khai thực tế, cần bổ sung thêm validation, error handling chi tiết và bảo mật.
