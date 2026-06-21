# TASKS.md — Phân rã Công việc (Task Decomposition)

**Phân hệ:** Module 2 — Quản lý Sản phẩm (Full-stack)
**Trạng thái:** Sẵn sàng thực thi (READY)
**Cập nhật:** 2026-06-20

**Luật chung cho AI Agent:**
- Đọc kỹ `SPEC.md` và `PLAN.md` trước khi code. 🆕 *(Sửa tham chiếu: tài liệu spec là `SPEC.md`, không phải `PRODUCT_REQUIREMENTS.md`.)*
- Mỗi lần chỉ thực thi MỘT TASK DUY NHẤT. Làm xong báo cáo, chờ con người (Human) xác nhận rồi mới làm Task tiếp theo.
- Tuân thủ tuyệt đối: ES6 Modules, `semi: true`, thư viện **Joi**, cơ chế `deleted_at`.

> **CHANGELOG:** 🆕 v1.1.0 (2026-06-20) — Bổ sung cho mỗi task: **Est (giờ)**, **Dependencies**, **Spec refs** (map về EARS trong SPEC.md để chạy traceability matrix ở Pha 5). Hoàn thiện DoD bị cụt của Task 3. Không thay đổi nội dung công việc.

## Bảng tổng quan 🆕

| ID | Task | Est | Deps | Spec refs | Status |
|---|---|---|---|---|---|
| T1 | Core Domain (Model + Validator) | 3h | - | §5 Data, UBI-01/02, INV-02 | ✅ Done |
| T2 | Business Logic (Service + Cloudinary) | 4h | T1 | EVD-02/03/04/05, UBI-03, NOT-01 | ✅ Done |
| T3 | API Orchestration (Controller + Routes) | 3h | T2 | EVD-01/06, ERR-01/02/03/04, SEC-01 | ✅ Done |
| T4 | Unit Testing (Service) | 2h | T2 | AC-02, AC-09 | ✅ Done |
| T5 | Data Integration (useProducts hook) | 2h | T3 | EVD-01, PERF-02 | ✅ Done |
| T6 | Admin Management UI | 3h | T5 | EVD-02/03/04, UI/UX-01, ERR-02 | ✅ Done |
| T7 | Customer Display UI | 3h | T5 | STD-01/02/03, UI/UX-01 | ✅ Done |
| T8 | Product Detail Page (Frontend) 🆕 | 2h | T3, T5 | EVD-07, AC-13, STD-02 | ✅ Done |

*Tổng ước lượng ~22h. Critical path: T1 → T2 → T3 → T5 → (T6, T7, T8).*

---

## 📦 TASK 1: Core Domain (Database & Validation) - Backend
**Est:** 3h · **Deps:** - · **Spec refs:** 🆕 §5 Data Model, EARS-UBI-01, EARS-UBI-02, INV-02
**Mục tiêu:** Xây dựng móng dữ liệu và hàng rào bảo vệ (Validation).
**File cần tạo/sửa:**
1. `src/models/Product.js`: Tạo Mongoose schema với các trường đã định nghĩa. Đánh compound index cho `name` và `brand`. 🆕 *(Xác nhận compound vs single với PLAN — xem Q2 Questions for Human.)*
2. `src/validators/productValidator.js`: Tạo Joi Schema chặn đứng giá trị âm, rỗng.

**Tiêu chí hoàn thành (DoD):**
- [ ] Export đúng model `Product` (PascalCase).
- [ ] Joi validator có custom messages tiếng Việt.
- [ ] 🆕 Schema enforce `price ≥ 0`, `stock_quantity` integer `≥ 0`, `deleted_at` default `null`.

---

## ⚙️ TASK 2: Business Logic (Service Layer) - Backend
**Est:** 4h · **Deps:** T1 · **Spec refs:** 🆕 EARS-EVD-02/03/04/05, EARS-UBI-03, EARS-NOT-01
**Mục tiêu:** Triển khai lõi nghiệp vụ và cơ chế Rollback an toàn tài nguyên.
**File cần tạo/sửa:**
1. `src/config/cloudinaryConfig.js`: Cấu hình SDK Cloudinary.
2. `src/services/productService.js`:
   - `getAllProducts(page, limit)`: Lọc `deleted_at: null`.
   - `createProduct(payload, fileBuffer)`: Upload stream, lưu DB. Đảm bảo logic **try/catch Rollback Cloudinary** nếu DB sập.
   - `softDeleteProduct(id)`: Cập nhật `deleted_at`.

**Tiêu chí hoàn thành (DoD):**
- [ ] Logic upload stream Cloudinary hoạt động.
- [ ] Cơ chế Rollback gọi `cloudinary.uploader.destroy` được code tường minh.
- [ ] 🆕 `softDeleteProduct` chỉ set `deleted_at`, KHÔNG hard-delete (EARS-NOT-01).

---

## 🚦 TASK 3: API Orchestration (Controllers & Routes) - Backend
**Est:** 3h · **Deps:** T2 · **Spec refs:** 🆕 EARS-EVD-01/06, ERR-01/02/03/04, SEC-01
**Mục tiêu:** Mở cổng giao tiếp HTTP (Endpoints phẳng).
**File cần tạo/sửa:**
1. `src/controllers/productController.js`: Nhận request, gọi Joi Validator (trả 400 nếu lỗi). Gọi Service. Trả lỗi tập trung `{ success: false, error_code, message, request_id }`.
2. `src/routes/productRoutes.js`: Khai báo base path phẳng (`/api/products`), gắn middleware.

**Tiêu chí hoàn thành (DoD):**
- [ ] 🆕 Khớp 100% với RESTful endpoint phẳng `/api/products` (GET list, GET :id, POST, PUT :id, DELETE :id), **không** có nested route. *(Sửa câu DoD gốc bị cụt.)*
- [ ] Xử lý formData đúng chuẩn với Multer.
- [ ] 🆕 Trả 404 khi `:id` không tồn tại / đã soft-delete (ERR-04); response lỗi đúng cấu trúc SEC-01.

---

## 🧪 TASK 4: Unit Testing - Backend
**Est:** 2h · **Deps:** T2 · **Spec refs:** 🆕 AC-02, AC-09 (SPEC §8)
**Mục tiêu:** Viết Unit Test cho Service Layer.
**File cần tạo/sửa:**
1. `src/services/productService.test.js`: Dùng Jest để test hàm `createProduct`.
2. Viết 2 nhánh: Happy Path (trả 201) và Unwanted Path (sập DB phải gọi cloudinary destroy).

**Tiêu chí hoàn thành (DoD):**
- [ ] `npm run test` pass 100%.
- [ ] 🆕 Test name map về AC: `test_create_product_with_image` (AC-02), `test_rollback_on_db_fail` (AC-09).

---

## 🔌 TASK 5: Data Integration (Custom Hook) - Frontend
**Est:** 2h · **Deps:** T3 · **Spec refs:** 🆕 EARS-EVD-01, PERF-02
**Mục tiêu:** Đóng gói logic gọi API và quản lý state cho React.
**File cần tạo/sửa:**
1. `src/hooks/useProducts.js`: Khởi tạo custom hook quản lý các state `products`, `loading`, `error`, `totalPages`. Tích hợp logic fetch API (GET, POST FormData, DELETE).

**Tiêu chí hoàn thành (DoD):**
- [ ] Hook trả ra đầy đủ state và các hàm thao tác (fetch, create, remove).
- [ ] Quản lý trạng thái loading và bắt lỗi catch block sạch sẽ.
- [ ] 🆕 Đọc/ghi `page` qua URL Query Params (đồng bộ quyết định PLAN Q1).

---

## 🖥️ TASK 6: Admin Management UI - Frontend
**Est:** 3h · **Deps:** T5 · **Spec refs:** 🆕 EARS-EVD-02/03/04, UI/UX-01, ERR-02
**Mục tiêu:** Xây dựng giao diện bảng quản trị và Modal thêm mới.
**File cần tạo/sửa:**
1. `src/components/admin/ProductFormModal.jsx`: Form nhập liệu có input file. Bắt buộc có tính năng **Image Preview** (xem trước ảnh khi chọn). Xử lý dữ liệu thành `FormData` trước khi gọi API.
2. `src/components/admin/ProductAdminTable.jsx`: Hiển thị danh sách dạng bảng, có nút xóa mềm gọi API DELETE.

**Tiêu chí hoàn thành (DoD):**
- [ ] Preview ảnh hoạt động tốt.
- [ ] Form chặn submit nếu người dùng nhập giá/số lượng âm.

---

## 🛒 TASK 7: Customer Display UI - Frontend ✅ Done
**Est:** 3h · **Deps:** T5 · **Spec refs:** 🆕 EARS-STD-01/02/03, UI/UX-01
**Mục tiêu:** Giao diện lưới sản phẩm cho khách hàng.
**File cần tạo/sửa:**
1. `src/components/products/ProductCard.jsx`: Hiển thị 1 sản phẩm (Ảnh có aspect ratio cố định, tên, giá, nút thêm giỏ hàng/báo hết hàng nếu tồn kho = 0).
2. `src/components/products/ProductGrid.jsx`: Render lưới Grid 4 cột sử dụng Tailwind CSS. Đọc page từ URL Query Params (`useSearchParams`).

**Tiêu chí hoàn thành (DoD):**
- [x] Lưới Grid Responsive.
- [x] Phân trang hoạt động đồng bộ với URL.
- [x] 🆕 Hiển thị nhãn "Hết hàng" + chặn add-to-cart khi `stock_quantity = 0` (EARS-STD-02).

---

## 🔍 TASK 8: Product Detail Page (Frontend) 🆕 ✅ Done
**Est:** 2h · **Deps:** T3, T5 · **Spec refs:** EARS-EVD-07, AC-13, EARS-STD-02
**Mục tiêu:** Trang xem chi tiết sản phẩm cho CUSTOMER — hoàn thiện flow: Danh sách → Chi tiết → Giỏ hàng.

**Lý do bổ sung:** Gap phát hiện 2026-06-21: Actors §2 yêu cầu "xem chi tiết sản phẩm" nhưng T7 chỉ build list/card. Backend endpoint `GET /api/products/:id` đã sẵn sàng (✅).

**File cần tạo/sửa:**
1. `src/frontend/src/pages/ProductDetailPage.jsx` (tạo mới):
   - Fetch `GET /api/products/:id` bằng `useParams()` để lấy id.
   - Hiển thị: ảnh lớn (aspect 4:5), tên, thương hiệu, giá (VNĐ format), mô tả.
   - Badge "Hết hàng" + disable nút nếu `stock_quantity = 0` (EARS-STD-02).
   - Nút "Thêm vào giỏ" (placeholder cho Cart module — chưa implement logic).
   - Loading spinner, 404 message nếu sản phẩm không tồn tại.
2. `src/frontend/src/App.jsx` (sửa): Thêm route `<Route path="/products/:id" element={<ProductDetailPage />} />` trong `<MainLayout>`.
3. `src/frontend/src/feature/products/components/ProductCard.jsx` (sửa): Bọc card trong `<Link to={/products/${product._id}}>` để navigate sang trang chi tiết.

**Tiêu chí hoàn thành (DoD):**
- [x] Click ProductCard → navigate sang `/products/:id`.
- [x] Trang hiển thị đúng thông tin sản phẩm fetch từ API.
- [x] Stock = 0 → nút "Thêm vào giỏ" bị disable + nhãn "Hết hàng".
- [x] Sản phẩm không tồn tại (id sai/đã xóa) → hiển thị message lỗi 404, có nút "Quay lại".
- [x] Loading state trong khi đang fetch.
