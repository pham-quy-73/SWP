# MEMORY_LOG.md — Auto-generated Memory Log

**Khởi tạo:** 2026-06-15  
**Mục đích:** Ghi lại các quyết định, thay đổi, bài học trong quá trình phát triển.  
**Quy tắc:** Claude Code (và các AI Agent khác) sẽ tự động thêm entry vào cuối file này.

---

## 2026-06-15

- Khởi tạo project structure, tech stack: Node.js + Express, MongoDB + Mongoose, React + JavaScript.
- Áp dụng JWT, bcrypt, Jest.
- Tách verification và refund thành collection riêng.
- Thống nhất snake_case cho JSON và DB fields.
- Luồng đơn hàng: PENDING → AWAITING_VERIFICATION → CONFIRMED → COMPLETED; hủy: CANCELLED, REFUNDED.
- Tạo bộ tài liệu .sdd/ gồm Constitution, Shared Context, AGENTS, CLAUDE, MEMORY_LOG.

---

## 2026-07-08

### FEATURE-001: Server-side price validation trong OrderController.createOrder

- **Bối cảnh (rủi ro bảo mật):** Trước khi vá, `OrderController.createOrder` tin tuyệt đối vào trường `item.lensPrice` do Client gửi lên khi tính `finalUnitPrice = basePrice + lensPrice`. Kẻ tấn công có thể chỉnh sửa payload `POST /orders` để đặt `lensPrice = 0` (hoặc số âm) và mua tròng kính với giá gian lận. Đây chính là hạng mục "Current Focus" của CLAUDE.md.
- **Vị trí sửa:** [src/backend/controllers/OrderController.js:47-71](src/backend/controllers/OrderController.js#L47-L71) — bên trong vòng lặp `for (const item of items)` của hàm `createOrder`.
- **Giải pháp:**
  1. Loại bỏ hoàn toàn phụ thuộc vào `item.lensPrice`. Khi Client gửi `item.lensId`, Server tự tra `Product.findById(item.lensId)`.
  2. Kiểm chứng chặt chẽ: reject với `error_code: 'INVALID_LENS'` nếu tròng không tồn tại, `category !== 'LENS'`, hoặc `status !== 'ACTIVE'`.
  3. Lấy `lensPrice` từ DB theo thứ tự ưu tiên: `discountPrice > 0` → dùng `discountPrice`, ngược lại dùng `price`.
  4. Đồng bộ logic chọn `basePrice` của variant: đổi từ `!== undefined` sang `!= null && > 0` để tránh nhận `discountPrice = 0` khi Manager quên xóa trường khuyến mại.
- **Tác động:** Mọi đơn hàng có gắn tròng kính từ nay được tính giá 100% từ MongoDB, hoàn toàn miễn nhiễm với chỉnh sửa payload Client. Không thay đổi API contract — Frontend vẫn gửi `lensId` như cũ, chỉ bỏ qua trường `lensPrice` (nếu có gửi kèm sẽ bị Server im lặng phớt lờ).
- **Tương tác với LESSON-001 (auto-cancel):** Do `INVALID_LENS` được reject trước bước `$inc` trừ tồn kho, không phát sinh rò rỉ kho ảo khi kẻ tấn công thử payload sai.

### FEATURE-002: Address Book (Sổ địa chỉ persistent cho Customer)

- **Bối cảnh:** Trước khi có Address Book, mỗi lần thanh toán khách phải gõ lại đầy đủ tên, số điện thoại và địa chỉ trong `ShippingForm.jsx`. Frontend cũ đã "khai báo trước" API `getAddresses` gọi tới endpoint `/profile/addresses` nhưng backend chưa hề có route tương ứng — chức năng ở trạng thái "shell rỗng".
- **Kiến trúc dữ liệu:**
  - Tạo collection riêng `Address` (`src/backend/models/Address.js`) với `user_id` (index), `label`, `recipient_name`, `phone_number`, `delivery_address`, `is_default`, `timestamps`. Compound index `{ user_id: 1, is_default: -1, updatedAt: -1 }` để truy vấn list-by-user hiệu quả.
  - **Không** sửa schema `User` — giữ nguyên nguyên tắc chức năng có vòng đời riêng thì tách collection (tương tự Refund vs Order).
  - Đối tượng `Order` vẫn giữ 3 trường denormalized `recipient_name`, `phone_number`, `delivery_address` — snapshot tại thời điểm đặt để tránh việc sửa/xóa địa chỉ về sau làm sai lệch dữ liệu lịch sử đơn.
- **Backend:**
  - Controller mới `AddressController` với 5 hành động: `listMyAddresses`, `createAddress`, `updateAddress`, `setDefault`, `deleteAddress`. Tất cả đều enforce chủ sở hữu qua so sánh `user_id === req.user._id` để tránh IDOR.
  - Logic mặc định: tạo địa chỉ đầu tiên → auto set `is_default=true`; đổi mặc định → gọi `updateMany({is_default:true}, {$set:{is_default:false}})` trước; xóa địa chỉ mặc định → fallback sang địa chỉ có `updatedAt` mới nhất.
  - Routes mount tại `/api/addresses` trong `src/backend/routes/index.js` (đứng sau `/refund`).
- **Frontend:**
  - Mở rộng `profileApi` (`src/frontend/src/feature/profile/api/api.js`) — thêm `getAddresses` (đổi URL sang `/api/addresses`), `createAddress`, `updateAddress`, `setDefaultAddress`, `deleteAddress`.
  - Trang mới `src/frontend/src/feature/profile/page/MyAddresses.jsx` — bảng liệt kê + dialog thêm/sửa, action đặt mặc định, xóa. Dùng `sonner` toast + `lucide-react` icons theo phong cách sẵn có.
  - Thêm route `/profile/addresses` vào `App.jsx` và mục sidebar mới trong `ProfileSidebar.jsx`.
  - Tích hợp vào `ShippingForm.jsx`: dropdown "Chọn từ sổ địa chỉ" hiển thị khi có ít nhất 1 địa chỉ đã lưu. Khi vào checkout mà `shippingData` chưa có gì → tự động chọn địa chỉ mặc định và fill vào `useCheckoutStore`.
- **API contract (dev tra cứu):**
  - `GET /api/addresses` → `{ code, result: Address[] }`
  - `POST /api/addresses` body `{ label?, recipientName, phoneNumber, deliveryAddress, isDefault? }` → 201 `{ code, result }`
  - `PUT /api/addresses/:id` cùng payload → cập nhật; `isDefault=true` sẽ bỏ cờ ở các bản ghi cũ.
  - `PUT /api/addresses/:id/default` → chuyển sang mặc định
  - `DELETE /api/addresses/:id` → xóa (auto fallback default)

### FEATURE-003: Lens Builder — Persist đơn kính (prescription) theo từng OrderItem

- **Bối cảnh:** Widget `PrescriptionModal` (SPH/CYL/AXIS/ADD/PD cho 2 mắt + note + ảnh) đã có sẵn từ trước và được Client map vào payload `orderItems[i].prescription` tại `useCheckoutFlow.js`. Tuy nhiên `OrderController.createOrder` chỉ nhận `lensId`, âm thầm ném bỏ nguyên khối dữ liệu đơn kính, khiến kỹ thuật viên gia công phải hỏi lại từng đơn — dữ liệu không tra ngược được vào DB.
- **Kiến trúc dữ liệu:**
  - Thêm sub-document `PrescriptionSchema` (nhúng vào `OrderItem`) tại [src/backend/models/OrderItem.js](src/backend/models/OrderItem.js) — 10 trường số (`od_/os_` × `sphere/cylinder/axis/add/pd`) + `note`.
  - Nhúng thay vì tạo collection riêng: đơn kính có vòng đời đúng bằng vòng đời của `OrderItem`, không truy vấn cross-order → tránh JOIN vô ích. Đồng bộ với ADR-003 (nhúng Payment vào Order).
  - `prescription: null` cho các item không gắn tròng (gọng-only, kính râm không đo độ) — chống rác data khi User quen tay bấm submit widget.
- **Backend:**
  - `createOrder` bổ sung helper `normalizePrescription(p)`:
    - Chấp nhận cả camelCase (`odSphere`) lẫn snake_case (`od_sphere`) để tương thích ngược với các phiên bản Client cũ.
    - `sphere/cylinder/add/pd` → `parseFloat`, fallback `0` nếu không phải số hữu hạn.
    - `axis` → làm tròn nguyên và clamp `[0..180]`; giá trị ngoài range → `0` (tránh dữ liệu vật lý sai hại lens grinder).
    - `note` → cắt 500 ký tự (chống payload phồng).
  - Chỉ persist prescription khi item có `lensId` (guard chống rác).
  - `myOrders` bổ sung `.populate('lens_id')` và trả thêm `lensName`, `prescription` để FE hiển thị lại trong `MyOrder.jsx`.
- **Frontend:** Không đổi API contract — payload sẵn có từ `useCheckoutFlow.js` (đã map từ camelCase) chảy đúng vào backend mới.
- **Tương tác với FEATURE-001:** Vì prescription chỉ persist khi `lensId` được xác thực (`INVALID_LENS` reject sớm), không xảy ra trạng thái "có đơn kính nhưng không có tròng".

---

## 2026-07-12

### SECURITY-001: Đưa VNPay credentials ra `.env` (gỡ hardcode secret)

- **Bối cảnh (rủi ro bảo mật):** `tmnCode` và `secretKey` của VNPay bị hardcode thẳng trong `PaymentController.js` ở cả 2 hàm `checkout` và `vnpayCallback`. Secret key nằm trong mã nguồn → lộ khi push repo, không xoay vòng được theo môi trường.
- **Vị trí sửa:**
  - [src/backend/.env](src/backend/.env) — bổ sung `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL` (và `NODE_ENV=development`, xem SECURITY-003).
  - [src/backend/controllers/PaymentController.js](src/backend/controllers/PaymentController.js) — `checkout` đọc creds từ `process.env`, thêm guard trả `500 CONFIG_ERROR` nếu thiếu `VNP_TMN_CODE`/`VNP_HASH_SECRET`; `vnpayCallback` đọc `VNP_HASH_SECRET` từ env, redirect `/checkout/failure` nếu chưa cấu hình.
- **Lưu ý vận hành:** `.env` đã nằm trong `.gitignore` từ trước. Khi deploy phải set 4 biến VNPay trên môi trường thật; đây vẫn đang là giá trị sandbox.

### SECURITY-002: Chống double-processing + đối chiếu số tiền trong `vnpayCallback`

- **Bối cảnh (rủi ro tài chính):** Callback cũ chỉ kiểm tra chữ ký + `vnp_ResponseCode === '00'` rồi ghi `status = CONFIRMED`. Hai lỗ hổng: (1) callback lặp / user refresh có thể chạy lại logic trên đơn đã xử lý; (2) không đối chiếu số tiền thực trả với `total_amount` của đơn → có thể xác nhận đơn với số tiền sai.
- **Vị trí sửa:** [src/backend/controllers/PaymentController.js](src/backend/controllers/PaymentController.js) — hàm `vnpayCallback`, sau bước verify chữ ký.
- **Giải pháp:**
  1. **PENDING gate:** nếu `order.status !== 'PENDING'` → không ghi lại trạng thái; redirect theo trạng thái hiện có (`CONFIRMED`/`COMPLETED` → success, còn lại → failure). Chặn xử lý trùng.
  2. **Amount check:** so khớp `parseInt(vnp_Amount) === Math.round(order.total_amount * 100)` (VNPay gửi tiền × 100). Lệch → log lỗi + redirect failure, không xác nhận đơn.
- **Tương tác với ADR-003:** Do Payment nhúng trong Order, PENDING gate cũng chính là khóa idempotency của giao dịch — mỗi hóa đơn chỉ kích hoạt thanh toán đúng một lần như thiết kế.

### SECURITY-003: Gate `mockCheckout` sau `NODE_ENV`

- **Bối cảnh:** Endpoint `POST /payment/mock-checkout` mô phỏng thanh toán thành công/thất bại mà không qua cổng VNPay thật. Nếu lộ ra production, bất kỳ ai cũng có thể tự "xác nhận đã thanh toán" đơn của mình.
- **Vị trí sửa:** [src/backend/controllers/PaymentController.js](src/backend/controllers/PaymentController.js) — đầu hàm `mockCheckout`: trả `403 FORBIDDEN` khi `process.env.NODE_ENV === 'production'`; chỉ chạy ở môi trường dev.

### REFACTOR-001: Bọc luồng tạo đơn trong `session.withTransaction()`

- **Bối cảnh (toàn vẹn dữ liệu):** `createOrder` thực hiện 3 bước tuần tự không nguyên tử — trừ tồn kho (`$inc`), tạo `Order`, tạo nhiều `OrderItem`. Nếu lỗi giữa chừng (mất kết nối DB, validate schema fail) → tồn kho đã bị trừ nhưng không có đơn, hoặc đơn tồn tại mà thiếu item.
- **Vị trí sửa:** [src/backend/controllers/OrderController.js](src/backend/controllers/OrderController.js) — hàm `createOrder`.
- **Giải pháp:**
  1. `import mongoose`; mở `mongoose.startSession()` và bọc toàn bộ trừ-kho + `Order.save` + `OrderItem.save` trong `session.withTransaction()`, truyền `{ session }` vào mọi read/write (`.session(session)` cho query, `{ session }` cho save/update).
  2. Lỗi nghiệp vụ (variant not found, hết hàng, lens sai) → ném `OrderValidationError` để rollback transaction, bắt lại ở ngoài và trả đúng mã HTTP (thay vì để `errorHandler` nuốt thành 500).
  3. `endSession()` trong `finally`. Gỡ bỏ `console.log("Đang tìm variantId")` debug.
- **⚠️ Ràng buộc hạ tầng:** `withTransaction` **yêu cầu MongoDB chạy replica set**. Kết nối dev hiện tại là standalone `mongodb://localhost:27017` → sẽ throw lúc runtime cho tới khi chạy Mongo với `--replSet` (hoặc trỏ Atlas).

### FIX-001: Sửa 3 chỗ `stock_quantity` → `quantity` (đúng model `ProductVariant`)

- **Bối cảnh (bug tồn kho):** Tồn kho thực nằm ở `ProductVariant.quantity`; `Product` không có trường `stock_quantity`. 3 chỗ vừa dùng sai tên trường vừa `$inc`/query nhầm sang `Product` → thao tác tồn kho không có tác dụng (no-op ngầm), sai lệch với pattern đúng đã có ở `cancelOrder`.
- **Vị trí sửa:**
  - [src/backend/controllers/PaymentController.js](src/backend/controllers/PaymentController.js) — `mockCheckout` hoàn kho khi giao dịch fail: chuyển sang `ProductVariant.findByIdAndUpdate(item.variant_id, { $inc: { quantity } })`.
  - [src/backend/server.js](src/backend/server.js) — background job auto-cancel đơn PENDING quá hạn 15 phút: hoàn kho qua `ProductVariant` + `variant_id`.
  - [src/backend/controllers/DashboardController.js](src/backend/controllers/DashboardController.js) — thống kê "sắp hết hàng": đếm `ProductVariant.countDocuments({ status: 'ACTIVE', quantity: { $lt: 10 } })`.
- **Kèm theo:** thêm `import ProductVariant` vào cả 3 file. Các file đã pass `node --check`; không còn `stock_quantity` trong mã thực thi (chỉ còn 2 comment "đã gỡ bỏ" ở `ProductController.js`).

### NOTE-001: Sai lệch biến môi trường `MONGODB_URI` vs `MONGO_URI` (chưa sửa)

- `config/db.js` đọc `process.env.MONGODB_URI` nhưng `.env` khai báo `MONGO_URI` → app đang chạy bằng chuỗi fallback localhost hardcode. Chưa động vào vì ngoài phạm vi task; cần thống nhất tên biến ở lần vá sau.
