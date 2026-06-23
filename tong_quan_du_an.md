## 📌 Tổng quan dự án: Optics Management

### 1. Giới thiệu

**Optics Management** là hệ thống quản lý bán hàng trực tuyến dành cho sản phẩm kính mắt. Dự án tập trung giải quyết luồng nghiệp vụ cốt lõi: Khách hàng chọn gọng kính có sẵn (hoặc đặt trước sản phẩm chưa về kho), cấu hình đơn kính thuốc, thanh toán trực tuyến qua cổng VNPay, và quản lý các trạng thái giao dịch một cách có hệ thống. Các bộ phận quản trị (Admin, Manager) có công cụ theo dõi doanh thu và chỉnh sửa dữ liệu cửa hàng trực quan.

---

### 2. Mục tiêu

- Xây dựng một web app hoàn chỉnh với đầy đủ chức năng quản lý, phân bổ bán hàng cho một thương hiệu kính mắt trực tuyến vừa và nhỏ.
- Áp dụng các công nghệ thực tế: xác thực JWT/Google OAuth2, phân quyền người dùng đa tác vụ, upload ảnh toa thuốc và tính hợp cổng thanh toán VNPay Sandbox.
- Quản lý kho hàng thông minh, tự động tính toán dự phòng tồn kho trước khi thanh toán và tự động hoàn trả kho khi đơn hàng bị hủy bỏ hoặc hết hạn.

---

### 3. Phạm vi (Scope)

**Bao gồm:**

- **4 vai trò (Actors):** `CUSTOMER` (Khách hàng), `SALE` (Nhân viên bán hàng), `MANAGER` (Quản lý cửa hàng), `ADMIN` (Quản trị viên hệ thống).
- **Hỗ trợ Đơn kính thuốc (Prescription):** Khách hàng có thể nhập thông tin độ khúc xạ hoặc đính kèm tệp ảnh toa thuốc khi đặt hàng.
- **Hỗ trợ Đặt trước (Pre-order):** Hỗ trợ đặt hàng trước đối với sản phẩm hiện chưa sẵn hàng trong kho.
- **Quản lý sản phẩm & biến thể:** Hỗ trợ CRUD sản phẩm, phân rã kích thước (lensWidth, bridgeWidth, templeLength) và màu sắc theo từng biến thể sản phẩm cụ thể.
- **Thanh toán trực quyến 100% qua VNPay:** Không hỗ trợ phương thức trả tiền mặt khi nhận hàng (COD).
- **Quản lý trạng thái đơn chặt chẽ:** Hỗ trợ vòng đời đơn qua 6 trạng thái: `PENDING` → `AWAITING_VERIFICATION` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `REFUNDED`.
- **Tự động hóa luồng thanh toán:**
  - Khách hàng tự hủy đơn hàng hoặc tiếp tục thanh toán đơn nếu lỡ đóng tab VNPay khi đơn ở trạng thái `PENDING`.
  - Tác vụ nền (Background Worker) tự động quét dọn và hủy đơn hàng `PENDING` quá hạn 15 phút, giải phóng tồn kho ảo.
- **Bảng điều khiển (Dashboard):** Hiển thị doanh thu, tỷ lệ tăng trưởng tháng, số lượng đơn phát sinh và cảnh báo sản phẩm sắp hết hàng.

**Không bao gồm:**

- Các hình thức thanh toán trực tuyến khác ngoài VNPay Sandbox.
- Quy trình tự động hoàn tiền trực tiếp từ ví VNPay (xử lý hoàn tiền thủ công bên ngoài hệ thống nếu đơn ở trạng thái `REFUNDED`).
- Quy trình phân phối vận chuyển nội bộ chi tiết (vận chuyển qua đối tác ngoài).
- Tính năng trò chuyện trực tuyến thực tế (Realtime chat).

---

### 4. Các actor chính & Chức năng

| Actor | Chức năng chính |
| :--- | :--- |
| **Customer** | Đăng ký/Đăng nhập (bằng tài khoản thường hoặc Google), xem/lọc sản phẩm, lưu giỏ hàng ở Client, đặt đơn hàng (gọng trơn hoặc kèm toa thuốc), thanh toán qua VNPay, quản lý lịch sử mua hàng, tiếp tục thanh toán đơn chưa hoàn tất hoặc hủy đơn hàng `PENDING`. |
| **Sale** | Xem danh sách hóa đơn đơn hàng, xem chi chế tiết đơn hàng, xử lý trạng thái đơn hàng. |
| **Manager** | Thiết lập danh mục sản phẩm, quản lý phiên bản biến thể gọng kính (màu sắc, kích thước, giá variant), cập nhật tình trạng tồn kho, quản lý danh sách đơn hàng. |
| **Admin** | Xem Dashboard tổng quan (doanh thu, đơn hàng, tăng trưởng), quản lý danh sách và cấp hoặc thay đổi vai trò (Role) người dùng, thực hiện khóa / mở khóa tài khoản thành viên. |

---

### 5. Luồng nghiệp vụ chính

```
1. Customer chọn sản phẩm → thêm giỏ hàng (Zustand client) → tạo đơn hàng (Multipart Form-Data)
2. Đơn hàng khởi tạo trạng thái PENDING → Customer chuyển hướng thanh toán VNPay
3. Thanh toán thành công (vnpay-callback) → chuyển trạng thái đơn hàng sang CONFIRMED
4. Nhân viên bán hàng xử lý đơn → Gỡ vận chuyển → Đánh dấu đã nhận hàng → COMPLETED
5. Nếu đơn hàng PENDING quá hạn 15 phút hoặc bị khách chủ động bấm hủy → CANCELLED (hoàn lại tồn kho về CSDL)
```

---

### 6. Công nghệ triển khai thực tế

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Backend** | Node.js + Express.js 4.x | Cấu hình ES Modules, Joi validation. |
| **Database** | MongoDB / Mongoose | 4 collections hoạt động chính: `users`, `products`, `orders`, `order_items`. (Collection `carts` không sử dụng). |
| **Frontend** | React 18 + Vite | Ngôn ngữ JavaScript phẳng. Lựa chọn CSS Tailwind. |
| **Auth** | JWT / bcrypt, Google Login | Sử dụng token lưu trữ tại client để xác thực đính kèm. |
| **State Client** | Zustand + persist | Quản lý giỏ hàng `vision-cart-storage` tại localStorage của khách hàng. |
| **Thanh toán** | VNPay Sandbox | Tích hợp sinh URL thanh toán tự động và callback IPN cập nhật kết quả. |

---

### 7. Rủi ro và Giải pháp đồng bộ

- **Giữ kho ảo khi đóng tab thanh toán:**
  - *Giải pháp:* Tác vụ dọn dẹp chạy nền định kỳ mỗi 5 phút quét và hủy tự động các đơn hàng `PENDING` quá hạn 15 phút, giải phóng số lượng tồn kho sản phẩm về trạng thái khả dụng.
- **Bảo mật tuyến đường Checkout:**
  - *Giải pháp:* Sử dụng `PrivateRoute` ở React Router chặn khách vãng lai và chặn truy cập trang thanh toán khi giỏ hàng trống.
- **Không đồng nhất giá sản phẩm:**
  - *Giải pháp:* Backend thực hiện đối chiếu giá trực tiếp từ CSDL theo `productVariantId` khi tính toán đơn hàng thay vì tin tưởng giá trị gửi từ Client.
