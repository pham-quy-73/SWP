# AGENTS.md — Hướng dẫn Coding Agent cho Optics Management Project

> **Đọc file này trước khi bắt đầu bất kỳ task nào.** File này mô tả thực trạng hệ thống và các quy ước cụ thể cho AI Agent.

---

## 1. TECH STACK THỰC TẾ

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Runtime        | Node.js 20 LTS                                     |
| Backend        | Express.js 5.x (`^5.2.1`)                          |
| Database       | MongoDB / Mongoose 9.x (`^9.7.3`)                  |
| Frontend       | React 18 + Vite 5 (**JavaScript**, không TypeScript)|
| Styling        | Tailwind CSS 3.4 (`^3.4.17`)                       |
| Auth           | JWT + bcryptjs / Google OAuth2                     |
| Payment        | VNPay (sandbox)                                    |
| State Client   | Zustand + persist (LocalStorage)                   |
| Server State   | @tanstack/react-query                              |
| Form           | react-hook-form + Zod                              |
| Animation      | framer-motion                                      |
| Notification   | sonner (toast)                                     |
| Icons          | lucide-react                                       |
| File Upload    | multer (`^2.1.1`)                                  |
| Validation (BE)| Joi (`^18.2.3`)                                    |
| Email          | Nodemailer (`^9.0.1`)                              |
| Excel Import   | xlsx (`^0.18.5`)                                   |
| Testing        | Vitest + Supertest + mongodb-memory-server         |

---

## 2. CẤU TRÚC THƯ MỤC THỰC TẾ

```
src/
├── backend/
│   ├── controllers/       # AuthController, UserController, ProductController,
│   │                      # ProductVariantController, OrderController, PaymentController,
│   │                      # AddressController, DashboardController, LensController,
│   │                      # FeedbackController, RefundController
│   ├── models/            # User, Product, ProductVariant, Order, OrderItem,
│   │                      # Lens, Address, Feedback, Refund, Verification, Cart (unused)
│   ├── routes/            # index.js, auth.routes, user.routes, product.routes,
│   │                      # order.routes, payment.routes, address.routes,
│   │                      # dashboard.routes, lens.routes, feedback.routes, refund.routes
│   ├── middlewares/       # authMiddleware.js (authenticate, optionalAuthenticate, requireRole)
│   │                      # errorMiddleware.js
│   ├── services/          # AuthService.js, MailService.js, PricingService.js
│   ├── config/            # db.js
│   ├── tests/             # integration/ (11 test files, 232+ test cases)
│   ├── app.js             # Express app factory (createApp)
│   └── server.js          # Entry point + Background Cleanup Job
└── frontend/
    └── src/
        ├── components/layout/   # MainLayout, Header, Footer, PrivateRoute
        ├── contexts/            # AuthContext.jsx
        ├── feature/
        │   ├── admin/           # UserManagePage, useAdminUsers hooks
        │   ├── auth/            # LoginForm, RegisterForm
        │   ├── checkout/        # CheckoutStepper, ShippingForm, PaymentForm,
        │   │                    # ReviewOrder, OrderSummary
        │   ├── manager/         # Quản lý sản phẩm, đơn hàng, Dashboard
        │   ├── product/         # CartDrawer, CartItemRow, ProductForm,
        │   │                    # ProductGallery, ProductInfo
        │   └── profile/         # ProfilePage, MyOrder, ProfileLayout
        └── pages/               # HomePage, ProductsPage, ProductDetailPage,
                                 # CheckoutPage, ...
```

---

## 3. API ENDPOINTS THỰC TẾ (đã triển khai)

> ⚠️ **Base URL thực tế:**
>
> - Tất cả API module đều mount qua `/api` router (xem `routes/index.js`).
> - Route Orders cũng mount song song tại `/orders` và `/api/management/orders` (legacy alias).
> - Route Payment cũng mount song song tại `/payment`.

### Auth

| Method | Path                              | Quyền  | Mô tả                           |
| :----- | :-------------------------------- | :----- | :------------------------------- |
| POST   | `/api/auth/register`              | Public | Đăng ký tài khoản                |
| POST   | `/api/auth/login`                 | Public | Đăng nhập                        |
| POST   | `/api/auth/google`                | Public | Google OAuth2 Login              |
| GET    | `/api/auth/verify-email`          | Public | Xác minh email qua token         |
| POST   | `/api/auth/resend-verify-email`   | Public | Gửi lại email xác minh           |

### Users (Admin Management)

| Method | Path                              | Quyền       | Mô tả                                   |
| :----- | :-------------------------------- | :---------- | :--------------------------------------- |
| GET    | `/api/users/me`                   | Authenticated | Lấy thông tin người dùng đang đăng nhập |
| PUT    | `/api/users/me`                   | Authenticated | Cập nhật thông tin cá nhân              |
| PUT    | `/api/users/me/change-password`   | Authenticated | Đổi mật khẩu                           |
| GET    | `/api/users`                      | ADMIN       | Danh sách tài khoản (phân trang, lọc)   |
| GET    | `/api/users/:id`                  | ADMIN       | Chi tiết một tài khoản                   |
| POST   | `/api/users`                      | ADMIN       | Cấp phát tài khoản mới                  |
| PUT    | `/api/users/:id/role`             | ADMIN       | Thay đổi vai trò (chặn self-action)     |
| PUT    | `/api/users/:id/status`           | ADMIN       | Khóa / Mở khóa (chặn target ADMIN)      |
| DELETE | `/api/users/:id`                  | ADMIN       | Xóa vĩnh viễn (chặn target ADMIN)       |
| PUT    | `/api/users/:id/reset-password`   | ADMIN       | Cấp lại mật khẩu (chặn target ADMIN)    |

### Products & Variants

| Method | Path                                                  | Quyền          | Mô tả                                          |
| :----- | :---------------------------------------------------- | :------------- | :---------------------------------------------- |
| GET    | `/api/products`                                       | Public (opt auth) | Danh sách sản phẩm (lọc, phân trang)         |
| GET    | `/api/products/:id`                                   | Public (opt auth) | Chi tiết sản phẩm (trả về trực tiếp)         |
| POST   | `/api/products`                                       | MANAGER/ADMIN  | Thêm sản phẩm mới (multipart/form-data)        |
| PUT    | `/api/products/:id`                                   | MANAGER/ADMIN  | Cập nhật sản phẩm                               |
| DELETE | `/api/products/:id`                                   | MANAGER/ADMIN  | Xóa sản phẩm (cascade xóa variants + ảnh)      |
| GET    | `/api/products/:productId/variants`                   | Public         | Danh sách biến thể                               |
| POST   | `/api/products/:productId/variants`                   | MANAGER/ADMIN  | Thêm biến thể mới                               |
| POST   | `/api/products/:productId/variants/import-excel`      | MANAGER/ADMIN  | Import biến thể từ file Excel                    |
| PUT    | `/api/products/:productId/variants/:variantId`        | MANAGER/ADMIN  | Cập nhật biến thể                                |
| DELETE | `/api/products/:productId/variants/:variantId`        | MANAGER/ADMIN  | Xóa biến thể                                    |

### Tròng kính (Lenses)

| Method | Path               | Quyền         | Mô tả                     |
| :----- | :----------------- | :------------ | :------------------------- |
| GET    | `/api/lenses`      | Public        | Danh sách tròng kính       |
| GET    | `/api/lenses/:id`  | Public        | Chi tiết tròng kính        |
| POST   | `/api/lenses`      | MANAGER/ADMIN | Thêm tròng kính mới       |
| PUT    | `/api/lenses/:id`  | MANAGER/ADMIN | Cập nhật tròng kính        |
| DELETE | `/api/lenses/:id`  | MANAGER/ADMIN | Xóa tròng kính             |

### Sổ địa chỉ (Address Book)

| Method | Path                         | Quyền         | Mô tả                                                    |
| :----- | :--------------------------- | :------------ | :-------------------------------------------------------- |
| GET    | `/api/addresses`             | Authenticated | Lấy danh sách địa chỉ đã lưu của user (mặc định lên đầu) |
| POST   | `/api/addresses`             | Authenticated | Lưu địa chỉ giao hàng mới                                |
| PUT    | `/api/addresses/:id`         | Authenticated | Cập nhật địa chỉ đã lưu                                  |
| PUT    | `/api/addresses/:id/default` | Authenticated | Đặt địa chỉ làm mặc định                                 |
| DELETE | `/api/addresses/:id`         | Authenticated | Xóa địa chỉ khỏi danh bạ                                 |

### Đánh giá sản phẩm (Feedbacks)

| Method | Path                                  | Quyền         | Mô tả                                       |
| :----- | :------------------------------------ | :------------ | :------------------------------------------- |
| GET    | `/api/feedbacks/product/:productId`   | Public        | Lấy đánh giá của sản phẩm                   |
| GET    | `/api/feedbacks/me`                   | Authenticated | Lấy đánh giá của tôi                         |
| GET    | `/api/feedbacks/order/:orderId`       | Authenticated | Lấy đánh giá theo đơn hàng                   |
| GET    | `/api/feedbacks/:feedbackId`          | Authenticated | Chi tiết đánh giá                             |
| POST   | `/api/feedbacks`                      | Authenticated | Tạo đánh giá (multipart, tối đa 5 ảnh)       |
| PUT    | `/api/feedbacks/:feedbackId`          | Authenticated | Cập nhật đánh giá                             |
| DELETE | `/api/feedbacks/:feedbackId`          | Authenticated | Xóa đánh giá                                 |

### Orders

| Method | Path                                       | Quyền              | Mô tả                                           |
| :----- | :----------------------------------------- | :------------------ | :----------------------------------------------- |
| POST   | `/orders/create`                           | Authenticated       | Tạo đơn hàng mới (multipart/form-data)           |
| GET    | `/orders/me`                               | Authenticated       | Lịch sử đơn hàng của tôi                         |
| PUT    | `/orders/:id/cancel`                       | Authenticated       | Hủy đơn (PENDING/AWAITING_VERIFICATION/CONFIRMED) |
| GET    | `/orders/cancelled/paid`                   | MANAGER/ADMIN       | Danh sách đơn CANCELLED đã thanh toán (chờ hoàn tiền) |
| PUT    | `/orders/:id/reject-cancel`                | MANAGER/ADMIN       | Từ chối hủy đơn                                   |
| GET    | `/orders`                                  | MANAGER/ADMIN       | Toàn bộ đơn hàng trong hệ thống                   |
| GET    | `/orders/:id`                              | Chủ đơn/MANAGER/ADMIN | Chi tiết đơn hàng                                |
| PUT    | `/orders/:id/status`                       | MANAGER/ADMIN       | Cập nhật trạng thái đơn                           |
| PUT    | `/orders/:id/items/:itemId/prescription`   | MANAGER/ADMIN       | Sửa đơn thuốc (khi AWAITING_VERIFICATION)         |
| DELETE | `/orders/:id`                              | ADMIN               | Xóa đơn hàng khỏi CSDL                           |

### Payment

| Method | Path                          | Quyền         | Mô tả                                          |
| :----- | :---------------------------- | :------------ | :---------------------------------------------- |
| POST   | `/payment/orders/requirement` | Authenticated | Tính toán tiền thanh toán trước khi checkout     |
| POST   | `/payment/checkout`           | Authenticated | Sinh liên kết thanh toán VNPay Sandbox           |
| GET    | `/payment/vnpay-callback`     | Public        | Callback từ VNPay sau giao dịch (redirect user)  |
| GET    | `/payment/vnpay-ipn`          | Public        | IPN server-to-server từ VNPay                    |
| POST   | `/payment/mock-checkout`      | Authenticated | Mock thanh toán (chỉ local/test)                 |

### Dashboard

| Method | Path                     | Quyền         | Mô tả                     |
| :----- | :----------------------- | :------------ | :------------------------- |
| GET    | `/api/dashboard/revenue` | MANAGER/ADMIN | Thống kê doanh thu tổng hợp |

### Hoàn tiền (Refund)

| Method | Path                                         | Quyền         | Mô tả                                 |
| :----- | :------------------------------------------- | :------------ | :------------------------------------- |
| PATCH  | `/api/refund/variant/:variantId/in-activate`  | MANAGER/ADMIN | Vô hiệu hóa biến thể                 |
| GET    | `/api/refund/affected-orders/:variantId`      | MANAGER/ADMIN | Danh sách đơn bị ảnh hưởng            |
| POST   | `/api/refund/create-batch`                    | MANAGER/ADMIN | Tạo batch hủy đơn + bản ghi Refund    |
| GET    | `/api/refund/ready`                           | MANAGER/ADMIN | Danh sách Refund PENDING sẵn sàng     |
| POST   | `/api/refund/:refundId/refund-checkout`        | MANAGER/ADMIN | Xác nhận đã hoàn tiền → COMPLETED     |
| PUT    | `/api/refund/reject-cancel/:orderId`          | MANAGER/ADMIN | Từ chối hủy đơn (qua refund module)   |

---

## 4. DATABASE COLLECTIONS THỰC TẾ

| Collection         | Trạng thái      | Ghi chú                                                                                |
| :----------------- | :-------------- | :-------------------------------------------------------------------------------------- |
| `users`            | ✅ Đang dùng    | Schema đầy đủ: username, email, role, is_email_verified, deleted_at (soft-delete), ...   |
| `products`         | ✅ Đang dùng    | Thông tin sản phẩm kính. Category: `FRAME` / `SUNGLASSES` / `LENS`                      |
| `product_variants` | ✅ Đang dùng    | Biến thể: SKU, color, size, price, discountPrice, quantity, orderItemType, status        |
| `orders`           | ✅ Đang dùng    | Quản lý đơn hàng. 6 trạng thái. Background cleanup 15 phút. Nhúng `bank_info`           |
| `order_items`      | ✅ Đang dùng    | Chi tiết item trong đơn. Chứa dữ liệu prescription (đơn thuốc) nếu có                   |
| `lenses`           | ✅ Đang dùng    | Catalog tròng kính: tên, chất liệu, loại, giá                                           |
| `addresses`        | ✅ Đang dùng    | Sổ địa chỉ giao hàng: recipientName, phoneNumber, deliveryAddress, isDefault             |
| `feedbacks`        | ✅ Đang dùng    | Đánh giá sản phẩm: rating, comment, images (tối đa 5)                                   |
| `refunds`          | ✅ Đang dùng    | Bản ghi hoàn tiền: orderId, amount, status (PENDING/COMPLETED)                           |
| `verifications`    | ✅ Đang dùng    | Token xác minh email                                                                     |
| `carts`            | ⚠️ **KHÔNG dùng** | Tồn tại model file nhưng **không có** Routes/Controllers. Giữ để tương thích lịch sử    |

> **Về giỏ hàng:** Quản lý 100% phía client qua Zustand + LocalStorage (`vision-cart-storage`). Không có API `/cart` nào.

---

## 5. CÁC GAP ĐÃ ĐƯỢC GIẢI QUYẾT & BẢN ĐĂNG KÝ

| #   | Đặc tả nói                        | Thực tế code                                              | Cơ chế đồng bộ                                     |
| :-- | :-------------------------------- | :-------------------------------------------------------- | :------------------------------------------------- |
| 1   | Base URL: `/api/v1`               | Base URL: `/api` (không `/v1`)                            | Đồng bộ theo Code thực tế                          |
| 2   | Giỏ hàng: `GET/POST/DELETE /cart` | Không có API `/cart`                                      | Quản lý client Zustand hoàn toàn                   |
| 3   | Tạo đơn: `POST /orders` dùng JSON | `POST /orders/create` dùng `multipart/form-data`          | Đồng bộ theo API thực tế                           |
| 4   | Order status: 4 trạng thái        | 6 trạng thái: Có thêm `AWAITING_VERIFICATION`, `REFUNDED` | Sử dụng 6 trạng thái chuẩn                         |
| 5   | Thanh toán: COD + VNPay           | Chỉ chấp nhận VNPay (đã gỡ bỏ COD)                        | VNPay là duy nhất                                  |
| 6   | Không thể hủy đơn hàng PENDING    | Có nút hủy PENDING trên giao diện & Background cleanup    | Cho phép chủ động hủy hoặc tự động dọn dẹp sau 15' |

---

## 6. QUY TẮC AGENT

1. **Đọc file này đầu tiên** trước khi bắt đầu bất kỳ tác vụ nào.
2. **Luôn đối chiếu với code thực tế**, không tin tưởng mù quáng vào tài liệu thiết kế gốc nếu có mâu thuẫn.
3. **Không tạo endpoint hay gửi yêu cầu tới `/cart`** — giỏ hàng là client-only (Zustand).
4. **Dùng `/api` làm base URL** (bỏ `/v1`). Các route orders/payment cũng mount tại `/orders` và `/payment`.
5. **Tạo đơn hàng dùng dạng multipart/form-data** để cho phép truyền tải toa thuốc đính kèm (ảnh).
6. **Không để nút COD hoạt động** — chỉ hỗ trợ cổng thanh toán VNPay Sandbox trực tuyến.
7. **Bảo vệ luồng bằng Route Guard**: Route `/checkout`, `/profile` bắt buộc có đăng nhập (`PrivateRoute`). Tự động redirect về `/products` khi giỏ hàng trống.
8. **Quy tắc dọn dẹp hàng tồn:** Khi viết backend cần lưu ý, các đơn hàng `PENDING` bị hủy hoặc hết hạn sau 15 phút chạy ngầm phải trả lại số lượng tồn kho cho CSDL.
9. **Quy tắc validate đơn kính thuốc**:
   - Ở Frontend: Tự động format giá trị quang học về bội số gần nhất của `0.25` (cho SPH/CYL/ADD) hoặc `0.5` (cho PD) khi `onBlur`. Validate nghiêm ngặt các miền giá trị (SPH `[-20..20]`, CYL `[-6..6]`, AXIS `[1..180]` bắt buộc nếu CYL !== 0, ADD `[0.75..4]`, PD `[20..40]`). Chặn thêm vào giỏ hàng và hiển thị lỗi cụ thể bằng toast.
   - Ở Backend: Gọi hàm `validatePrescriptionFields` kiểm tra nghiêm ngặt khi tạo/sửa đơn. Trả về HTTP `400 VALIDATION_ERROR` nếu phát hiện dữ liệu lỗi quang học (không âm thầm tự đưa về 0).
10. **Quy tắc validate thông tin giao hàng & địa chỉ**:
    - Kiểm soát chặt chẽ họ tên người nhận (≤ 100 ký tự), định dạng số điện thoại Việt Nam (`^(\+84|0)\d{8,10}$` sau khi chuẩn hóa), và địa chỉ giao hàng (3 đến 300 ký tự).
    - Áp dụng kiểm tra đầy đủ ở cả Frontend (Checkout stepper & Form địa chỉ) và Backend (tạo đơn `OrderController` & sổ địa chỉ `AddressController`).
11. **Bảo vệ tài khoản ADMIN**: Không cho phép Admin khóa/xóa/reset password của tài khoản ADMIN khác. Chặn self-action (tự đổi role/tự khóa chính mình).
12. **Upload ảnh**: Sử dụng multer, chỉ chấp nhận PNG/JPG/JPEG/WEBP, tối đa 10MB/file, 10 files/request (sản phẩm/biến thể), 5 files/request (đánh giá).
