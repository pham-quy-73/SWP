# Tài liệu dự án Shop Kính Mắt

## Tính năng (Feature Overview)

| Tính năng | Trạng thái | Ưu tiên |
| --- | --- | --- |
| Đăng ký / Đăng nhập (JWT) | ✅ | Cao |
| Xem danh sách sản phẩm (gọng kính) | ✅ | Cao |
| Chi tiết sản phẩm | ✅ | Cao |
| Giỏ hàng (cart) | ✅ | Cao |
| Tạo đơn hàng (chỉ IN_STOCK, không pre-order) | ✅ | Cao |
| Nhập đơn thuốc (Prescription) | ✅ | Trung bình (điểm nhấn) |
| Upload ảnh đơn thuốc | ✅ | Trung bình |
| Thanh toán VNPay (FULL 100% một lần) | ✅ | Cao (điểm kỹ thuật) |
| Xác minh đơn thuốc bởi SALE | ✅ | Cao (đặc thù kính mắt) |
| Quản lý đơn hàng cho SALE (approve/reject) | ✅ | Cao |
| Quản lý sản phẩm cho ADMIN | ✅ | Cao |
| Lịch sử đơn hàng của khách | ✅ | Cao |
| Hủy đơn (trước khi xác minh) | ✅ | Trung bình |
| Hoàn tiền đơn giản (hủy → refund 100% thủ công) | ⚠️ | Thấp (có thể bỏ) |
| Combo khuyến mãi đơn giản | ⚠️ | Thấp (nếu còn thời gian) |

---

# Feature chi tiết theo Actor

Dưới đây là danh sách chi tiết các tính năng cho từng **Actor** trong dự án **thu nhỏ (3-4 người, 6 tuần)** dựa trên mô hình shop kính có sẵn (IN_STOCK), có đơn thuốc, xác minh bởi Sale, thanh toán VNPay, không pre-order, không sản xuất, không giao hàng phức tạp.

## 1. 👤 CUSTOMER (Khách hàng)

### Tài khoản & xác thực
- Đăng ký tài khoản (email, mật khẩu, số điện thoại)
- Đăng nhập (JWT hoặc session)
- Đăng xuất
- Xem / cập nhật thông tin cá nhân (tên, địa chỉ, số điện thoại)

### Sản phẩm
- Xem danh sách sản phẩm (gọng kính) với bộ lọc cơ bản (giá, thương hiệu, loại)
- Xem chi tiết sản phẩm (hình ảnh, mô tả, giá, tồn kho)
- Tìm kiếm sản phẩm theo tên

### Giỏ hàng
- Thêm sản phẩm vào giỏ
- Xóa sản phẩm khỏi giỏ
- Cập nhật số lượng
- Xem giỏ hàng hiện tại

### Đặt hàng (luồng chính)
- **Tạo đơn hàng từ giỏ hàng**:
  - Nhập thông tin giao hàng (tên, số điện thoại, địa chỉ nhận)
  - **Nhập đơn thuốc** (bắt buộc nếu sản phẩm yêu cầu – thường là text: OD, OS, PD…)
  - **Upload ảnh đơn thuốc** (tuỳ chọn, lưu URL)
- **Thanh toán qua VNPay** (100% giá trị đơn hàng)
- **Hủy đơn hàng** (chỉ khi đơn đang ở trạng thái `PENDING` hoặc `AWAITING_VERIFICATION`)

### Theo dõi đơn hàng
- Xem danh sách đơn hàng của mình (lịch sử)
- Xem chi tiết từng đơn (trạng thái, sản phẩm, đơn thuốc đã gửi)
- **Xác nhận đã nhận hàng** (chuyển đơn từ `CONFIRMED` → `COMPLETED`)

### Đánh giá (tuỳ chọn, nếu có thời gian)
- Đánh giá sản phẩm đã mua (sao + bình luận)

---

## 2. 👔 SALE STAFF (Nhân viên bán hàng)

> Có thể đăng nhập với role `SALE`

### Xác minh đơn hàng
- Xem danh sách đơn hàng đang chờ xác minh (`AWAITING_VERIFICATION`)
- Xem chi tiết đơn hàng (thông tin khách, sản phẩm, đơn thuốc text, ảnh upload)
- **Duyệt đơn** → chuyển sang trạng thái `CONFIRMED` (hàng sẵn sàng, chờ giao/xác nhận)
- **Từ chối đơn** → chuyển sang `CANCELLED` (kèm lý do từ chối)

### Quản lý đơn hàng (hỗ trợ)
- Xem tất cả đơn hàng (lọc theo trạng thái)
- Ghi chú nội bộ cho đơn hàng (tuỳ chọn)

### Hỗ trợ khách hàng
- Xem thông tin khách hàng (liên hệ khi cần)

---

## 3. 🛡️ ADMIN (Quản trị viên)

> Có quyền cao nhất, bao gồm tất cả quyền của SALE và thêm các quyền quản trị.

### Quản lý sản phẩm
- Thêm mới sản phẩm (tên, giá, mô tả, hình ảnh, số lượng tồn kho)
- Sửa thông tin sản phẩm
- Xoá / ẩn sản phẩm
- Xem danh sách sản phẩm (có phân trang, tìm kiếm)

### Quản lý đơn hàng (toàn bộ)
- Xem tất cả đơn hàng (tất cả trạng thái)
- **Chủ động cập nhật trạng thái đơn hàng** (ví dụ: `CONFIRMED` → `COMPLETED` nếu khách không xác nhận)
- Hủy đơn (bất kỳ trạng thái nào trước `COMPLETED`)

### Quản lý người dùng (cơ bản)
- Xem danh sách người dùng (khách, sale, admin)
- Tạo tài khoản cho nhân viên (sale, admin)
- Khoá / mở khoá tài khoản
- Đặt lại mật khẩu (tuỳ chọn)

### Thống kê đơn giản (dashboard)
- Tổng số đơn hàng, doanh thu (theo ngày/tuần)
- Top sản phẩm bán chạy
- Biểu đồ đơn giản (Chart.js)

### Quản lý đơn thuốc mẫu (tuỳ chọn)
- Xem danh sách đơn thuốc đã upload (để kiểm tra)

---

## 4. 🔄 Các tính năng chung (hỗ trợ nhiều actor)
- **Authentication & Authorization** (JWT, role-based)
- **Upload file** (ảnh đơn thuốc lên Cloudinary hoặc local)
- **Logging hành động** (ghi lại ai đã duyệt/hủy đơn)

---

## Tổng kết số lượng tính năng theo mức độ ưu tiên

| Actor | Số tính năng chính | Ghi chú |
| --- | --- | --- |
| Customer | 12 | Đủ để khách hàng trải nghiệm |
| Sale | 5 | Tập trung vào xác minh đơn |
| Admin | 8 | Gồm CRUD sản phẩm, user, thống kê |

**Tổng cộng khoảng 25-30 tính năng** – vừa vặn cho 3-4 người trong 6 tuần (khoảng 4-5 tính năng/người/tuần).

---

## Lưu ý khi triển khai
- **Không có** Shipper, Operation, Pre-order, combo phức tạp, hoàn tiền tự động, realtime notification.
- **Thanh toán**: chỉ tích hợp VNPay với 1 lần thanh toán 100% (không deposit/remaining).
- **Trạng thái đơn hàng chỉ 5 mức**: `PENDING` → `AWAITING_VERIFICATION` → `CONFIRMED` → (khách xác nhận nhận) `COMPLETED` và `CANCELLED`.
- **Tồn kho**: cập nhật thủ công qua admin (hoặc trừ tự động khi đơn thành `CONFIRMED` nếu đơn giản).

---

# Các chức năng lớp (Modules)

Dưới đây là các **chức năng lớp** (modules) gộp nhóm từ các feature chính, phù hợp với dự án 6 tuần, 3-4 người. Mỗi module bao gồm các feature cốt lõi bắt buộc.

## 🧩 Module 1: Xác thực & Phân quyền
**Mục tiêu:** Đăng nhập, phân biệt vai trò, bảo vệ API.

| Feature chính |
| --- |
| Đăng ký tài khoản (CUSTOMER) |
| Đăng nhập (JWT) |
| Đăng xuất |
| Xem / cập nhật thông tin cá nhân |
| Middleware phân quyền theo role (CUSTOMER, SALE, ADMIN) |

---

## 🧩 Module 2: Quản lý sản phẩm
**Mục tiêu:** Hiển thị và quản trị sản phẩm (gọng kính).

| Feature chính |
| --- |
| Xem danh sách sản phẩm (phân trang, tìm kiếm cơ bản) |
| Xem chi tiết sản phẩm (ảnh, giá, tồn kho, mô tả) |
| **ADMIN:** Thêm sản phẩm mới (kèm upload ảnh) |
| **ADMIN:** Sửa thông tin sản phẩm |
| **ADMIN:** Xóa / ẩn sản phẩm |
| **ADMIN:** Cập nhật số lượng tồn kho |

---

## 🧩 Module 3: Giỏ hàng & Đặt hàng
**Mục tiêu:** Quản lý giỏ, tạo đơn kèm đơn thuốc.

| Feature chính |
| --- |
| Thêm sản phẩm vào giỏ |
| Xóa sản phẩm khỏi giỏ |
| Cập nhật số lượng trong giỏ |
| Xem giỏ hàng hiện tại |
| Tạo đơn hàng từ giỏ (nhập thông tin giao hàng) |
| Nhập đơn thuốc bắt buộc (text: OD, OS, PD...) |
| Upload ảnh đơn thuốc (lưu URL) |
| Kiểm tra tồn kho trước khi tạo đơn |
| Tạo đơn với trạng thái `PENDING` |

---

## 🧩 Module 4: Thanh toán VNPay
**Mục tiêu:** Tích hợp cổng thanh toán, xử lý callback.

| Feature chính |
| --- |
| Tạo URL thanh toán VNPay (100% giá trị đơn) |
| Chuyển hướng khách sang VNPay |
| Xử lý callback từ VNPay (cập nhật trạng thái thanh toán) |
| Sau thanh toán thành công → cập nhật đơn thành `AWAITING_VERIFICATION` |

---

## 🧩 Module 5: Xác minh đơn hàng (SALE)
**Mục tiêu:** Nhân viên bán hàng kiểm tra đơn thuốc và duyệt/từ chối.

| Feature chính |
| --- |
| Xem danh sách đơn hàng chờ xác minh (`AWAITING_VERIFICATION`) |
| Xem chi tiết đơn hàng (thông tin khách, sản phẩm, đơn thuốc text + ảnh) |
| Duyệt đơn → chuyển sang `CONFIRMED` |
| Từ chối đơn → chuyển sang `CANCELLED` (kèm lý do) |

---

## 🧩 Module 6: Quản lý đơn hàng & Trạng thái
**Mục tiêu:** Cho phép khách hàng và admin theo dõi, cập nhật trạng thái đơn.

| Feature chính |
| --- |
| **Khách hàng:** Xem danh sách đơn của mình (lịch sử) |
| **Khách hàng:** Xem chi tiết từng đơn |
| **Khách hàng:** Xác nhận đã nhận hàng (khi đơn `CONFIRMED` → `COMPLETED`) |
| **Khách hàng:** Hủy đơn (khi đơn `PENDING` hoặc `AWAITING_VERIFICATION`) |
| **ADMIN:** Xem tất cả đơn hàng (lọc theo trạng thái, ngày) |
| **ADMIN:** Chủ động chuyển `CONFIRMED` → `COMPLETED` (nếu khách không bấm) |
| **ADMIN:** Hủy đơn bất kỳ (chưa hoàn thành) |

---

## 🧩 Module 7: Quản trị người dùng & Dashboard
**Mục tiêu:** Admin quản lý tài khoản nhân viên và xem thống kê cơ bản.

| Feature chính |
| --- |
| Xem danh sách tất cả người dùng (role, trạng thái) |
| Tạo tài khoản mới cho SALE (gán role SALE) |
| Khóa / mở khóa tài khoản |
| **Dashboard đơn giản:** Tổng số đơn hàng, tổng doanh thu (theo ngày/tuần) |
| (Tuỳ chọn) Top 5 sản phẩm bán chạy |

---

## 📌 Tổng kết cấu trúc các chức năng lớp

| Module | Số feature chính | Ưu tiên |
| --- | --- | --- |
| 1. Xác thực & Phân quyền | 5 | ✅ Bắt buộc |
| 2. Quản lý sản phẩm | 6 | ✅ Bắt buộc |
| 3. Giỏ hàng & Đặt hàng | 9 | ✅ Bắt buộc |
| 4. Thanh toán VNPay | 4 | ✅ Bắt buộc |
| 5. Xác minh đơn hàng (SALE) | 4 | ✅ Bắt buộc |
| 6. Quản lý đơn hàng & Trạng thái | 7 | ✅ Bắt buộc |
| 7. Quản trị người dùng & Dashboard | 5 | ✅ Bắt buộc (dashboard có thể đơn giản) |

**Tổng cộng 7 module, khoảng 40 feature con** – rất khả thi cho 3-4 người trong 6 tuần.

Bạn có thể dùng các module này để phân công: mỗi người đảm nhận 1-2 module, hoặc chia theo frontend/backend.

## Phân công thành viên

| Thành viên | Module đảm nhận | Số lượng Feature | Mức độ phức tạp |
| --- | --- | --- | --- |
|  | M1 + M7 | 10 | Trung bình - Khó |
|  | M3 | 9 | Khó |
| Quân | M4 + M5 | 8 | Trung bình |
| Trưởng | M6 | 7 | Trung bình |
| Bảo | M2 | 6 | Dễ - Trung bình |

**Sự phụ thuộc luồng (Dependency):**
- M2 (Sản phẩm) phải có trước → M3 (Giỏ hàng) mới có cái để thêm vào.
- M3 (Đặt hàng) phải xong → M4 (VNPay) mới có đơn để thanh toán.

---

# Database (Schema SQL)

```
User (id, username, password, role, email, phone)
Product (id, name, brand, price, image, stock_quantity, description)
Order (id, user_id, status, total_amount, prescription_text, prescription_image, created_at)
OrderItem (id, order_id, product_id, quantity, unit_price)
Payment (id, order_id, amount, method, status, transaction_id)
Verification (id, order_id, verified_by, status, note)  -- ghi nhận approve/reject
Cart (id, user_id, product_id, quantity)
Refund (id, order_id, amount, reason, status) -- đơn giản, optional
```

## 📁 Cấu trúc MongoDB Collections (bỏ qua indexes & ràng buộc)

Dưới đây là các **collection** tương ứng với 8 bảng SQL, chỉ định nghĩa cấu trúc document cơ bản, **không có indexes, không ràng buộc dữ liệu** (unique, required, foreign key…).

### 1. Collection `User`
Mỗi document đại diện cho một người dùng.

```json
{
  "_id": ObjectId,
  "username": "string",
  "password": "string",
  "role": "string",        // ví dụ: "CUSTOMER", "SALE", "ADMIN"
  "email": "string",
  "phone": "string"
}
```

> **Ghi chú:** Các trường `created_at`, `updated_at`, `full_name`… có thể thêm nếu cần, nhưng theo yêu cầu chỉ có các trường trong bảng `User` gốc.

---

### 2. Collection `Product`
Sản phẩm (gọng kính).

```json
{
  "_id": ObjectId,
  "name": "string",
  "brand": "string",
  "price": "number",        // ví dụ: 1500000
  "image": "string",        // đường dẫn ảnh
  "stock_quantity": "number",
  "description": "string"
}
```

---

### 3. Collection `Cart`
Giỏ hàng, mỗi document là một dòng sản phẩm trong giỏ của một user.

```json
{
  "_id": ObjectId,
  "user_id": ObjectId,      // tham chiếu đến User._id
  "product_id": ObjectId,   // tham chiếu đến Product._id
  "quantity": "number"
}
```

---

### 4. Collection `Order`
Đơn hàng.

```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "status": "string",        // PENDING, AWAITING_VERIFICATION, CONFIRMED, COMPLETED, CANCELLED, REFUNDED
  "total_amount": "number",
  "prescription_text": "string",
  "prescription_image": "string",
  "created_at": "date"       // có thể là ISODate
}
```

> Có thể thêm `updated_at` nếu muốn.

---

### 5. Collection `OrderItem`
Chi tiết sản phẩm trong đơn hàng.

```json
{
  "_id": ObjectId,
  "order_id": ObjectId,      // tham chiếu đến Order._id
  "product_id": ObjectId,    // tham chiếu đến Product._id
  "quantity": "number",
  "unit_price": "number"
}
```

---

### 6. Collection `Payment`
Thanh toán cho đơn hàng.

```json
{
  "_id": ObjectId,
  "order_id": ObjectId,
  "amount": "number",
  "method": "string",        // ví dụ: "VNPAY", "COD"
  "status": "string",        // PENDING, PAID, FAILED
  "transaction_id": "string"
}
```

---

### 7. Collection `Verification`
Ghi nhận việc xác minh đơn hàng bởi nhân viên Sale.

```json
{
  "_id": ObjectId,
  "order_id": ObjectId,
  "verified_by": ObjectId,   // User._id của SALE
  "status": "string",        // APPROVED, REJECTED
  "note": "string"
}
```

---

### 8. Collection `Refund`
Hoàn tiền (optional).

```json
{
  "_id": ObjectId,
  "order_id": ObjectId,
  "amount": "number",
  "reason": "string",
  "status": "string"         // PENDING, COMPLETED
}
```

---

## 📌 Lưu ý
- **Kiểu dữ liệu:** `ObjectId` là kiểu ObjectId của MongoDB. Các trường khác dùng `string`, `number`, `date` (ISODate).
- **Không có ràng buộc:** không có `required`, không có `unique`, không có `foreign key` (dù các trường `_id` tham chiếu vẫn được lưu nhưng không có ràng buộc ở cấp database).
- **Bạn có thể thêm bất kỳ trường nào khác** (ví dụ `created_at`, `updated_at`) mà không cần theo đúng cấu trúc SQL.

---

# ENV

## Backend (BE)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/SWP
JWT_SECRET=123456
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=236015909843-qoagbf86ehlsov4f1j55hiv88dif8nc3.apps.googleusercontent.com
```

## Frontend (FE)

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=236015909843-qoagbf86ehlsov4f1j55hiv88dif8nc3.apps.googleusercontent.com
```
