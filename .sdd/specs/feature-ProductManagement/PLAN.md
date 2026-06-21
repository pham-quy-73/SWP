# KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (PLAN.md)

**Phân hệ:** Module 2 — Quản lý Sản phẩm
**Người lập:** Lê Văn Bảo
**Trạng thái:** APPROVED
**Cập nhật:** 2026-06-20

> **CHANGELOG**
> - **v1.1.0 (2026-06-20):** Mở rộng Risks từ 1 → 6 (Ch6 yêu cầu ≥3, rubric ≥5). Bổ sung §7 "Questions for Human". Ghi chú lệch đường dẫn file với TASKS.md. **Không thay đổi kiến trúc/quyết định kỹ thuật.** Phần bổ sung đánh dấu 🆕.

---

## 1. ARCHITECTURAL APPROACH (Tiếp cận Kiến trúc)

- **Tách biệt Pipeline Xử lý File (Multipart/form-data):** Request chứa hình ảnh đi qua Middleware trung gian (`multer`) để phân tách file ảnh và dữ liệu text. File ảnh được đẩy thẳng lên stream của Cloudinary không qua ổ cứng server (Stateless).
- **Backend Isolation Layer (Phân lớp):** Tuân thủ luồng `Router` → `Controller` → `Service` → `Model`. Mọi logic kiểm tra ranh giới dữ liệu (giá ≥ 0, tồn kho ≥ 0) bắt buộc đi qua tầng **Joi Validation** trước khi vào Controller.
- **Frontend Component Separation:** Tách biệt hoàn toàn giao diện Grid sản phẩm cho CUSTOMER (`ProductGrid.jsx`) và bảng quản trị cho ADMIN (`AdminProductsPage.jsx` / `ProductFormModal.jsx`). Logic gọi API và state (loading, error, pagination) đóng gói trong custom hook `useProducts`.
- **Cú pháp Tiêu chuẩn:** Áp dụng ES6 Modules (`import/export`) và sử dụng dấu chấm phẩy (`;`) ở cuối dòng (`semi: true`).

## 2. COMPONENTS & FILE STRUCTURE (Thành phần & Cấu trúc File)

> ⚠️ **Lưu ý lệch đường dẫn (cần thống nhất):** 🆕 PLAN dùng prefix `src/backend/...` và `src/frontend/src/...`, còn TASKS.md dùng `src/models/...`, `src/services/...`. Hãy chọn đúng cấu trúc thư mục thực tế của repo và đồng bộ cả hai file để tránh nhầm khi AI/dev đọc.

**Backend (Node.js/Express):**
- `src/backend/models/Product.js`: Mongoose Schema. Đánh chỉ mục (Index) `name` và `brand`. Tích hợp trường `deleted_at: Date` (mặc định `null`) phục vụ Soft-delete.
- `src/backend/services/CloudinaryService.js`: Khởi tạo và tương tác với SDK Cloudinary.
- `src/backend/validators/productValidator.js`: Cấu hình Joi Schema ép kiểu và bắt lỗi dữ liệu đầu vào.
- `src/backend/services/ProductService.js`: Lõi nghiệp vụ (getAll phân trang/lọc `deleted_at: null`, create, update, soft-delete, logic rollback file Cloudinary).
- `src/backend/controllers/ProductController.js` & `src/backend/routes/product.routes.js`: Định tuyến endpoint phẳng `/api/products`, tích hợp Middleware `verifyToken` và `checkRole('ADMIN')` (hiện tại `verifyAdmin` tạm thời comment để test).

**Frontend (React/Vite):**
- `src/frontend/src/hooks/useProducts.js`: Đảm nhiệm fetch API, quản lý URL Query Params.
- `src/frontend/src/features/products/ProductGrid.jsx` & `src/frontend/src/components/ProductCard.jsx`: Giao diện khách hàng.
- `src/frontend/src/features/admin/ProductFormModal.jsx`: Form tạo/sửa sản phẩm kèm tính năng Preview ảnh.

## 3. DATA FLOW (Luồng Dữ liệu Mạch lạc)

**Luồng CUSTOMER (Xem danh sách):**
Component mount → React gọi Hook `useProducts` → Đọc URL Query params → Gửi `GET /api/products?page=...` → Backend (Service) lọc sản phẩm có `deleted_at: null` → Trả JSON → Render Grid.

**Luồng ADMIN (Thêm Sản phẩm):**
Điền form + chọn ảnh → Gửi `POST /api/products` (FormData) → Backend `multer` bắt file → Cloudinary đẩy mây nhận `image_url` và `image_public_id` → **Joi Validator** kiểm duyệt text → Lưu MongoDB → HTTP 201 → Đóng Modal & refetch.

## 4. DEPENDENCIES (Thư viện phụ thuộc)

- **Backend:** `multer`, `cloudinary`, `joi`, `mongoose`.
- **Môi trường (`.env`):** Cần đảm bảo có `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Trình tự thực thi cho AI Agent:** Code `Model` & `Validator` → Code `Service` → Code `Controller` & `Routes` → Viết Unit Test → Triển khai UI Frontend.

## 5. RISKS & MITIGATIONS (Rủi ro & Giải pháp)

| # | Rủi ro | Khả năng | Impact | Giải pháp giảm thiểu |
|---|---|---|---|---|
| R1 | **Orphaned Images:** Upload Cloudinary OK nhưng lưu MongoDB thất bại → ảnh treo lãng phí | Med | Med | Bọc luồng create trong `try/catch`; nếu `Product.create()` fail → gọi `cloudinary.uploader.destroy(image_public_id)` trước khi trả HTTP 500 |
| R2 🆕 | **Overselling / race condition** khi nhiều người mua sản phẩm `stock_quantity` thấp cùng lúc | High | High | Module Checkout giữ Reservation `PENDING_PAYMENT` (STOCK-01); chỉ trừ kho khi IPN `SUCCESS`. Module Product không trừ kho trực tiếp |
| R3 🆕 | **Cloudinary downtime/timeout** làm POST/PUT treo | Med | Med | Set timeout cho SDK; fail nhanh, trả 500 theo SEC-01; không lưu DB khi ảnh chưa lên |
| R4 🆕 | **multer ngốn RAM** khi upload file lớn / nhiều request đồng thời | Med | Med | Giới hạn file ≤ 5MB ngay tại middleware (ERR-03); dùng memory stream + giải phóng buffer |
| R5 🆕 | **PUT thay ảnh làm rò ảnh cũ** nếu destroy ảnh cũ thất bại | Med | Low | Destroy ảnh cũ sau khi update DB thành công; log `image_public_id` cũ để dọn định kỳ nếu destroy fail |
| R6 🆕 | **Lệch thư viện validation (Joi vs Zod)** giữa các artifact gây hiểu nhầm | Low | Med | Đã chốt **Joi** toàn dự án; cập nhật CONTEXT.md (CODE-01) |

## 6. RESOLVED QUESTIONS (Các quyết định kỹ thuật đã chốt)

- **Q1:** Trạng thái phân trang (Current Page) ở Frontend lưu ở đâu?
  → **Quyết định:** Bắt buộc đẩy lên **URL Query Params** (dùng `useSearchParams` của React Router) để khách hàng có thể copy link chia sẻ nguyên trạng thái trang.
- **Q2:** Giao diện "Thùng rác" cho tính năng Soft-delete?
  → **Quyết định:** Đẩy sang **Phase 2** (ngoài phạm vi hiện tại). Giai đoạn này chỉ tập trung cập nhật `deleted_at` thành timestamp để ẩn khỏi UI.

## 7. QUESTIONS FOR HUMAN (Cần con người xác nhận trước/khi implement) 🆕
*(Ch6 — phần "vàng": nơi AI chỉ ra chỗ spec còn mơ hồ. Trả lời để khóa lại trước khi code Pha 4.)*

1. **`verifyAdmin` đang comment để test** — bật lại ở môi trường nào, mốc thời gian nào? (ảnh hưởng ERR-01/OPT-01)
2. **Index `name`/`brand`:** dùng 2 single index hay 1 **compound index**? (TASKS ghi compound, PLAN ghi từng trường — ảnh hưởng hiệu năng filter PERF-01)
3. **Pagination mặc định:** `limit` default = bao nhiêu, có giới hạn `limit` tối đa để chống truy vấn nặng không?
4. **PUT không kèm ảnh mới:** xác nhận chỉ update text, giữ nguyên ảnh cũ (không gọi Cloudinary destroy)?
5. **`request_id`** trong SEC-01: sinh ở middleware nào, có propagate vào log để trace không?
