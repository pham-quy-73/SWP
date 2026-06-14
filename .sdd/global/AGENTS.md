Dưới đây là phiên bản hoàn chỉnh của **AGENTS.md** (v1.1) đã được cập nhật theo yêu cầu của bạn:

- **Chỉ Node.js + Express** (không còn đề cập Spring Boot)
- **Thêm mục ưu tiên tài liệu**
- **Thêm coding conventions** (async/await, độ dài hàm/file, CommonJS exports)
- **Sửa template `.env`** dùng placeholder
- **Không có Git workflow** (như bạn mong muốn)
- **Giữ nguyên các phần khác** nhưng điều chỉnh nhỏ cho phù hợp

```markdown
# AGENTS.md — Project Context for AI Agents

**Version:** 1.1  
**Updated:** 2026-06-14  
**Project:** Optics Management (Shop bán kính mắt trực tuyến - bản thu nhỏ)

---

## 1. PROJECT OVERVIEW

**Name:** Optics Management  
**Type:** Web App (Full‑stack)  
**Domain:** E‑commerce (Optical retail – eyewear store)  
**Stage:** Development

**Mô tả ngắn:**  
Hệ thống quản lý bán hàng cho cửa hàng kính mắt nhỏ. Khách hàng có thể xem sản phẩm (gọng kính), thêm vào giỏ, tạo đơn hàng kèm đơn thuốc, thanh toán qua VNPay. Nhân viên bán hàng (Sale) xác minh đơn thuốc, duyệt hoặc từ chối đơn. Quản trị viên (Admin) quản lý sản phẩm, người dùng, theo dõi đơn hàng và dashboard đơn giản.

---

## 2. TECH STACK (STRICT — do not deviate)

| Layer       | Technology                                                   |
| ----------- | ------------------------------------------------------------ |
| Backend     | **Node.js 20 + Express** (cố định, không dùng Spring Boot)   |
| Frontend    | React 18 + JavaScript + Tailwind CSS 3.x                     |
| Database    | MongoDB 6.x (không dùng SQL)                                 |
| ODM         | Mongoose                                                     |
| Auth        | JWT (access token) + bcrypt                                  |
| Testing     | Jest + Supertest (backend), React Testing Library (frontend) |
| Styling     | Tailwind CSS 3.x                                             |
| HTTP Client | Axios (frontend)                                             |
| Upload      | Cloudinary hoặc lưu local (multipart)                        |
| Payment     | VNPay (sandbox) – tạo URL, callback                          |

**Lưu ý quan trọng:**

- Backend chỉ dùng Node.js + Express.
- Không TypeScript (chỉ JavaScript).
- Không SQL, chỉ MongoDB.

---

## 2b. PRIORITY KHI ĐỌC TÀI LIỆU (dành cho AI Agent)

Khi AI Agent cần đưa ra quyết định hoặc sinh code, thứ tự ưu tiên như sau:

1. **`PROJECT_CONSTITUTION.md`** – luật bất biến, không được vi phạm.
2. **`SHARED_CONTEXT.md`** – API contracts, data models, environment hiện tại.
3. **`AGENTS.md`** – hướng dẫn này (tech stack, naming, patterns).
4. **Task prompt** – yêu cầu cụ thể của người dùng (nhưng không được override Constitution).

Nếu có xung đột, cấp độ 1 (Constitution) luôn thắng.

---

## 3. ARCHITECTURE PRINCIPLES

- **Backend architecture:** MVC (Model – Controller – Service)
- **API style:** REST (JSON)
- **Error handling:** Dùng middleware tập trung (ví dụ `errorHandler`) trả về các mã HTTP chuẩn (400, 401, 403, 404, 500) cùng message rõ ràng.
- **Validation:** Validate tất cả dữ liệu đầu vào (Joi hoặc class-validator).
- **Database access:** Chỉ dùng Mongoose. Không dùng raw driver trừ khi thực sự cần.
- **Logging:** Dùng `winston`. Cấm `console.log` ở production.
- **Configuration:** Dùng biến môi trường (`.env`), không hardcode.

---

## 3b. CODING CONVENTIONS (JavaScript/Node.js)

- **Bất đồng bộ:** Luôn dùng `async/await`, cấm `.then()` hoặc callback hell.
- **Độ dài hàm:** Không quá 50 dòng (có thể exception nếu có lý do chính đáng).
- **Độ dài file:** Không quá 400 dòng.
- **Export:** Dùng `module.exports` (CommonJS) thay vì `export default` (ESM) để đồng nhất với Node.js mặc định.
- **Xử lý lỗi trong async:** Luôn có `try/catch` ở tầng service, và dùng `next(error)` ở controller.

---

## 4. FILE NAMING & STRUCTURE

| Loại                 | Quy tắc                   | Ví dụ                                      |
| -------------------- | ------------------------- | ------------------------------------------ |
| React components     | PascalCase                | `UserCard.jsx`, `OrderList.jsx`            |
| Hooks (custom)       | camelCase + `use`         | `useAuth.js`, `useCart.js`                 |
| Utilities / helpers  | camelCase                 | `formatCurrency.js`, `validate.js`         |
| API routes (Node)    | kebab-case                | `/api/user-profile`, `/api/place-order`    |
| Models (Mongoose)    | PascalCase (tên model)    | `User.js`, `Order.js`                      |
| Controllers          | PascalCase + `Controller` | `AuthController.js`                        |
| Services             | PascalCase + `Service`    | `OrderService.js`                          |
| Database collections | snake_case                | `users`, `order_items` (bên trong MongoDB) |

**Cấu trúc thư mục (Node.js + React gợi ý):**
```

backend/
├── src/
│ ├── config/ # Cấu hình DB, env, logger
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── middlewares/ # auth, errorHandler, upload
│ ├── utils/
│ └── app.js
├── tests/
└── .env

frontend/
├── src/
│ ├── components/
│ ├── pages/
│ ├── hooks/
│ ├── services/ # API calls (axios)
│ ├── contexts/ # Auth context
│ ├── utils/
│ └── App.jsx
└── tailwind.config.js

````

---

## 5. FORBIDDEN PATTERNS

- ❌ **Không bao giờ** lưu mật khẩu dạng plain text hoặc secret key trong mã nguồn / file `.env` commit lên Git. Sử dụng biến môi trường trên server.
- ❌ **Không dùng TypeScript** – dự án này chỉ sử dụng JavaScript.
- ❌ **Không bỏ qua validation** ở API endpoint (cả client lẫn server).
- ❌ **Không dùng thư viện đã deprecated** mà chưa có sự đồng ý của team.
- ❌ **Không xóa file trong thư mục `/uploads`** trực tiếp từ code – cần xác nhận người dùng và log hành động.
- ❌ **Không hardcode URL, port, hoặc thông tin thanh toán** (ví dụ `vnp_TmnCode`).

---

## 6. DEFINITION OF DONE (per task)

Một task được coi là hoàn thành khi:

- [ ] Unit tests được viết (cho các service, controller quan trọng) và chạy qua.
- [ ] Không có lỗi linting (ESLint).
- [ ] API endpoint (nếu có) được ghi tài liệu trong `SHARED_CONTEXT.md` hoặc Swagger.
- [ ] Các trường hợp lỗi được xử lý với HTTP status code phù hợp, trả về message có ý nghĩa.
- [ ] Không còn dòng `// TODO` hoặc `FIXME` trong code (nếu có thì phải tạo issue).
- [ ] Tính năng hoạt động trên môi trường development (demo được).

---

## 7. API REFERENCE (tóm tắt)

> Xem chi tiết trong `SHARED_CONTEXT.md`. Dưới đây là các nhóm chính:

| Nhóm               | Base path (đều có tiền tố `/api/v1`) | Quyền truy cập           |
|--------------------|---------------------------------------|--------------------------|
| Auth               | `/auth`                               | public (register), customer/sale/admin (me) |
| Products           | `/products`                           | GET: all roles; POST/PUT/DELETE: ADMIN |
| Cart               | `/cart`                               | CUSTOMER                 |
| Orders             | `/orders`                             | POST, my-orders: CUSTOMER; GET all: SALE/ADMIN |
| Verification       | `/verification`                       | SALE, ADMIN              |
| Payment            | `/payment` (callback: public)         | CUSTOMER, ADMIN          |
| Admin (users, dashboard, refund) | `/admin`                  | ADMIN                    |
| Upload             | `/upload`                             | authenticated (all roles) |

**Mã trạng thái đơn hàng:**
`PENDING` → `AWAITING_VERIFICATION` → `CONFIRMED` → `COMPLETED`
`CANCELLED`, `REFUNDED`

---

## 8. DATABASE SCHEMA (MongoDB collections)

8 collections chính (không có ràng buộc foreign key ở DB, nhưng có tham chiếu trong code):

- `users`
- `products`
- `carts`
- `orders`
- `order_items`
- `payments`
- `verifications`
- `refunds`

**Mẫu document (xem trong `SHARED_CONTEXT.md`)**

---

## 9. ENVIRONMENT VARIABLES (required)

Tạo file `.env` ở backend (chỉ chứa placeholder, không bao giờ commit giá trị thật):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/optics_dev
JWT_SECRET=<provided_by_environment>
VNPAY_TMN_CODE=<provided_by_environment>
VNPAY_HASH_SECRET=<provided_by_environment>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/v1/payment/vnpay-callback
CLOUDINARY_CLOUD_NAME=<provided_by_environment>
CLOUDINARY_API_KEY=<provided_by_environment>
CLOUDINARY_API_SECRET=<provided_by_environment>
````

> **Không bao giờ** đặt giá trị thật trong file mẫu. AI Agent không được tự động tạo file `.env` có secret thật.

---

## 10. TESTING REQUIREMENTS (minimum)

- **Backend:**
  - Unit test cho service tạo order (kiểm tra trừ kho, tạo order items).
  - Integration test cho API login, register, và verify order.

- **Frontend:**
  - Smoke test: các component chính render không lỗi.
  - Test luồng chính: thêm giỏ, tạo đơn (mock API).

- **Coverage goal:** ≥ 60% cho các service nghiệp vụ cốt lõi.

---

## 11. NOTES FOR AI AGENTS

- Khi gợi ý code, luôn sử dụng **JavaScript** (kèm JSDoc nếu cần rõ ràng). Không dùng TypeScript.
- Tuân thủ cấu trúc thư mục và quy tắc đặt tên ở trên.
- Không tự ý thay đổi database từ MongoDB sang SQL hoặc ngược lại.
- Nếu cần thêm tính năng ngoài scope (ví dụ combo, voucher), hãy hỏi lại người dùng trước.
- Với VNPay, luôn nhớ xử lý callback an toàn (kiểm tra checksum, không dùng tham số URL để cập nhật mà không xác thực).
- Sử dụng `bcrypt` với salt rounds = 10.

---

**End of AGENTS.md**

```

Bạn có thể thay thế file `AGENTS.md` cũ bằng nội dung này. Nếu cần chỉnh sửa thêm phần nào (ví dụ thêm quy tắc về độ dài comment, hoặc bỏ một số mục không cần thiết), hãy cho tôi biết.
```
