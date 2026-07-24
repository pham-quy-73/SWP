# Optic — Hệ thống quản lý & bán hàng kính mắt (MERN)

Ứng dụng thương mại điện tử cho cửa hàng kính mắt: bán gọng kính (product + variant), tròng kính (lens), quản lý đơn hàng, thanh toán VNPay, và quản trị theo vai trò. Backend Express + MongoDB, frontend React + Vite, triển khai bằng Docker Compose.

## Cấu trúc dự án

```
src/backend    Express 5 + Mongoose (ESM). API dưới /api
src/frontend   React 18 + Vite + Tailwind. Nginx phục vụ bản build, proxy /api và /uploads về backend
docker-compose.yml   backend (expose 3000) + frontend (port 8080 → nginx :80)
docs/          Tài liệu
graphify-out/  Knowledge graph sinh bởi skill graphify
uploads/       Ảnh sản phẩm & feedback (mount vào volume optic_uploads)
```

## Backend (`src/backend`)

- **Kiến trúc phân tầng**: `routes/` → `controllers/` → `services/` + `models/`. `app.js` gắn middleware/route (import trực tiếp được cho Supertest, không mở cổng/không chạm DB thật); `server.js` mới thực sự connect DB + listen + khởi động job.
- **Routing**: mọi route gộp dưới `/api` (xem `routes/index.js`). Có thêm alias legacy (`/orders`, `/products`, …) trong `app.js` cho tương thích ngược & test. `/api/status` và `/api/health` là health check.
- **Model chính**: User, Product, ProductVariant, Lens, Cart, Order, OrderItem, Address, Feedback, Payment (qua Order), Refund, Verification. Trường DB dùng `snake_case`; timestamps bật sẵn; xóa mềm bằng `deleted_at`.
- **Auth**: JWT Bearer + Google OAuth (`google-auth-library`). Middleware trong `middlewares/authMiddleware.js`:
  - `authenticate` — bắt buộc token, gán `req.user`.
  - `optionalAuthenticate` — auth "mềm" cho route công khai (khách vãng lai vẫn qua).
  - `requireRole([...])` — phân quyền. Role: `CUSTOMER | SALE | MANAGER | SHIPPER | ADMIN`.
  - Lỗi trả về dạng `{ error_code, message }`.
- **Định giá — nguồn giá duy nhất**: `services/PricingService.js` (`priceOrderItem`) tính giá theo DB, KHÔNG tin giá client. Dùng chung cho báo giá lúc checkout và tạo đơn thật để hai luồng không lệch. Ném `PricingError(status, body)`.
- **Thanh toán**: VNPay sandbox. Callback backend `/api/payment/vnpay-callback`. Cấu hình qua `VNP_*` trong `.env`.
- **Email**: `services/MailService.js` (Nodemailer) gửi mail xác thực. Cần App Password của Gmail (`SMTP_USER`/`SMTP_PASS`).
- **Job nền**: `jobs/orderCleanupJob.js` dọn đơn quá hạn thanh toán (15 phút), khởi động sau khi connect DB.
- **CORS**: origin lấy từ `utils/clientUrl.js` (đọc `CLIENT_URL`, danh sách phân tách bằng dấu phẩy; origin đầu tiên là base cho redirect).

### Lệnh backend
```bash
npm run dev          # node --watch server.js
npm start            # node server.js
npm test             # vitest (mongodb-memory-server, in-memory DB)
npm run seed         # seed_data.js  (users: seed:users, lenses: seed:lenses)
```

### Testing
- Vitest, cấu hình `vitest.config.js`. `tests/setup.js` bật mongodb-memory-server dùng chung một instance.
- `fileParallelism: false` — test chạy **tuần tự** để không ghi đè dữ liệu của nhau. Đừng bật parallel.
- Phân loại: `tests/unit`, `tests/integration` (Supertest gọi `createApp()`), `tests/system` (customer journey). Factory ở `tests/helpers/factories.js`.
- Ngưỡng coverage bắt buộc: lines 90 / branches 85 / functions 90 / statements 90.

## Frontend (`src/frontend`)

- **Stack**: React 18, React Router v6, TanStack Query (server state), Zustand (client state), React Hook Form + Zod, Tailwind, axios, sonner (toast), framer-motion, `@react-oauth/google`.
- **Tổ chức theo feature**: `src/feature/{auth,checkout,product,profile,admin,manager}` — mỗi feature có `components/`, `hooks/`, `api/`, `store/` riêng. Layout dùng chung ở `components/layout/`; trang ở `pages/`.
- **HTTP**: dùng `src/lib/httpClient.js` (axios instance, tự chuẩn hóa base URL với `/api`). `VITE_API_URL` để trống khi chạy sau nginx (proxy `/api`). *Lưu ý*: một số hook cũ (vd `useAdminUsers.js`, `useLoginForm.js`) còn gọi axios trực tiếp — ưu tiên `httpClient` cho code mới.

### Lệnh frontend
```bash
npm run dev      # vite (port 5173)
npm run build    # vite build → dist/
npm run preview
```

## Docker / triển khai
```bash
docker compose up --build   # backend :3000 (nội bộ) + frontend :8080
```
- Frontend build tĩnh, nginx phục vụ và proxy `/api/` + `/uploads/` về `backend:3000` (xem `src/frontend/nginx.conf`).
- Backend chờ healthy trước khi frontend khởi động.

## Biến môi trường
- Backend `src/backend/.env` (xem `.env.example`): `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CLIENT_URL`, `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`, `SMTP_USER`, `SMTP_PASS`.
- Frontend build args: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
- **KHÔNG commit giá trị thật.** File `.env` đã nằm trong `.gitignore`.

## Quy ước
- Backend là **ESM** (`"type": "module"`) — dùng `import`, không `require`.
- Comment trong code viết bằng tiếng Việt; giữ nguyên phong cách khi sửa file.
- Response lỗi API dùng `{ error_code, message }` với message tiếng Việt.
- Không tin dữ liệu giá/tồn từ client — luôn tính lại qua `PricingService`.

# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

# userEmail
The user's email address is [redacted].
