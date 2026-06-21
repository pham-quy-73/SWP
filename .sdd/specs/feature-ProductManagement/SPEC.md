# Đặc tả Hệ thống Quản lý Sản phẩm (Product Spec)

> **Phân hệ:** Module 2 — Quản lý Sản phẩm (Product Management) · Dự án: **Optics Management**
> **Owner:** @le-van-bao (backend lead) · **Người lập:** Lê Văn Bảo
> **Version:** 1.2.0 · **Status:** APPROVED · **Risk:** Trung bình · **Level:** Formal
> **Ngày cập nhật:** 2026-06-20 · **Sprint:** locked cho sprint hiện tại
> **Tài liệu liên quan:** `CONTEXT.md` (v1.0.0), `PLAN.md` (APPROVED), `TASKS.md` (READY)

> **CHANGELOG**
> - **v1.2.0 (2026-06-20):** *Documentation completeness pass.* Bổ sung các phần còn thiếu để spec đạt chuẩn **Formal** (State Diagram, Invariants, SHALL NOT, traceability matrix, Out of Scope mở rộng, glossary, dependencies). 
> - v1.1.0 (2026-06-19): Bản APPROVED ban đầu.
>


---

## 0. Glossary — Thuật ngữ domain 🆕
*(Ch5 — Context Gap: tránh để AI/người đọc tự diễn giải thuật ngữ)*

| Thuật ngữ | Định nghĩa trong dự án này |
|---|---|
| **SKU** | Mỗi bản ghi sản phẩm = 1 SKU độc lập. Không có bảng Variants; màu/size phân biệt qua Naming Convention (xem §5). |
| **Soft-delete** | Ẩn sản phẩm khỏi UI khách hàng bằng cách set `deleted_at` = timestamp, **không** xóa bản ghi khỏi DB (giữ toàn vẹn lịch sử đơn hàng). |
| **Orphaned image** | Ảnh đã upload thành công lên Cloudinary nhưng bản ghi DB lưu thất bại → ảnh "treo" lãng phí tài nguyên. Xử lý bằng Rollback (EARS-EVD-05). |
| **Stock Reservation** | Khóa kho tạm thời (`PENDING_PAYMENT`, TTL 15') khi Checkout. **Thuộc module Checkout/VNPay**, ngoài phạm vi module này (xem §9). |

---

## 1. Context & Goal

**Business problem:** Cửa hàng kính cần số hóa danh mục gọng kính. Khách hàng cần tìm/lọc nhanh để ra quyết định mua; nhân viên cần xem tồn kho thực để tư vấn; quản trị viên cần CRUD mạnh và kiểm soát tồn kho chống overselling.

**Feature goal:** Cung cấp phân hệ quản lý danh mục sản phẩm trực quan, tốc độ cao, an toàn dữ liệu — với hình ảnh xử lý qua Cloudinary (giảm tải server) và cơ chế Soft-delete bảo toàn lịch sử.

**Success metric:** 🆕 API danh sách phản hồi < 300ms với ≥ 1000 bản ghi (xem PERF-01); 100% thao tác ghi dữ liệu đi qua validation; 0 ảnh orphaned tồn tại sau lỗi DB.

**Tech context (stack thực tế — đồng bộ CONTEXT.md):** 🆕
- Backend: Node.js + Express (ES6 Modules, `semi: true`), port `3000`.
- Frontend: React + Vite, port `5173`, Tailwind CSS, React Router (`useSearchParams`).
- DB: MongoDB (`MONGO_URI=mongodb://localhost:27017/SWP`), Mongoose.
- Validation: **Joi** 
- Media: Cloudinary (env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- File upload: `multer` (memory/stream, không ghi local).
- Auth: JWT (`verifyToken`, `checkRole('ADMIN')`).

---

## 2. Actors & Roles

| Actor | Mô tả | Permissions |
|---|---|---|
| **CUSTOMER** | Người có/không có account, mua hàng | Xem danh sách, tìm kiếm, lọc, xem chi tiết sản phẩm đang hoạt động (`deleted_at: null`); thêm vào giỏ |
| **SALE** | Nhân viên tư vấn | **Read-only**: xem danh sách + chi tiết, **bao gồm `stock_quantity` thực tế**; không thay đổi dữ liệu |
| **ADMIN** | Quản trị viên | Toàn quyền CRUD (Thêm/Xem/Sửa/Xóa mềm) + upload ảnh |
| **SYSTEM** | Tiến trình tự động | Multer file pipeline, gọi Cloudinary API, truy vấn MongoDB phân trang, kiểm duyệt Joi, tập trung hóa response lỗi |

**Actors KHÔNG thuộc scope module này:** 🆕
- Guest checkout (thuộc Cart/Checkout module).
- Bất kỳ vai trò nào ngoài CUSTOMER/SALE/ADMIN (không phân quyền thêm trong sprint này).

---

## 3. Functional Requirements (EARS Notation)

### 3.1 Ubiquitous (Luôn luôn đúng)
- **EARS-UBI-01:** SYSTEM SHALL tự động loại bỏ khoảng trắng thừa (trim) ở trường `name` và `brand` trước khi lưu vào DB.
- **EARS-UBI-02:** SYSTEM SHALL kiểm duyệt dữ liệu qua schema validation của **Joi** với mọi yêu cầu thêm mới và cập nhật sản phẩm.
- **EARS-UBI-03:** SYSTEM SHALL tuyệt đối không lưu file ảnh trên local server, mà bắt buộc đẩy stream lên Cloudinary và lưu đồng thời `image_url` + `image_public_id`.

### 3.2 Event-driven (Phản ứng với sự kiện)
- **EARS-EVD-01:** WHEN nhận `GET /api/products`, SYSTEM SHALL trích xuất query params (`page`, `limit`, `search`, `minPrice`, `maxPrice`), thực thi phân trang và trả JSON kèm pagination metadata.
- **EARS-EVD-02:** WHEN nhận `POST /api/products` (Multipart Form-data) từ ADMIN, SYSTEM SHALL upload ảnh lên Cloudinary; nếu thành công SHALL lấy URL + Public ID, ghép cùng dữ liệu text đã validate Joi, lưu MongoDB và trả HTTP 201.
- **EARS-EVD-03:** WHEN nhận `PUT /api/products/:id` (Multipart Form-data) từ ADMIN **kèm ảnh mới**, SYSTEM SHALL upload ảnh mới lên Cloudinary, xóa ảnh cũ qua `image_public_id`, cập nhật thông tin và trả HTTP 200.
- **EARS-EVD-03b (làm rõ):** 🆕 WHEN nhận `PUT /api/products/:id` **KHÔNG kèm ảnh mới**, SYSTEM SHALL chỉ cập nhật trường text, **giữ nguyên** `image_url`/`image_public_id` hiện tại và **không** gọi Cloudinary destroy. *(Ch5 Anti-pattern "Implicit Assumption" — verify với code: nhánh update không ảnh.)*
- **EARS-EVD-04:** WHEN nhận `DELETE /api/products/:id` từ ADMIN, SYSTEM SHALL **không** xóa cứng bản ghi, mà SHALL cập nhật `deleted_at` = timestamp hiện tại và trả HTTP 200.
- **EARS-EVD-05:** WHEN quy trình lưu DB thất bại ngay sau khi ảnh đã upload lên Cloudinary, SYSTEM SHALL tự động gọi Cloudinary destroy ảnh đó (Rollback) qua `image_public_id` để tránh orphaned image, sau đó trả HTTP 500 theo cấu trúc SEC-01.
- **EARS-EVD-06 (chi tiết sản phẩm — backend):** WHEN nhận `GET /api/products/:id` cho một sản phẩm `deleted_at: null`, SYSTEM SHALL trả HTTP 200 + object đầy đủ. ✅ *Đã implement: `getProductById` trong controller/service, route `GET /:id` public (không cần auth).*
- **EARS-EVD-07 (chi tiết sản phẩm — frontend):** 🆕 WHEN CUSTOMER click vào ProductCard, SYSTEM SHALL điều hướng sang trang `/products/:id` và render đầy đủ: ảnh lớn, tên, thương hiệu, giá, mô tả, stock status, nút "Thêm vào giỏ" (vô hiệu nếu `stock_quantity = 0`). *(Gap phát hiện 2026-06-21: Actors §2 yêu cầu "xem chi tiết" nhưng T7 chỉ build list/card, không có detail page — xem T8 mới trong TASKS.md.)*

### 3.3 State-driven (Hành vi liên tục trong trạng thái)
- **EARS-STD-01:** WHILE `deleted_at` của Sản phẩm khác `null`, SYSTEM SHALL tự động loại sản phẩm đó khỏi kết quả `GET /api/products` (và detail) dành cho CUSTOMER và SALE.
- **EARS-STD-02:** WHILE `stock_quantity` = 0, SYSTEM SHALL hiển thị nhãn "Hết hàng" (Out of Stock) trên Frontend và chặn hành vi thêm sản phẩm vào giỏ.
- **EARS-STD-03 (sản phẩm ngừng KD trong giỏ):** 🆕 WHILE một sản phẩm trong giỏ có `deleted_at !== null`, Frontend SHALL hiển thị cảnh báo "Sản phẩm đã ngừng kinh doanh" và vô hiệu hóa nút thanh toán. *(Nguồn: CONTEXT.md Q1. Logic thực thi nằm ở Cart module nhưng là hệ quả trực tiếp của soft-delete sản phẩm — ghi vào đây để truy vết.)*

### 3.4 Optional Feature (Khi tính năng/điều kiện được bật) 🆕
*(Ch5 — mẫu Optional bị thiếu hoàn toàn ở bản gốc)*
- **EARS-OPT-01:** WHERE middleware `verifyAdmin` được kích hoạt (môi trường production), THE SYSTEM SHALL chặn mọi thao tác ghi (`POST/PUT/DELETE`) nếu role trong JWT không phải `ADMIN`. ⚠️ Hiện `verifyAdmin` đang được comment để test (xem §10 Known Deviation) — đây là requirement *đích*, phải bật lại trước production.

### 3.5 Prohibitions (SHALL NOT — ràng buộc bắt buộc) 🆕
*(Ch5 §5.3.3 — diễn đạt tường minh các cấm đoán thay vì để ngầm trong prose)*
- **EARS-NOT-01:** SYSTEM SHALL NOT thực hiện hard-delete (xóa cứng) bất kỳ bản ghi sản phẩm nào, ở mọi trạng thái (ràng buộc DATA-01).
- **EARS-NOT-02:** SYSTEM SHALL NOT lưu file ảnh trên local storage của backend.
- **EARS-NOT-03:** SYSTEM SHALL NOT lộ stack trace / chi tiết kỹ thuật nội bộ trong response lỗi ở môi trường production (xem SEC-01).
- **EARS-NOT-04:** SYSTEM SHALL NOT trừ trực tiếp `stock_quantity` thực tế ở giai đoạn giỏ hàng/checkout — việc trừ kho do module Checkout xử lý khi nhận Webhook IPN `SUCCESS` (STOCK-01, §9).

---

## 4. Non-functional Requirements
- **SEC-01:** Response lỗi (400, 403, 404, 415, 500, …) SHALL tuân thủ cấu trúc tập trung qua error-handling middleware, ẩn stack trace ở production:
  `{ success: false, error_code: string, message: string, request_id: string }`.
- **PERF-01:** `GET /api/products` SHALL có response time < 300ms ngay cả khi DB > 1000 bản ghi, nhờ Indexing trên `name` và `brand`.
- **UI/UX-01:** Product Card (CUSTOMER) phải đồng bộ kích thước khung ảnh (Aspect Ratio cố định). Form thêm/sửa của ADMIN phải có Image Preview trước khi Submit.
- **PERF-02 (pagination mặc định):** 🆕 WHERE `page`/`limit` không được cung cấp, SYSTEM SHALL áp giá trị mặc định (`page=1`, `limit` theo cấu hình dự án). *(Verify giá trị default thực tế trong code.)*

---

## 5. Data Model (MongoDB Schema)
Collection `products`:

| Trường | Kiểu | Ràng buộc |
|---|---|---|
| `name` | String | Required, Trim, **Index** |
| `brand` | String | Required, Trim, **Index** |
| `price` | Number | Required, Min: 0 |
| `image_url` | String | Required (link Cloudinary) |
| `image_public_id` | String | Required (ID ảnh Cloudinary) |
| `stock_quantity` | Number | Required, Integer, Min: 0, Default: 0 |
| `description` | String | Optional |
| `deleted_at` | Date | Default: `null` (null = chưa xóa) |
| `created_at` | Date | Tự động (Mongoose timestamps) |
| `updated_at` | Date | Tự động (Mongoose timestamps) |

**Ghi chú index:** 🆕 PLAN.md/PERF-01 mô tả index trên `name` và `brand`; TASKS.md ghi "**compound index** cho name và brand". Hai mô tả khác nhau (2 single index vs 1 compound index) → **verify với code** và thống nhất một cách (ảnh hưởng tới hiệu năng filter). *(Đây là một contradiction nhỏ giữa các artifact — Ch5 Anti-pattern "Contradiction".)*

**Naming Convention (SKU):** 🆕 Do không có bảng Variants (ASSUME-01), ADMIN bắt buộc đặt tên theo `[Tên sản phẩm] - [Màu sắc] - [Kích thước]` để phân biệt biến thể.

---

## 6. State Model — Formal (State Diagram + Transitions + Invariants) 🆕
*(Ch5 §5.4.4 — Level **Formal** BẮT BUỘC có State Diagram. Bản gốc ghi "Level: Formal" nhưng thiếu phần này — đây là gap lớn nhất thầy nhắc.)*

### 6.1 STATE DIAGRAM — Vòng đời Sản phẩm
```
        ADMIN POST /api/products
                 │
                 ▼
            [ ACTIVE ]  (deleted_at = null)
             │      ▲
   PUT /:id  │      │  PUT /:id (cập nhật field, vẫn ACTIVE)
 (update) ───┘      └───────────────┐
             │                      │
             │ ADMIN DELETE /:id     (self-loop)
             ▼
        [ SOFT_DELETED ]  (deleted_at = <timestamp>)
             │
             ▼
   (restore) ─── KHÔNG hợp lệ ở Phase 1 → Phase 2 (Thùng rác)

  Sub-state hiển thị (trực giao với vòng đời, theo stock_quantity):
     [ IN_STOCK ] (qty > 0)  ⇄  [ OUT_OF_STOCK ] (qty = 0)
```

### 6.2 VALID TRANSITIONS (chỉ các transition này hợp lệ)
- `(none) → ACTIVE`: ADMIN tạo sản phẩm (EARS-EVD-02).
- `ACTIVE → ACTIVE`: ADMIN cập nhật field/ảnh (EARS-EVD-03 / 03b).
- `ACTIVE → SOFT_DELETED`: ADMIN xóa mềm (EARS-EVD-04).

### 6.3 INVALID TRANSITIONS (cấm tường minh)
- Hard-delete ở bất kỳ trạng thái → **cấm** (EARS-NOT-01).
- `SOFT_DELETED → ACTIVE` (restore) → **không hợp lệ ở Phase 1** (Thùng rác/restore là Out of Scope, §8).

### 6.4 INVARIANTS (luôn đúng ở mọi trạng thái)
- **INV-01:** `image_url` và `image_public_id` luôn tồn tại đồng thời (không bao giờ có cái này thiếu cái kia).
- **INV-02:** `price ≥ 0`; `stock_quantity` là số nguyên `≥ 0`.
- **INV-03:** `deleted_at` chỉ chuyển một chiều `null → timestamp` trong Phase 1.
- **INV-04:** Không bản ghi nào bị xóa cứng (DATA-01).
- **INV-05:** Mọi response lỗi tuân theo cấu trúc SEC-01 và kèm `request_id`.

---

## 7. Error Handling (Unwanted Patterns)
- **ERR-01:** WHERE request `POST/PUT/DELETE` mà role trong JWT không phải ADMIN, SYSTEM SHALL chặn và trả HTTP **403 Forbidden** (qua `verifyAdmin` — xem §10).
- **ERR-02:** WHERE dữ liệu đầu vào vi phạm schema (price < 0, stock không phải số nguyên, thiếu trường bắt buộc, …), SYSTEM SHALL trả HTTP **400 Bad Request** kèm message lỗi từ Joi.
- **ERR-03:** WHERE file upload sai định dạng (không phải jpg/jpeg/png/webp) hoặc > 5MB, SYSTEM SHALL từ chối và trả HTTP **415 Unsupported Media Type** (hoặc 400).
- **ERR-04 (không tồn tại):** 🆕 WHERE `GET /:id` / `PUT /:id` / `DELETE /:id` với `id` không tồn tại hoặc đã `deleted_at !== null` (với endpoint dành cho CUSTOMER/SALE), SYSTEM SHALL trả HTTP **404 Not Found** theo cấu trúc SEC-01. *(Bản gốc không có 404 — gap chuẩn REST, verify với code.)*
- **ERR-05 (id sai định dạng):** 🆕 WHERE `:id` không phải ObjectId hợp lệ, SYSTEM SHALL trả HTTP **400** (không để Mongoose ném lỗi 500 lộ stack). *(Verify với code.)*
- **ERR-06 (Cloudinary lỗi khi upload):** 🆕 WHERE upload Cloudinary thất bại (timeout/lỗi mạng) trong `POST`/`PUT`, SYSTEM SHALL dừng quy trình, không lưu DB, trả HTTP 500 theo SEC-01. *(Phân biệt với EARS-EVD-05 là lỗi DB *sau* khi ảnh đã lên.)*

> **Tỷ lệ Unwanted:** 6 ERR + EARS-EVD-05 + 4 SHALL NOT ≈ chiếm > 30% tổng requirement → đạt ngưỡng "đủ nghĩ về error handling" của Ch5 §5.3.2. *(Bản gốc chỉ 3 ERR + 1 rollback → dưới ngưỡng, đúng như review của thầy.)*

---

## 8. Acceptance Criteria (Given-When-Then + Traceability) 🆕
*(Ch5 §5.2 — AC phải testable, có boundary values, map về EARS requirement & test case)*

| # | Given / When / Then | EARS ref | Test gợi ý | Status |
|---|---|---|---|---|
| AC-01 | GIVEN > 1000 sản phẩm · WHEN `GET /api/products?page=1` · THEN trả Grid + pagination metadata, < 300ms | EVD-01, PERF-01 | `test_list_pagination_perf` | [x] |
| AC-02 | GIVEN ADMIN + ảnh hợp lệ · WHEN `POST /api/products` · THEN HTTP 201, ảnh trên Cloudinary, DB lưu `image_url`+`image_public_id` | EVD-02, UBI-03 | `test_create_product_with_image` | [x] |
| AC-03 | GIVEN sản phẩm tồn tại · WHEN ADMIN `DELETE /:id` · THEN HTTP 200, biến mất khỏi list khách nhưng `deleted_at` có timestamp trong DB | EVD-04, STD-01, NOT-01 | `test_soft_delete` | [x] |
| AC-04 | GIVEN price = -1 hoặc stock = -1 · WHEN submit · THEN 400 Validation, không lưu DB | ERR-02, INV-02 | `test_reject_negative_values` | [x] |
| AC-05 | GIVEN bất kỳ lỗi server · WHEN response · THEN cấu trúc `{success,error_code,message,request_id}` | SEC-01 | `test_error_envelope` | [x] |
| AC-06 🆕 | GIVEN `price = 0` (boundary) · WHEN tạo · THEN **chấp nhận** (Min: 0 inclusive) | INV-02 | `test_price_zero_ok` | [ ] verify |
| AC-07 🆕 | GIVEN file = 5MB (boundary) chấp nhận, 5.01MB từ chối · WHEN upload · THEN tương ứng OK / 415 | ERR-03 | `test_file_size_boundary` | [ ] verify |
| AC-08 🆕 | GIVEN file `.gif`/`.exe` · WHEN upload · THEN 415 | ERR-03 | `test_file_type_reject` | [ ] verify |
| AC-09 🆕 | GIVEN DB sập sau upload ảnh · WHEN `POST` · THEN Cloudinary destroy được gọi, 0 orphaned image | EVD-05 | `test_rollback_on_db_fail` | [ ] verify |
| AC-10 🆕 | GIVEN id không tồn tại · WHEN `GET/PUT/DELETE /:id` · THEN 404 | ERR-04 | `test_not_found_404` | [x] ✅ backend |
| AC-11 🆕 | GIVEN non-ADMIN (production) · WHEN ghi dữ liệu · THEN 403 | ERR-01, OPT-01 | `test_role_gate_403` | [x] ✅ backend |
| AC-12 🆕 | GIVEN stock = 0 · WHEN render card · THEN nhãn "Hết hàng" + chặn add-to-cart | STD-02 | `test_out_of_stock_ui` | [x] ✅ frontend |
| AC-13 🆕 | GIVEN CUSTOMER click ProductCard · WHEN navigate `/products/:id` · THEN render trang chi tiết: ảnh, tên, giá, mô tả, stock, nút giỏ hàng | EVD-07 | `test_product_detail_page` | [ ] pending T8 |

---

## 9. Dependencies & Integration Points 🆕
*(Ranh giới với các module khác — giúp người/AI không tự ý lấn scope)*
- **Auth/JWT module:** cung cấp `verifyToken`, `checkRole('ADMIN')`. Module này *tiêu thụ*, không định nghĩa.
- **Cloudinary:** lưu trữ media. Mất kết nối → ERR-06 / Rollback EVD-05.
- **Cart module:** đọc trạng thái `deleted_at` để cảnh báo (EARS-STD-03).
- **Checkout / VNPay module (STOCK-01):** sở hữu logic Stock Reservation (`PENDING_PAYMENT`, TTL 15', rollback). Module Product **chỉ** giữ `stock_quantity`; **không** trừ kho trực tiếp (EARS-NOT-04). Nằm **ngoài** scope spec này.

---

## 10. Known Deviations & Open Items ⚠️ 🆕
*(Ghi lại trung thực sai lệch giữa spec-đích và hiện trạng — Ch6 "Validation: code ↔ spec")*
- **DEV-01 — `verifyAdmin` đang bị comment:** ~~tạm thời comment để test~~ **RESOLVED (2026-06-20):** đã bật lại `verifyToken + checkRole('ADMIN')` cho tất cả route POST/PUT/DELETE trong `productRoutes.js`.
- **DEV-02 — Joi vs Zod:** CONTEXT.md (CODE-01) yêu cầu **Zod**, nhưng PLAN/SPEC/TASKS dùng **Joi**. **Action:** thống nhất một thư viện trong CONTEXT để tránh "Moving Target" (Ch5 Anti-pattern 5).
- **DEV-03 — index single vs compound:** **RESOLVED (2026-06-20):** Giữ **2 single indexes** (`name`, `brand`) — đúng với query `$or: [{ name: regex }, { brand: regex }]`. Compound index `{ name, brand }` không hiệu quả với `$or` trên từng field riêng lẻ; MongoDB dùng index intersection, mỗi branch dùng đúng 1 index.
- **DEV-04 — Frontend Product Detail Page bị thiếu (gap mới - 2026-06-21):** ⚠️ Actors §2 yêu cầu CUSTOMER "xem chi tiết sản phẩm" nhưng **T7 chỉ build grid/card list, không có trang `/products/:id`**. Backend endpoint `GET /api/products/:id` đã sẵn sàng (✅). **Action:** Bổ sung T8 vào TASKS.md để build `ProductDetailPage.jsx` + route + link từ ProductCard.

---

## 11. Out of Scope
- **OOS-01:** KHÔNG hỗ trợ quản lý biến thể sản phẩm (Variants — SKU theo màu/cỡ). *(Lý do: ASSUME-01, dùng Naming Convention thay thế.)*
- **OOS-02:** KHÔNG hỗ trợ Đánh giá / Bình luận (Rating & Review) ở giai đoạn này.
- **OOS-03:** 🆕 KHÔNG xây giao diện "Thùng rác" / khôi phục sản phẩm soft-deleted → **Phase 2**. Giai đoạn này chỉ set `deleted_at` để ẩn khỏi UI. *(Nguồn: PLAN.md Q2.)*
- **OOS-04:** 🆕 KHÔNG xử lý Stock Reservation/trừ kho — thuộc Checkout module (§9).
- **OOS-05:** 🆕 KHÔNG có import hàng loạt (CSV/Google Sheets) trong sprint này.

### Boundary conditions — AI/Dev KHÔNG được tự quyết 🆕
- KHÔNG tự thêm bảng/collection Variants.
- KHÔNG đổi cấu trúc response lỗi SEC-01.
- KHÔNG lưu ảnh local (luôn qua Cloudinary).
- KHÔNG hard-delete dưới bất kỳ hình thức nào.
- KHÔNG tự ý trừ `stock_quantity` ngoài luồng Checkout đã định.
