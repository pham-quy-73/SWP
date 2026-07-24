# AGENTS.md — Hướng dẫn Coding Agent cho Optics Management Project

> **Đọc file này trước khi bắt đầu bất kỳ task nào.** File này mô tả thực trạng hệ thống và các quy ước cụ thể cho AI Agent.

---

## 1. TECH STACK THỰC TẾ

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Runtime      | Node.js 20 LTS                                     |
| Backend      | Express.js 4.x                                     |
| Database     | MongoDB / Mongoose ODM                             |
| Frontend     | React 18 + Vite (**JavaScript**, không TypeScript) |
| Styling      | Tailwind CSS                                       |
| Auth         | JWT + bcrypt / Google Login                        |
| Payment      | VNPay (sandbox)                                    |
| State Client | Zustand + persist (LocalStorage)                   |
| Animation    | framer-motion                                      |
| Notification | sonner (toast)                                     |

---

## 2. CẤU TRÚC THƯ MỤC THỰC TẾ

```
src/
├── backend/
│   ├── controllers/       # ProductController.js, OrderController.js, PaymentController.js
│   ├── models/            # User.js, Product.js, Order.js, OrderItem.js, ProductVariant.js
│   ├── routes/            # index.js, auth.routes.js, product.routes.js, order.routes.js, payment.routes.js
│   ├── middlewares/       # errorMiddleware.js
│   ├── services/          # AuthService.js, MailService.js
│   ├── config/            # db.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/layout/   # MainLayout, Header, Footer, PrivateRoute
        ├── contexts/            # AuthContext.jsx
        ├── feature/
        │   ├── auth/            # LoginForm, RegisterForm
        │   ├── checkout/        # CheckoutStepper, ShippingForm, PaymentForm, ReviewOrder, OrderSummary
        │   ├── product/         # CartDrawer, CartItemRow, ProductForm, ProductGallery, ProductInfo
        │   └── profile/         # ProfilePage, MyOrder, ProfileLayout
        └── pages/               # HomePage, ProductsPage, ProductDetailPage, CheckoutPage, ...
```

---

## 3. API ENDPOINTS THỰC TẾ (đã triển khai)

> ⚠️ **Base URL thực tế:** 
> - Route Auth, Users, Products, Dashboard: `/api` (KHÔNG có `/v1` prefix).
> - Route Orders: `/orders` (hoặc `/api/orders`).
> - Route Payment: `/payment` (hoặc `/api/payment`).

### Auth & Users

| Method | Path | Mô tả |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/google` | Google OAuth2 Login |
| GET | `/api/auth/verify-email` | Xác minh email qua token gởi về |
| GET | `/api/users/me` | Lấy thông tin người dùng đang đăng nhập |

### Products & Variants

| Method | Path | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/products` | Danh sách sản phẩm (có bộ lọc query đầy đủ) |
| GET | `/api/products/:id` | Chi tiết sản phẩm (trả về trực tiếp đối tượng) |
| GET | `/api/products/:productId/variants` | Danh sách biến thể của sản phẩm |

### Sổ địa chỉ (Address Book)

| Method | Path | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/addresses` | Lấy danh sách địa chỉ đã lưu của user (mặc định lên đầu) |
| POST | `/api/addresses` | Lưu địa chỉ giao hàng mới |
| PUT | `/api/addresses/:id` | Cập nhật địa chỉ đã lưu |
| PUT | `/api/addresses/:id/default` | Đặt địa chỉ làm mặc định |
| DELETE | `/api/addresses/:id` | Xóa địa chỉ khỏi danh bạ |

### Orders & Payment

| Method | Path | Mô tả |
| :--- | :--- | :--- |
| POST | `/orders/create` | Tạo đơn hàng mới từ giỏ hàng (dung multipart/form-data) |
| GET | `/orders/me` | Lấy lịch sử đơn hàng của tôi |
| PUT | `/orders/:id/cancel` | Hủy đơn hàng PENDING |
| POST | `/payment/orders/requirement`| Tính toán tiền thanh toán đơn trước khi checkout |
| POST | `/payment/checkout` | Lấy liên kết cổng thanh toán VNPay Sandbox |
| GET | `/payment/vnpay-callback` | Nhận phản hồi IPN công cộng từ VNPay sau giao dịch |

---

## 4. DATABASE COLLECTIONS THỰC TẾ

| Collection | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| `users` | ✅ Đang dùng | Schema đầy đủ: username, email, role, is_email_verified, ... |
| `products` | ✅ Đang dùng | Schema chính cho thông tin gọng kính. |
| `product_variants`| ✅ Đang dùng | Chi tiết các biến thể gọng kính |
| `orders` | ✅ Đang dùng | Quản lý hóa đơn. Hỗ trợ tự động hủy quá hạn 15 phút. |
| `order_items` | ✅ Đang dùng | Chi tiết sản phẩm con có trong đơn hàng |
| `carts` | ⚠️ **KHÔNG dùng**| Tồn tại trong DB nhưng hoàn toàn không có Routes/Controllers xử lý. |
| `addresses` | ✅ Đang dùng | Lưu trữ sổ địa chỉ giao hàng của người dùng (tên, sđt, địa chỉ, default). |

> **Về giỏ hàng:** Quản lý 100% phía client qua Zustand + LocalStorage (`vision-cart-storage`). Không có API `/cart` nào.

---

## 5. CÁC GAP ĐÃ ĐƯỢC GIẢI QUYẾT & BẢN ĐĂNG KÝ

| # | Đặc tả nói | Thực tế code | Cơ chế đồng bộ |
| :--- | :--- | :--- | :--- |
| 1 | Base URL: `/api/v1` | Base URL: `/api` (không `/v1`) | Đồng bộ theo Code thực tế |
| 2 | Giỏ hàng: `GET/POST/DELETE /cart` | Không có API `/cart` | Quản lý client Zustand hoàn toàn |
| 3 | Tạo đơn: `POST /orders` dùng JSON | `POST /orders/create` dùng `multipart/form-data` | Đồng bộ theo API thực tế |
| 4 | Order status: 4 trạng thái | 6 trạng thái: Có thêm `AWAITING_VERIFICATION`, `REFUNDED` | Sử dụng 6 trạng thái chuẩn |
| 5 | Thanh toán: COD + VNPay | Chỉ chấp nhận VNPay (đã gỡ bỏ COD) | VNPay là duy nhất |
| 6 | Không thể hủy đơn hàng PENDING | Có nút hủy PENDING trên giao diện & Background cleanup | Cho phép chủ động hủy hoặc tự động dọn dẹp sau 15' |

---

## 6. QUY TẮC AGENT

1. **Đọc file này đầu tiên** trước khi bắt đầu bất kỳ tác vụ nào.
2. **Luôn đối chiếu với code thực tế**, không tin tưởng mù quáng vào tài liệu thiết kế gốc nếu có mâu thuẫn.
3. **Không tạo endpoint hay gửi yêu cầu tới `/cart`** — giỏ hàng là client-only (Zustand).
4. **Dùng `/api` làm base URL** (bỏ `/v1`). Các route orders/payment dùng `/orders` và `/payment`.
5. **Tạo đơn hàng dùng dạng multipart/form-data** để cho phép truyền tải toa thuốc đính kèm.
6. **Không để nút COD hoạt động** — chỉ hỗ trợ cổng thanh toán VNPay Sandbox trực tuyến.
7. **Bảo vệ luồng bằng Route Guard**: Route `/checkout`, `/profile` bắt buộc có đăng nhập (`PrivateRoute`). Tự động redirect về `/products` khi giỏ hàng trống.
8. **Quy tắc dọn dẹp hàng tồn:** Khi viết backend cần lưu ý, các đơn hàng `PENDING` bị hủy hoặc hết hạn sau 15 phút chạy ngầm phải trả lại số lượng tồn kho cho CSDL.
9. **Quy tắc validate đơn kính thuốc**:
   - Ở Frontend: Tự động format giá trị quang học về bội số gần nhất của `0.25` (cho SPH/CYL/ADD) hoặc `0.5` (cho PD) khi `onBlur`. Validate nghiêm ngặt các miền giá trị (SPH `[-20..20]`, CYL `[-6..6]`, AXIS `[1..180]` bắt buộc nếu CYL !== 0, ADD `[0.75..4]`, PD `[20..40]`). Chặn thêm vào giỏ hàng và hiển thị lỗi cụ thể bằng toast.
   - Ở Backend: Gọi hàm `validatePrescriptionFields` kiểm tra nghiêm ngặt khi tạo/sửa đơn. Trả về HTTP `400 VALIDATION_ERROR` nếu phát hiện dữ liệu lỗi quang học (không âm thầm tự đưa về 0).
10. **Quy tắc validate thông tin giao hàng & địa chỉ**:
    - Kiểm soát chặt chẽ họ tên người nhận (≤ 100 ký tự), định dạng số điện thoại Việt Nam (`^(\+84/0)\d{8,10}$` sau khi chuẩn hóa), và địa chỉ giao hàng (3 đến 300 ký tự).
    - Áp dụng kiểm tra đầy đủ ở cả Frontend (Checkout stepper & Form địa chỉ) và Backend (tạo đơn `OrderController` & sổ địa chỉ `AddressController`).
