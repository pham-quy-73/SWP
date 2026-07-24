## 📌 Tổng quan dự án: Optics Management

### 1. Giới thiệu

**Optics Management** là hệ thống quản lý bán hàng trực tuyến dành cho sản phẩm kính mắt. Dự án tập trung giải quyết luồng nghiệp vụ cốt lõi: Khách hàng chọn gọng kính (theo biến thể màu sắc/kích thước), lựa chọn tròng kính kèm đơn thuốc quang học, thanh toán trực tuyến 100% qua cổng VNPay Sandbox, và quản lý các trạng thái giao dịch một cách có hệ thống. Các bộ phận quản trị (Admin, Manager) có công cụ theo dõi doanh thu, quản lý người dùng và xử lý hoàn tiền cho các đơn đã thanh toán bị hủy.

---

### 2. Mục tiêu

- Xây dựng một web app hoàn chỉnh với đầy đủ chức năng quản lý, phân bổ bán hàng cho một thương hiệu kính mắt trực tuyến vừa và nhỏ.
- Áp dụng các công nghệ thực tế: xác thực JWT/Google OAuth2, phân quyền người dùng đa vai trò và tích hợp cổng thanh toán VNPay Sandbox.
- Quản lý kho hàng thông minh ở cấp **biến thể sản phẩm** (ProductVariant), tự động trừ tồn kho ngay khi khởi tạo đơn và tự động hoàn trả kho khi đơn hàng bị hủy bỏ hoặc hết hạn thanh toán.
- Hỗ trợ quy trình hoàn tiền (Refund) cho các đơn đã thanh toán VNPay nhưng bị hủy, với thông tin tài khoản ngân hàng người nhận được nhúng trực tiếp trong đơn hàng.
- Bảo vệ tính toàn vẹn dữ liệu y tế quang học qua hệ thống **validate đơn kính thuốc** nghiêm ngặt ở cả Frontend và Backend.

---

### 3. Phạm vi (Scope)

**Bao gồm:**

- **Các vai trò (Actors) hiện triển khai:** `CUSTOMER` (Khách hàng), `MANAGER` (Quản lý cửa hàng), `ADMIN` (Quản trị viên hệ thống).
- **Hỗ trợ Đặt trước (Pre-order):** Biến thể sản phẩm có thuộc tính `orderItemType` = `IN_STOCK` | `PRE_ORDER` cho phép mở bán sản phẩm chưa sẵn hàng trong kho.
- **Quản lý sản phẩm & biến thể:** Product chia theo `category` (`FRAME` / `SUNGLASSES` / `LENS`). Mỗi Product có nhiều `ProductVariant` với `sku`, `colorName`, `frameFinish`, `lensWidthMm`, `bridgeWidthMm`, `templeLengthMm`, `sizeLabel`, `price`, `discountPrice` và tồn kho riêng (`quantity`).
- **Quản lý tròng kính (Lens):** Catalog tròng kính riêng với thông tin chất liệu, loại tròng, giá. Khách chọn tròng kính kết hợp với gọng khi đặt hàng.
- **Đơn kính thuốc (Prescription):** Khách có thể nhập đơn kính thuốc thủ công (OD/OS: SPH, CYL, AXIS, ADD, PD) hoặc upload ảnh toa thuốc. Dữ liệu được validate nghiêm ngặt ở cả Frontend (auto-format `onBlur` về bội số 0.25/0.5) và Backend (`validatePrescriptionFields` trả lỗi 400 thay vì tự đưa về 0).
- **Sổ địa chỉ (Address book):** Người dùng có thể lưu và chọn địa chỉ giao hàng mặc định từ collection `addresses`. Validate nghiêm ngặt họ tên (≤ 100 ký tự), số điện thoại (định dạng VN), địa chỉ (3-300 ký tự) ở cả Frontend và Backend.
- **Thanh toán trực tuyến 100% qua VNPay Sandbox:** Không hỗ trợ COD.
- **Quản lý trạng thái đơn chặt chẽ:** Vòng đời đơn qua 6 trạng thái — `PENDING` → `AWAITING_VERIFICATION` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `REFUNDED`.
- **Quy trình hoàn tiền (Refund):** Đơn đã thanh toán VNPay khi bị hủy sẽ được đưa vào danh sách chờ hoàn tiền, MANAGER/ADMIN xác nhận đã hoàn tiền thủ công qua thông tin ngân hàng khách cung cấp (`bank_info` được nhúng trong `Order`).
- **Tự động hóa luồng thanh toán:**
  - Khách hàng có thể chủ động hủy đơn hoặc tiếp tục thanh toán đơn `PENDING` nếu lỡ đóng tab VNPay.
  - Tác vụ nền (Background Cleanup Job trong `server.js`) chạy mỗi 5 phút quét và hủy tự động các đơn `PENDING` quá hạn 15 phút, đồng thời hoàn trả tồn kho biến thể.
- **Bảng điều khiển (Dashboard):** Hiển thị doanh thu tổng, doanh thu tháng, tỷ lệ tăng trưởng so với tháng trước, đơn hàng đang xử lý, đơn phát sinh trong ngày và cảnh báo sản phẩm sắp hết hàng.
- **Kiểm thử tích hợp (Integration Tests):** Bộ test tự động sử dụng Vitest + Supertest + mongodb-memory-server với 232+ test cases bao phủ toàn bộ API endpoints.

**Không bao gồm:**

- Các hình thức thanh toán trực tuyến khác ngoài VNPay Sandbox.
- Tự động hoàn tiền qua API VNPay (hoàn tiền được xử lý thủ công dựa trên `bank_info` của đơn, sau đó MANAGER/ADMIN đánh dấu `REFUNDED`).
- Quy trình vận chuyển nội bộ chi tiết (đối tác vận chuyển ngoài hệ thống).
- Trò chuyện trực tuyến thời gian thực (Realtime chat).
- Giỏ hàng phía server: **không có** collection `carts` hoạt động và **không có** API `/cart` ở Backend (giỏ hàng lưu hoàn toàn ở client — xem ADR-006).

---

### 4. Các actor chính & Chức năng

| Actor        | Chức năng chính                                                                                                                                                                                                                                                                                                         |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer** | Đăng ký/Đăng nhập (tài khoản thường hoặc Google OAuth2), xem/lọc sản phẩm theo brand/category, quản lý giỏ hàng client-side (Zustand), chọn tròng kính + nhập đơn thuốc, quản lý sổ địa chỉ, tạo đơn hàng, thanh toán qua VNPay, xem lịch sử đơn, tiếp tục thanh toán đơn `PENDING` chưa hoàn tất, hủy đơn `PENDING`/`AWAITING_VERIFICATION`/`CONFIRMED`. |
| **Manager**  | Quản lý danh mục sản phẩm & tròng kính, tạo/cập nhật/xóa biến thể (màu, kích thước, giá, SKU, tồn kho), cập nhật trạng thái đơn hàng, xem Dashboard, quản lý danh sách đơn đã thanh toán bị hủy và xác nhận hoàn tiền.                                                                                                               |
| **Admin**    | Toàn quyền của Manager + quản lý người dùng (cấp phát tài khoản, đổi vai trò, khóa/mở khóa qua `deleted_at`, cấp lại mật khẩu, xóa vĩnh viễn), xóa đơn hàng khỏi database.                                                                                                                                                                                               |

---

### 5. Luồng nghiệp vụ chính

```
1. Customer thêm sản phẩm vào giỏ (Zustand + localStorage) → chọn tròng + nhập đơn thuốc (nếu cần) → chọn địa chỉ → tạo đơn hàng
2. Backend: validate đơn thuốc (nếu có) → kiểm tồn kho từng ProductVariant → xác thực giá server-side → trừ kho ($inc âm) → tạo Order (status = PENDING) → tạo các OrderItem
3. Customer được điều hướng đến URL VNPay Sandbox (checksum HmacSHA512)
4. VNPay callback (vnpay-callback) → verify chữ ký → cập nhật Order → CONFIRMED (hoặc giữ PENDING nếu thất bại)
5. MANAGER/ADMIN xử lý đơn CONFIRMED → cập nhật trạng thái tuần tự → COMPLETED
6. Nếu Customer hủy đơn hoặc đơn PENDING quá 15 phút → CANCELLED, hoàn kho biến thể ($inc dương)
7. Đơn CANCELLED nhưng đã thanh toán → vào danh sách chờ hoàn tiền → MANAGER chuyển khoản thủ công theo bank_info → đánh dấu REFUNDED
```

---

### 6. Công nghệ triển khai thực tế

| Thành phần            | Công nghệ                       | Chi tiết                                                                                                                                                                                                                         |
| :-------------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**           | Node.js 20 LTS + Express 5.x   | ES Modules (`"type": "module"`), Joi validation, multer phục vụ upload ảnh sản phẩm/biến thể.                                                                                                                                    |
| **Database**          | MongoDB / Mongoose 9.x          | Collections hoạt động: `users`, `products`, `product_variants`, `orders`, `order_items`, `lenses`, `refunds`, `addresses`, `feedbacks`, `verifications`. Collection `carts` **không sử dụng** (giữ file model để tương thích lịch sử). |
| **Frontend**          | React 18 + Vite 5               | JavaScript thuần, styling Tailwind CSS 3.4, animation Framer Motion, toast Sonner, icon Lucide.                                                                                                                                    |
| **Auth**              | JWT + bcrypt, Google OAuth2     | Token gửi qua header `Authorization: Bearer <token>`; đăng nhập Google qua `@react-oauth/google` + `google-auth-library` phía server.                                                                                            |
| **State Client**      | Zustand + persist / React Query | Giỏ hàng `vision-cart-storage` và store đơn thuốc tại localStorage; dữ liệu server (đơn hàng, sản phẩm, dashboard) fetch/cache qua `@tanstack/react-query`.                                                                      |
| **Form & Validation** | react-hook-form + Zod           | Kiểm tra dữ liệu form phía client trước khi gửi API. Bổ sung validate quang học riêng cho đơn kính thuốc (`prescriptionValidation.js`).                                                                                           |
| **Thanh toán**        | VNPay Sandbox                   | Sinh URL thanh toán ký HmacSHA512, callback IPN xác thực chữ ký `vnp_SecureHash` và cập nhật trạng thái đơn.                                                                                                                     |
| **Email**             | Nodemailer                      | Gửi mail xác thực tài khoản qua `verify_token`.                                                                                                                                                                                  |
| **Testing**           | Vitest + Supertest              | 232+ integration tests sử dụng `mongodb-memory-server` cho in-memory DB. Coverage bao phủ: auth, users, products, variants, orders, payment, addresses, dashboard, lenses, refunds, middleware.                                    |

---

### 7. Rủi ro và Giải pháp đồng bộ

- **Giữ kho ảo khi đóng tab thanh toán:**
  - _Giải pháp:_ Background Cleanup Job trong `server.js` chạy mỗi 5 phút quét các đơn `PENDING` có `created_at` cách đây > 15 phút, hủy đơn và cộng lại `quantity` cho các `ProductVariant` liên quan.
- **Bảo mật callback VNPay:**
  - _Giải pháp:_ Tính toán lại chữ ký bằng HmacSHA512 với `secretKey` sandbox và đối sánh với `vnp_SecureHash` trong callback; chỉ cập nhật trạng thái khi khớp tuyệt đối.
- **Giả mạo giá sản phẩm từ Client:**
  - _Giải pháp:_ Trong `OrderController.createOrder`, backend luôn đọc giá gọng từ `ProductVariant` (`discountPrice > 0` được ưu tiên, ngược lại `price`); không sử dụng bất kỳ trường giá nào do client gửi lên.
- **Bảo mật tuyến đường Checkout:**
  - _Giải pháp:_ `PrivateRoute` ở React Router chặn khách vãng lai; trang thanh toán từ chối hiển thị khi giỏ hàng trống.
- **Hoàn tiền cho đơn đã thanh toán bị hủy:**
  - _Giải pháp:_ Nhúng `bank_info` (bank_name / bank_account_number / account_holder_name) vào `Order` khi khách tạo đơn; MANAGER/ADMIN tra cứu danh sách `/orders/cancelled/paid`, chuyển khoản thủ công rồi cập nhật trạng thái sang `REFUNDED` (đồng thời tạo bản ghi `Refund` phục vụ audit).
- **Dữ liệu đơn kính thuốc sai lệch:**
  - _Giải pháp:_ Frontend tự động format giá trị quang học về bội số chuẩn (`0.25` cho SPH/CYL/ADD, `0.5` cho PD) khi mất focus và chặn thêm vào giỏ nếu ngoài miền. Backend gọi `validatePrescriptionFields` trả lỗi `400 VALIDATION_ERROR` thay vì tự ép dữ liệu về 0.
- **Dữ liệu địa chỉ giao hàng không hợp lệ:**
  - _Giải pháp:_ Validate đồng bộ ở cả Frontend (Form sổ địa chỉ, Checkout stepper) và Backend (`AddressController.validateAddressInputs`, `OrderController.createOrder`) — kiểm tra họ tên (≤ 100 ký tự), số điện thoại (định dạng VN `^(\+84|0)\d{8,10}$`), và địa chỉ giao hàng (3-300 ký tự).
