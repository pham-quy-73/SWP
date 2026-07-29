# CLAUDE.md — Optic (Hệ thống quản lý & bán hàng kính mắt)

Tài liệu này là "bộ nhớ dài hạn" của dự án dành cho nhà phát triển và AI agent.
Đọc `.claude/CLAUDE.md` (project instructions) trước khi thực hiện bất kỳ thay đổi nào.

---

## MANUAL MEMORY

### Architecture Decisions (ADRs)

#### ADR-001: JWT + Google OAuth2

- **Lý do:** Stateless API để dễ mở rộng và hỗ trợ đăng nhập qua mạng xã hội.
- **Triển khai:** JWT access token gửi qua header `Authorization: Bearer <token>`.
  Google OAuth dùng `google-auth-library` xác thực ID token phía backend.
- **Hệ quả:** Không đề xuất chuyển sang session/cookie-based auth.

#### ADR-002: MongoDB + Mongoose ODM

- **Lý do:** Mongoose cung cấp schema validation, middleware hooks, ép kiểu tự động
  giúp hạn chế lỗi dữ liệu.
- **Hệ quả:** Không đề xuất Prisma hay driver thuần.

#### ADR-003: Nhúng dữ liệu Payment vào Order

- **Lý do:** Mỗi hóa đơn chỉ kích hoạt thanh toán trực tuyến (VNPay) một lần duy nhất.
  Nhúng đối tượng thanh toán giúp tối ưu tốc độ kết xuất dữ liệu hóa đơn.
- **Hệ quả:** Không tạo collection Payment riêng; truy vấn payment đi qua Order.

#### ADR-004: PricingService là nguồn giá duy nhất

- **Lý do:** Không tin giá/tồn kho từ client. Báo giá lúc checkout và tạo đơn thật
  phải dùng chung một luồng tính để không lệch nhau.

#### ADR-005: Frontend React 18 + Vite, state tách đôi

- **Server state:** TanStack Query. **Client state:** Zustand.
- **Form:** React Hook Form + Zod. **HTTP:** axios qua `src/lib/httpClient.js`.
- **Hệ quả:** Không đề xuất Redux; hook mới không gọi axios trực tiếp.

#### ADR-006: Thanh toán VNPay Sandbox

- **Triển khai:** Callback backend `/api/payment/vnpay-callback`, cấu hình qua biến `VNP_*`.
- **Job nền:** `jobs/orderCleanupJob.js` dọn đơn quá hạn thanh toán (15 phút).

### Lessons Learned

#### LESSON-001: Stock nằm ở ProductVariant, không phải Product

Không query tồn kho từ Product. Gọng kính = Product + ProductVariant (màu/size).

#### LESSON-002: Luôn validate ObjectId trước khi query

ObjectId sai định dạng phải trả `400 VALIDATION_ERROR`, không để Mongoose ném CastError thành 500.

#### LESSON-003: Không silent normalization thông số quang học

Không tự động chuyển thông số sai về `0` một cách âm thầm. Bắt buộc gọi hàm kiểm tra
nghiêm ngặt (`validatePrescriptionFields`, `validateAddressInputs`); dữ liệu lỗi
→ HTTP `400` với `error_code: VALIDATION_ERROR` kèm message tiếng Việt rõ ràng.

#### LESSON-004: Validate đơn kính thuốc ở Frontend

SPH, CYL, ADD làm tròn về bội số `0.25`; PD làm tròn về bội số `0.5`.
Format ngay khi mất focus (`onBlur` gọi `formatOpticalValue`). Chặn nút
"Thêm vào giỏ hàng" và toast lỗi cụ thể nếu thông số sai miền giá trị.

#### LESSON-005: Ràng buộc thông tin giao hàng

Họ tên ≤ 100 ký tự; SĐT khớp định dạng Việt Nam; địa chỉ 3–300 ký tự.
Validate cả hai phía FE và BE.

#### LESSON-006: Test chạy tuần tự

`fileParallelism: false` trong vitest — test dùng chung một instance
mongodb-memory-server, chạy song song sẽ ghi đè dữ liệu của nhau. Đừng bật parallel.

#### LESSON-007: Không hardcode secrets

Luôn dùng `.env` (đã nằm trong `.gitignore`). Không commit giá trị thật của
`JWT_SECRET`, `VNP_HASH_SECRET`, `SMTP_PASS`, v.v.

#### LESSON-008: app.js tách khỏi server.js

`app.js` chỉ gắn middleware/route (import trực tiếp được cho Supertest, không mở cổng,
không chạm DB thật); `server.js` mới connect DB + listen + khởi động job. Giữ nguyên
ranh giới này khi thêm tính năng.

### Current Sprint (cập nhật 2026-07-26)

- Hoàn thiện spec các feature: admin-users, cart, checkout (`.sdd/specs/`).
- Hoàn thiện Order & Payment flow (VNPay sandbox).
- Duy trì ngưỡng coverage: lines 90 / branches 85 / functions 90 / statements 90.
- Validation ảnh sản phẩm (multer) — đã có commit `add:validation image`.

---

## PATTERNS TO FOLLOW

### Backend (`src/backend/` — ESM, Express 5 + Mongoose)

- **Phân tầng bắt buộc:**

  ```
  routes/  →  controllers/  →  services/ + models/
  ```

  - `routes/` chỉ mount endpoint + middleware; gộp dưới `/api` (xem `routes/index.js`).
  - `controllers/` chỉ xử lý request/response, không chứa business logic.
  - `services/` chứa business logic (AuthService, MailService, PricingService).
  - `models/` không chứa logic nghiệp vụ.

- **Quy ước dữ liệu:** trường DB dùng `snake_case`; timestamps bật sẵn;
  xóa mềm bằng `deleted_at`.
- **Auth middleware** (`middlewares/authMiddleware.js`):
  - `authenticate` — bắt buộc token, gán `req.user`.
  - `optionalAuthenticate` — auth "mềm" cho route công khai.
  - `requireRole([...])` — role: `CUSTOMER | MANAGER | ADMIN`
    (role `SALE` và `SHIPPER` đã loại bỏ — out of scope, không thêm lại nếu chưa được duyệt).
- **Format lỗi API thống nhất:**
  ```json
  { "error_code": "VALIDATION_ERROR", "message": "Thông báo lỗi tiếng Việt" }
  ```
- **Giá/tồn kho:** luôn tính lại qua `PricingService.priceOrderItem` — không tin client.
- **Test:** mỗi service/route mới cần test tương ứng
  (`tests/unit`, `tests/integration` với Supertest gọi `createApp()`, `tests/system`).
  Factory ở `tests/helpers/factories.js`.
- **ESM:** dùng `import`, không `require`.
- **Comment viết bằng tiếng Việt**, giữ phong cách file hiện có.

### Frontend (`src/frontend/src/`)

- **Tổ chức theo feature:** `feature/{auth,checkout,product,profile,admin,manager}` —
  mỗi feature có `components/`, `hooks/`, `api/`, `store/` riêng.
  Layout dùng chung ở `components/layout/`; trang ở `pages/`.
- **HTTP:** dùng `src/lib/httpClient.js` (axios instance, tự chuẩn hóa base URL `/api`).
  Một số hook cũ (`useAdminUsers.js`, `useLoginForm.js`) còn gọi axios trực tiếp —
  đó là legacy, code mới phải dùng `httpClient`.
- **State:** server state → TanStack Query; client state → Zustand.
- **Form:** React Hook Form + Zod; toast bằng sonner.

### Lệnh thường dùng

```bash
# Backend (src/backend)
npm run dev            # node --watch server.js
npm test               # vitest run --fileParallelism=false
npm run seed           # seed toàn bộ (seed:users, seed:lenses riêng lẻ)
npx vitest run tests/integration/order.routes.test.js   # một file test

# Frontend (src/frontend)
npm run dev            # vite (port 5173)
npm run build          # vite build → dist/

# Triển khai
docker compose up --build   # backend :3000 + frontend :8080
```

### Knowledge Graph (Graphify)

- **Truy vấn trước:** `graphify query "<câu hỏi>"` hoặc `graphify explain "<khái niệm>"`
  khi có câu hỏi về codebase.
- **Điều hướng rộng:** đọc `graphify-out/wiki/index.md` để hiểu kiến trúc tổng quan.
- **Cập nhật:** sau khi sửa code, chạy `graphify update .` (AST-only, không tốn API).

---

## AUTO MEMORY

<!-- Claude Code tự bổ sung các ghi nhớ mới tại đây. Mỗi entry dạng:
# Learned: <điều đã học> (YYYY-MM-DD)
Review và dọn dẹp phần này định kỳ hàng tuần — xóa entry lỗi thời. -->

# Learned: Backend dùng Joi cho validation, multer cho upload ảnh, xlsx cho xuất Excel. (2026-07-26)

# Learned: Payment không có model riêng — nhúng trong Order (xem ADR-003); Refund là model riêng. (2026-07-26)
