# AGENTS.md — Project Context for AI Agents

# Project: Optic

> **Đọc file này trước khi bắt đầu bất kỳ task nào.** File này mô tả thực trạng hệ thống và quy ước chung cho mọi AI Agent. Memory/kinh nghiệm riêng của Claude Code nằm ở `docs/CLAUDE.md`.

---

## 1. PROJECT OVERVIEW

| Mục    | Giá trị                                                                  |
| :----- | :----------------------------------------------------------------------- |
| Name   | Optic — Hệ thống quản lý & bán hàng kính mắt                             |
| Type   | Web App (MERN monorepo: REST API + SPA)                                  |
| Domain | E-commerce — kính mắt (gọng kính + biến thể, tròng kính, đơn kính thuốc) |
| Stage  | Development (VNPay sandbox, triển khai Docker Compose)                   |

Nghiệp vụ chính: bán gọng kính (Product + ProductVariant), tròng kính (Lens), đơn hàng kèm đơn thuốc quang học (prescription), thanh toán VNPay, quản trị theo vai trò (`CUSTOMER | MANAGER | ADMIN`).

---

## 2. TECH STACK (STRICT — do not deviate)

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Runtime      | Node.js 20 LTS                                          |
| Backend      | Express.js 5.x (`^5.2.1`), **ESM** (`"type": "module"`) |
| Database     | MongoDB / Mongoose 9.x (`^9.7.3`)                       |
| Frontend     | React 18 + Vite 5 (**JavaScript**, không TypeScript)    |
| Styling      | Tailwind CSS 3.4 (`^3.4.17`)                            |
| Auth         | JWT + bcryptjs / Google OAuth2 (`google-auth-library`)  |
| Payment      | VNPay (sandbox) — **duy nhất**, không COD               |
| State Client | Zustand + persist (LocalStorage)                        |

Không thêm thư viện mới (ORM khác, Redux, TypeScript, session-based auth…) nếu chưa được duyệt.

---

## 3. ARCHITECTURE PRINCIPLES

- **Phân tầng backend bắt buộc:** `routes/ → controllers/ → services/ + models/`.
  Controllers chỉ xử lý request/response; business logic nằm ở services; models không chứa logic nghiệp vụ.
- **API style:** REST. Mọi module mount qua `/api` router (`routes/index.js`).
  **⚠️ Legacy aliases vẫn đang live:** `app.js` còn mount `/orders`, `/products`, `/users`, `/payment`, `/feedback` (không prefix `/api`) cho tương thích ngược & test coverage — **không được xóa** các mount này.
- **Error handling:** centralized error middleware (`middlewares/errorMiddleware.js`).
  Response lỗi thống nhất: `{ error_code, message }` với message tiếng Việt.
- **Nguồn giá duy nhất:** `services/PricingService.js` (`priceOrderItem`) — không bao giờ tin giá/tồn kho từ client.
- **App factory tách khỏi entry point:** `app.js` = `createApp()` (import được cho Supertest, không mở cổng/không chạm DB); `server.js` = connect DB + listen + khởi động background job.
- **Giỏ hàng 100% client-side:** Zustand + LocalStorage (`vision-cart-storage`). Không có API `/cart`.
- Không dùng `console.log` bừa bãi trong code production; không raw query vòng qua Mongoose.

---

## 4. FILE NAMING & STRUCTURE

```
Components (FE):  PascalCase   (UserCard.jsx, CheckoutStepper.jsx)
Hooks (FE):       camelCase    (useAdminUsers.js — prefix "use")
Controllers:      PascalCase   (OrderController.js)
Services:         PascalCase   (PricingService.js)
Routes:           dot-notation (order.routes.js)
API paths:        kebab-case   (/api/users/:id/reset-password)
DB fields:        snake_case   (deleted_at, is_email_verified)
DB collections:   snake_case số nhiều (product_variants, order_items)
```

```
src/
├── backend/
│   ├── controllers/   # Auth, User, Product, ProductVariant, Order, Payment,
│   │                  # Address, Dashboard, Lens, Feedback, Refund
│   ├── models/        # User, Product, ProductVariant, Order, OrderItem, Lens,
│   │                  # Address, Feedback, Refund, Verification
│   ├── routes/        # index.js + <module>.routes.js
│   ├── middlewares/   # authMiddleware.js, errorMiddleware.js
│   ├── services/      # AuthService, MailService, PricingService
│   ├── jobs/          # orderCleanupJob.js (dọn đơn quá hạn 15')
│   ├── config/        # db.js
│   ├── tests/         # unit/ + integration/ + system/ + helpers/factories.js
│   ├── app.js         # createApp() — Express app factory
│   └── server.js      # Entry point + background job
└── frontend/src/
    ├── components/layout/   # MainLayout, Header, Footer, PrivateRoute
    ├── contexts/            # AuthContext.jsx
    ├── feature/{auth,checkout,product,profile,admin,manager}/
    │                        # mỗi feature: components/ hooks/ api/ store/
    ├── lib/                 # httpClient.js (axios instance — dùng cho code mới)
    └── pages/               # HomePage, ProductsPage, CheckoutPage, ...
```

---

## 5. FORBIDDEN PATTERNS

- **NEVER** commit secrets — `.env` đã trong `.gitignore`; không hardcode `JWT_SECRET`, `VNP_HASH_SECRET`, `SMTP_PASS`.
- **NEVER** tin giá/tồn kho từ client — luôn tính lại qua `PricingService`.
- **NEVER** tạo endpoint hoặc gọi API `/cart` — giỏ hàng là client-only.
- **NEVER** query tồn kho từ `Product` — stock nằm ở `ProductVariant`.
- **NEVER** bật COD — chỉ VNPay Sandbox.
- **NEVER** dùng `require` trong backend — ESM only (`import`).
- **NEVER** bật parallel cho test (`fileParallelism: false` — dùng chung một instance mongodb-memory-server).
- **NEVER** bỏ qua validate input: ObjectId sai định dạng → `400 VALIDATION_ERROR` (không để CastError thành 500); thông số quang học sai → `400`, **không âm thầm đưa về 0**.
- **NEVER** cho ADMIN khóa/xóa/reset-password tài khoản ADMIN khác, hoặc self-action (tự đổi role/tự khóa mình).
- **NEVER** xóa file trong `uploads/` mà không có xác nhận của user.
- **NEVER** xóa các legacy route mounts trong `app.js` (`/orders`, `/products`, `/users`, `/payment`, `/feedback`).

---

## 6. DEFINITION OF DONE (per task)

- [ ] Unit/integration test viết và pass (`npm test` trong `src/backend`)
- [ ] Coverage giữ ngưỡng: lines 90 / branches 85 / functions 90 / statements 90
- [ ] Error case trả đúng `{ error_code, message }` + HTTP status hợp lệ
- [ ] Validate input đầy đủ cả FE lẫn BE (nếu task chạm cả hai)
- [ ] Endpoint mới cập nhật vào bảng API bên dưới + `docs/API_DOC` (nếu có)
- [ ] Comment code bằng tiếng Việt, giữ phong cách file hiện có
- [ ] Không còn TODO comment bỏ sót trong code

---

## 7. GIT CONVENTIONS

```
Branch:  feat/<feature-name> | fix/<bug-name> | spec/<feature-name>
Commit:  <type>: <scope> - <description>
Types:   feat | fix | test | chore | docs | spec
Example: feat(auth): add JWT refresh token endpoint
         test: add unit + integration test suites (190 tests)
```

- Main branch cho PR: `main`. Nhánh làm việc hiện tại: `quypd`.
- Commit message ngắn gọn, mô tả được thay đổi (tránh commit kiểu `more`).

---

## 8. CURRENT SPRINT CONTEXT

- **Sprint focus:** hoàn thiện spec-driven development cho các feature chính và luồng Order/Payment.
- **Active specs** (`.sdd/specs/`): `feature-admin-users`, `feature-cart`, `feature-checkout` (đang chỉnh sửa); đã có spec cho address, admin-dashboard, admin-refunds, auth, feedback, lens, orders, payment, products.
- Validation ảnh sản phẩm (multer: PNG/JPG/JPEG/WEBP, ≤10MB/file, 10 files/request sản phẩm, 5 files/request feedback) — đã triển khai.

---

## PHỤ LỤC A — API ENDPOINTS THỰC TẾ (đã triển khai)

> **Base URL:** mọi module mount qua `/api` (xem `routes/index.js`).
> **Legacy aliases:** `app.js` còn mount thêm `/orders`, `/products`, `/users`, `/payment`, `/feedback` (không prefix) cho tương thích ngược — các bảng Orders/Payment dưới đây ghi theo đường dẫn legacy đang được FE/test sử dụng; bản `/api/...` tương đương cũng hoạt động.

### Auth

| Method | Path                            | Quyền  | Mô tả                    |
| :----- | :------------------------------ | :----- | :----------------------- |
| POST   | `/api/auth/register`            | Public | Đăng ký tài khoản        |
| POST   | `/api/auth/login`               | Public | Đăng nhập                |
| POST   | `/api/auth/google`              | Public | Google OAuth2 Login      |
| GET    | `/api/auth/verify-email`        | Public | Xác minh email qua token |
| POST   | `/api/auth/resend-verify-email` | Public | Gửi lại email xác minh   |

### Users (Admin Management)

| Method | Path                            | Quyền         | Mô tả                                   |
| :----- | :------------------------------ | :------------ | :-------------------------------------- |
| GET    | `/api/users/me`                 | Authenticated | Lấy thông tin người dùng đang đăng nhập |
| PUT    | `/api/users/me`                 | Authenticated | Cập nhật thông tin cá nhân              |
| PUT    | `/api/users/me/change-password` | Authenticated | Đổi mật khẩu                            |
| GET    | `/api/users`                    | ADMIN         | Danh sách tài khoản (phân trang, lọc)   |
| GET    | `/api/users/:id`                | ADMIN         | Chi tiết một tài khoản                  |
| POST   | `/api/users`                    | ADMIN         | Cấp phát tài khoản mới                  |
| PUT    | `/api/users/:id/role`           | ADMIN         | Thay đổi vai trò (chặn self-action)     |
| PUT    | `/api/users/:id/status`         | ADMIN         | Khóa / Mở khóa (chặn target ADMIN)      |
| DELETE | `/api/users/:id`                | ADMIN         | Xóa vĩnh viễn (chặn target ADMIN)       |
| PUT    | `/api/users/:id/reset-password` | ADMIN         | Cấp lại mật khẩu (chặn target ADMIN)    |

### Products & Variants

| Method | Path                                             | Quyền             | Mô tả                                     |
| :----- | :----------------------------------------------- | :---------------- | :---------------------------------------- |
| GET    | `/api/products`                                  | Public (opt auth) | Danh sách sản phẩm (lọc, phân trang)      |
| GET    | `/api/products/:id`                              | Public (opt auth) | Chi tiết sản phẩm (trả về trực tiếp)      |
| POST   | `/api/products`                                  | MANAGER/ADMIN     | Thêm sản phẩm mới (multipart/form-data)   |
| PUT    | `/api/products/:id`                              | MANAGER/ADMIN     | Cập nhật sản phẩm                         |
| DELETE | `/api/products/:id`                              | MANAGER/ADMIN     | Xóa sản phẩm (cascade xóa variants + ảnh) |
| GET    | `/api/products/:productId/variants`              | Public            | Danh sách biến thể                        |
| POST   | `/api/products/:productId/variants`              | MANAGER/ADMIN     | Thêm biến thể mới                         |
| POST   | `/api/products/:productId/variants/import-excel` | MANAGER/ADMIN     | Import biến thể từ file Excel             |
| PUT    | `/api/products/:productId/variants/:variantId`   | MANAGER/ADMIN     | Cập nhật biến thể                         |
| DELETE | `/api/products/:productId/variants/:variantId`   | MANAGER/ADMIN     | Xóa biến thể                              |

### Tròng kính (Lenses)

| Method | Path              | Quyền         | Mô tả                |
| :----- | :---------------- | :------------ | :------------------- |
| GET    | `/api/lenses`     | Public        | Danh sách tròng kính |
| GET    | `/api/lenses/:id` | Public        | Chi tiết tròng kính  |
| POST   | `/api/lenses`     | MANAGER/ADMIN | Thêm tròng kính mới  |
| PUT    | `/api/lenses/:id` | MANAGER/ADMIN | Cập nhật tròng kính  |
| DELETE | `/api/lenses/:id` | MANAGER/ADMIN | Xóa tròng kính       |

### Sổ địa chỉ (Address Book)

| Method | Path                         | Quyền         | Mô tả                                                    |
| :----- | :--------------------------- | :------------ | :------------------------------------------------------- |
| GET    | `/api/addresses`             | Authenticated | Lấy danh sách địa chỉ đã lưu của user (mặc định lên đầu) |
| POST   | `/api/addresses`             | Authenticated | Lưu địa chỉ giao hàng mới                                |
| PUT    | `/api/addresses/:id`         | Authenticated | Cập nhật địa chỉ đã lưu                                  |
| PUT    | `/api/addresses/:id/default` | Authenticated | Đặt địa chỉ làm mặc định                                 |
| DELETE | `/api/addresses/:id`         | Authenticated | Xóa địa chỉ khỏi danh bạ                                 |

### Đánh giá sản phẩm (Feedbacks)

| Method | Path                                | Quyền         | Mô tả                                  |
| :----- | :---------------------------------- | :------------ | :------------------------------------- |
| GET    | `/api/feedbacks/product/:productId` | Public        | Lấy đánh giá của sản phẩm              |
| GET    | `/api/feedbacks/me`                 | Authenticated | Lấy đánh giá của tôi                   |
| GET    | `/api/feedbacks/order/:orderId`     | Authenticated | Lấy đánh giá theo đơn hàng             |
| GET    | `/api/feedbacks/:feedbackId`        | Authenticated | Chi tiết đánh giá                      |
| POST   | `/api/feedbacks`                    | Authenticated | Tạo đánh giá (multipart, tối đa 5 ảnh) |
| PUT    | `/api/feedbacks/:feedbackId`        | Authenticated | Cập nhật đánh giá                      |
| DELETE | `/api/feedbacks/:feedbackId`        | Authenticated | Xóa đánh giá                           |

### Orders (đường dẫn legacy — có bản `/api/orders/...` tương đương)

| Method | Path                                     | Quyền                 | Mô tả                                                 |
| :----- | :--------------------------------------- | :-------------------- | :---------------------------------------------------- |
| POST   | `/orders/create`                         | Authenticated         | Tạo đơn hàng mới (multipart/form-data)                |
| GET    | `/orders/me`                             | Authenticated         | Lịch sử đơn hàng của tôi                              |
| PUT    | `/orders/:id/cancel`                     | Authenticated         | Hủy đơn (PENDING/AWAITING_VERIFICATION/CONFIRMED)     |
| GET    | `/orders/cancelled/paid`                 | MANAGER/ADMIN         | Danh sách đơn CANCELLED đã thanh toán (chờ hoàn tiền) |
| PUT    | `/orders/:id/reject-cancel`              | MANAGER/ADMIN         | Từ chối hủy đơn                                       |
| GET    | `/orders`                                | MANAGER/ADMIN         | Toàn bộ đơn hàng trong hệ thống                       |
| GET    | `/orders/:id`                            | Chủ đơn/MANAGER/ADMIN | Chi tiết đơn hàng                                     |
| PUT    | `/orders/:id/status`                     | MANAGER/ADMIN         | Cập nhật trạng thái đơn                               |
| PUT    | `/orders/:id/items/:itemId/prescription` | MANAGER/ADMIN         | Sửa đơn thuốc (khi AWAITING_VERIFICATION)             |
| DELETE | `/orders/:id`                            | ADMIN                 | Xóa đơn hàng khỏi CSDL                                |

### Payment (đường dẫn legacy — có bản `/api/payment/...` tương đương)

| Method | Path                          | Quyền         | Mô tả                                           |
| :----- | :---------------------------- | :------------ | :---------------------------------------------- |
| POST   | `/payment/orders/requirement` | Authenticated | Tính toán tiền thanh toán trước khi checkout    |
| POST   | `/payment/checkout`           | Authenticated | Sinh liên kết thanh toán VNPay Sandbox          |
| GET    | `/payment/vnpay-callback`     | Public        | Callback từ VNPay sau giao dịch (redirect user) |
| GET    | `/payment/vnpay-ipn`          | Public        | IPN server-to-server từ VNPay                   |
| POST   | `/payment/mock-checkout`      | Authenticated | Mock thanh toán (chỉ local/test)                |

### Dashboard

| Method | Path                     | Quyền         | Mô tả                       |
| :----- | :----------------------- | :------------ | :-------------------------- |
| GET    | `/api/dashboard/revenue` | MANAGER/ADMIN | Thống kê doanh thu tổng hợp |

### Hoàn tiền (Refund)

| Method | Path                                         | Quyền         | Mô tả                               |
| :----- | :------------------------------------------- | :------------ | :---------------------------------- |
| PATCH  | `/api/refund/variant/:variantId/in-activate` | MANAGER/ADMIN | Vô hiệu hóa biến thể                |
| GET    | `/api/refund/affected-orders/:variantId`     | MANAGER/ADMIN | Danh sách đơn bị ảnh hưởng          |
| POST   | `/api/refund/create-batch`                   | MANAGER/ADMIN | Tạo batch hủy đơn + bản ghi Refund  |
| GET    | `/api/refund/ready`                          | MANAGER/ADMIN | Danh sách Refund PENDING sẵn sàng   |
| POST   | `/api/refund/:refundId/refund-checkout`      | MANAGER/ADMIN | Xác nhận đã hoàn tiền → COMPLETED   |
| PUT    | `/api/refund/reject-cancel/:orderId`         | MANAGER/ADMIN | Từ chối hủy đơn (qua refund module) |

---

## PHỤ LỤC B — DATABASE COLLECTIONS THỰC TẾ

| Collection         | Trạng thái        | Ghi chú                                                                                                           |
| :----------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------- |
| `users`            | ✅ Đang dùng      | username, email, role, is_email_verified, deleted_at (soft-delete), ...                                           |
| `products`         | ✅ Đang dùng      | Thông tin sản phẩm kính. Category: `FRAME` / `SUNGLASSES` / `LENS`                                                |
| `product_variants` | ✅ Đang dùng      | SKU, color, size, price, discountPrice, quantity, orderItemType, status                                           |
| `orders`           | ✅ Đang dùng      | 6 trạng thái. Background cleanup 15 phút. Nhúng `bank_info` (thanh toán nhúng, không có collection Payment riêng) |
| `order_items`      | ✅ Đang dùng      | Chi tiết item trong đơn. Chứa dữ liệu prescription (đơn thuốc) nếu có                                             |
| `lenses`           | ✅ Đang dùng      | Catalog tròng kính: tên, chất liệu, loại, giá                                                                     |
| `addresses`        | ✅ Đang dùng      | Sổ địa chỉ giao hàng: recipientName, phoneNumber, deliveryAddress, isDefault                                      |
| `feedbacks`        | ✅ Đang dùng      | Đánh giá sản phẩm: rating, comment, images (tối đa 5)                                                             |
| `refunds`          | ✅ Đang dùng      | Bản ghi hoàn tiền: orderId, amount, status (PENDING/COMPLETED)                                                    |
| `verifications`    | ✅ Đang dùng      | Token xác minh email                                                                                              |
| `carts`            | ⚠️ **KHÔNG dùng** | Tồn tại model file nhưng **không có** Routes/Controllers. Giữ để tương thích lịch sử                              |

> **Về giỏ hàng:** quản lý 100% phía client qua Zustand + LocalStorage (`vision-cart-storage`). Không có API `/cart` nào.
> **Về role `SALE` và `SHIPPER`:** ĐÃ LOẠI BỎ (out of scope) — không còn trong enum của `models/User.js`, API cấp phát/đổi vai trò không chấp nhận. Không thêm lại nếu chưa được duyệt. Role hợp lệ: `CUSTOMER | MANAGER | ADMIN`.

---

## PHỤ LỤC C — GAP SPEC vs CODE (đã đồng bộ)

| #   | Đặc tả gốc nói                    | Thực tế code                                           | Cơ chế đồng bộ                                     |
| :-- | :-------------------------------- | :----------------------------------------------------- | :------------------------------------------------- |
| 1   | Base URL: `/api/v1`               | Base URL: `/api` (không `/v1`) + legacy aliases        | Đồng bộ theo Code thực tế                          |
| 2   | Giỏ hàng: `GET/POST/DELETE /cart` | Không có API `/cart`                                   | Quản lý client Zustand hoàn toàn                   |
| 3   | Tạo đơn: `POST /orders` dùng JSON | `POST /orders/create` dùng `multipart/form-data`       | Đồng bộ theo API thực tế                           |
| 4   | Order status: 4 trạng thái        | 6 trạng thái: thêm `AWAITING_VERIFICATION`, `REFUNDED` | Sử dụng 6 trạng thái chuẩn                         |
| 5   | Thanh toán: COD + VNPay           | Chỉ chấp nhận VNPay (đã gỡ bỏ COD)                     | VNPay là duy nhất                                  |
| 6   | Không thể hủy đơn hàng PENDING    | Có nút hủy PENDING trên giao diện & Background cleanup | Cho phép chủ động hủy hoặc tự động dọn dẹp sau 15' |

---

## PHỤ LỤC D — QUY TẮC NGHIỆP VỤ CHI TIẾT

1. **Luôn đối chiếu với code thực tế** — không tin mù quáng tài liệu thiết kế gốc nếu mâu thuẫn.
2. **Route Guard (FE):** `/checkout`, `/profile` bắt buộc đăng nhập (`PrivateRoute`); redirect về `/products` khi giỏ hàng trống.
3. **Dọn hàng tồn:** đơn `PENDING` bị hủy hoặc hết hạn 15 phút phải **trả lại tồn kho** cho `ProductVariant` (job `orderCleanupJob`).
4. **Validate đơn kính thuốc:**
   - FE: format về bội số `0.25` (SPH/CYL/ADD) hoặc `0.5` (PD) khi `onBlur`. Miền giá trị: SPH `[-20..20]`, CYL `[-6..6]`, AXIS `[1..180]` (bắt buộc nếu CYL ≠ 0), ADD `[0.75..4]`, PD `[20..40]`. Chặn thêm giỏ hàng + toast lỗi cụ thể.
   - BE: gọi `validatePrescriptionFields` khi tạo/sửa đơn → `400 VALIDATION_ERROR` nếu sai (không âm thầm đưa về 0).
5. **Validate giao hàng & địa chỉ:** họ tên ≤ 100 ký tự; SĐT Việt Nam `^(\+84|0)\d{8,10}$` (sau chuẩn hóa); địa chỉ 3–300 ký tự. Kiểm tra cả FE (Checkout stepper, form địa chỉ) và BE (`OrderController`, `AddressController`).
6. **Bảo vệ ADMIN:** không cho Admin khóa/xóa/reset-password ADMIN khác; chặn self-action.
7. **Upload ảnh:** multer, chỉ PNG/JPG/JPEG/WEBP, ≤ 10MB/file; 10 files/request (sản phẩm/biến thể), 5 files/request (đánh giá).
