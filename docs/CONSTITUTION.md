# CONSTITUTION.md — Project Law

**Ratified:** 2026-06-18  
**Team:** Optics Management Team  
**Version:** 2.0.0

---

## ARTICLE 1 — TECH STACK (immutable)

| Layer       | Technology                                                      |
| ----------- | --------------------------------------------------------------- |
| Runtime     | Node.js 20 LTS                                                  |
| Backend     | Express.js 4.x                                                  |
| Database    | MongoDB — Mongoose ODM                                          |
| Frontend    | React 18 + Vite (JavaScript, **not TypeScript**)                |
| Styling     | Tailwind CSS 3.x                                                |
| Package mgr | npm (project-wide)                                              |
| Auth        | JWT + bcrypt / Google Login                                     |
| Payment     | VNPay (sandbox)                                                 |
| State Client| Zustand + persist (LocalStorage)                                |

---

## ARTICLE 2 — CODING STANDARDS

- **JavaScript:** ES6+ với `"type": "module"`; dùng `const`/`let`, tránh `var`.
- **Max function length:** 50 lines (refactor if longer).
- **Max file length:** 350 lines (split into modules/components if possible).
- **Naming:** `camelCase` cho variables/functions, `PascalCase` cho classes/components, `UPPER_SNAKE` cho constants.
- **File structure:**
  - Backend: `src/backend/controllers/`, `src/backend/services/`, `src/backend/models/`, `src/backend/routes/`, `src/backend/middlewares/`
  - Frontend: `src/frontend/src/components/`, `src/frontend/src/feature/`, `src/frontend/src/pages/`, `src/frontend/src/contexts/`

---

## ARTICLE 3 — SECURITY POLICIES (non-negotiable)

- **Authentication:** JWT (access token) + bcrypt.
- **Authorization:** Role-based (CUSTOMER, SALE, MANAGER, ADMIN). Check role on API routes level.
- **Secrets:** Environment variables ONLY (`.env`). Never commit credentials to Git.
- **Database:** Use Mongoose query builders — **zero tolerance** for raw string queries with user input.
- **VNPay callback:** **MUST** verify `vnp_SecureHash` checksum before updating payment status.
- **Background Cleanup Job:** Automatically cancels expired `PENDING` orders after 15 minutes and restores stock to MongoDB.

---

## ARTICLE 4 — DATABASE SCHEMA (MongoDB)

**5 active collections:**

| Collection    | Mô tả |
| ------------- | ----- |
| `users`       | Tài khoản người dùng (username, password hash, role, email, phone, deleted_at, is_email_verified) |
| `products`    | Chi tiết sản phẩm kính mắt gọng chính (name, brand, price, discountPrice, imageUrl, stock_quantity) |
| `product_variants` | Biến thể sản phẩm (colorName, sizeLabel, bridgeWidthMm, lensWidthMm, templeLengthMm, quantity, price) |
| `orders`      | Quản lý hóa đơn mua hàng (user_id, status, total_amount, shipping/deliveryAddress, recipientName, paymentInfo) |
| `order_items` | Chi tiết sản phẩm trong đơn (order_id, product_variant_id, quantity, unitPrice) |

> **Payment được nhúng trực tiếp trong `orders`** – không có collection `payments` riêng.  
> **Không sử dụng** collection `carts` trong database. Giỏ hàng lưu trữ hoàn toàn ở LocalStorage qua Zustand.

**Order status lifecycle (6 statuses):**
`PENDING` → `AWAITING_VERIFICATION` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `REFUNDED`.

---

## ARTICLE 5 — API CONVENTIONS

- **Base URL:** `/api` (không có `/v1` prefix).
  - Routes Orders và Payment ngoài ra còn được cấu hình tại `/orders` và `/payment` để tương thích tốt với luồng thanh toán ngoài.
- **Response format:**
  - Định dạng bọc tiêu chuẩn: `{ code: 0, message: "...", result: { ... } }`.
  - Một số API Product GET chi tiết và Auth lấy thông tin thì có thể trả trực tiếp đối tượng về CSDL.
- **Error format:**
  - Chuẩn mã trạng thái HTTP (400, 401, 403, 404, 500) kèm mã lỗi cụ thể ở JSON:
    ```json
    {
      "error_code": "VALIDATION_ERROR",
      "message": "Chi tiết lỗi..."
    }
    ```

---

## ARTICLE 6 — OUT-OF-SCOPE (explicitly excluded)

Các tính năng sau **KHÔNG** nằm trong phạm vi dự án thực tế:
- Tự động hoàn tiền tự động qua API VNPay (chỉ hỗ trợ chuyển trạng thái `REFUNDED` và xử lý thủ công bên ngoài).
- Tích hợp thêm các cổng thanh toán trực tuyến khác ngoài VNPay Sandbox.
- Luồng giao hàng chi tiết của Shipper và quy trình sản xuất cơ khí kính nâng cao.
