# Optics Management — SWP1.4

Ứng dụng quản lý cửa hàng kính mắt. Full-stack: Node.js + Express (backend) · React 18 + Vite (frontend) · MongoDB.

---

## Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local hoặc Atlas) |

---

## Cài đặt

### 1. Clone repo

```bash
git clone <repo-url>
cd SWP
```

### 2. Cấu hình biến môi trường

**Backend** — tạo file `src/backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/SWP

JWT_SECRET=your_jwt_secret_key

CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary (lưu ảnh sản phẩm)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail SMTP — dùng App Password (không phải mật khẩu đăng nhập)
# Tạo App Password tại: https://myaccount.google.com/apppasswords
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Frontend** — tạo file `src/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Cài dependencies

Mở **2 terminal riêng biệt**:

```bash
# Terminal 1 — Backend
cd src/backend
npm install
```

```bash
# Terminal 2 — Frontend
cd src/frontend
npm install
```

### 4. Khởi động

```bash
# Terminal 1 — Backend (port 3000)
cd src/backend
npm run dev
```

```bash
# Terminal 2 — Frontend (port 5173)
cd src/frontend
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

---

## Seed dữ liệu mẫu (tuỳ chọn)

Thêm 10 sản phẩm mẫu vào MongoDB để test:

```bash
cd src/backend
npm run seed
```

---

## Cấu trúc thư mục

```
SWP/
├── src/
│   ├── backend/          # Node.js + Express API
│   │   ├── config/       # Kết nối DB, Cloudinary
│   │   ├── controllers/  # Xử lý request/response
│   │   ├── middlewares/  # Auth, error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Định nghĩa API endpoints
│   │   ├── services/     # Business logic
│   │   ├── validators/   # Joi validation schemas
│   │   ├── seed.js       # Script tạo dữ liệu mẫu
│   │   └── server.js     # Entry point
│   └── frontend/         # React 18 + Vite
│       └── src/
│           ├── contexts/ # Auth context
│           ├── feature/  # Feature-based modules (auth, products, admin)
│           └── pages/    # Route pages
└── .sdd/                 # Tài liệu đặc tả (spec, plan, tasks)
```

---

## API chính

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm (phân trang, tìm kiếm) | Public |
| GET | `/api/products/:id` | Chi tiết sản phẩm | Public |
| POST | `/api/products` | Thêm sản phẩm (upload ảnh) | ADMIN |
| PUT | `/api/products/:id` | Sửa sản phẩm | ADMIN |
| DELETE | `/api/products/:id` | Xóa mềm sản phẩm | ADMIN |
| POST | `/api/auth/register` | Đăng ký tài khoản | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |

Query params cho `GET /api/products`: `page`, `limit`, `search`, `minPrice`, `maxPrice`

---

## Trang chính

| URL | Mô tả |
|---|---|
| `/` | Trang chủ |
| `/products` | Danh sách sản phẩm (khách hàng) |
| `/admin/products` | Quản lý sản phẩm (ADMIN) |
| `/login` | Đăng nhập |
| `/register` | Đăng ký |

---

## Lưu ý

- File `.env` **không được commit** lên git (đã có trong `.gitignore`).
- Ảnh sản phẩm được lưu trên **Cloudinary**, không lưu local — cần cấu hình đúng Cloudinary credentials.
- Tài khoản ADMIN phải được set role trong MongoDB trực tiếp (field `role: "ADMIN"` trong collection `users`).
