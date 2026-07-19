# Feature: Trang sản phẩm & Biến thể (Store & Products) — SPECIFICATION

**Status:** Approved (đồng bộ với code thực tế)
**Author:** AI Agent | **Tech Lead Approval:** —
**Date:** 2026-07-19
**Risk Level:** Medium (public read API + write API phân quyền MANAGER/ADMIN, upload file cục bộ)
**Related Specs:** `feature-cart`, `feature-checkout`, `feature-auth`, `feature-admin-dashboard`
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

> **Ghi chú phiên bản:** Spec này được viết lại từ code hiện có để phản ánh đúng
> hành vi thực tế. Các điểm khác biệt so với bản trước được đánh dấu **[REALITY]**.
> **2026-07-19:** Đã triển khai các fix OQ-1, 3, 4, 5, 6, 7, 8, 9 (xem Phụ lục C) —
> spec dưới đây mô tả hành vi **sau** fix; các mục đã vá đánh dấu **[ĐÃ VÁ]**.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

Trang sản phẩm là bộ mặt của cửa hàng Optics Management: khách hàng duyệt, tìm kiếm và lọc gọng kính/kính mát; quản lý cửa hàng CRUD sản phẩm và các biến thể vật lý (SKU) để đồng bộ tồn kho.

**Pain point:**
- Gọng kính có nhiều kích cỡ vật lý (lens width / bridge width / temple length) và màu sắc; nếu không tách biến thể riêng, khách rất dễ mua nhầm size và cửa hàng dễ bán khống hàng đã hết.
- Tròng kính (`LENS`) là sản phẩm "phụ kiện đi kèm" — nếu hiển thị lẫn trong danh mục chung sẽ gây nhiễu trải nghiệm mua gọng.

**Mục tiêu:**
- Một API danh sách duy nhất `GET /api/products` phục vụ cả Khách (chỉ hàng `ACTIVE`, ẩn `LENS`) lẫn Manager (xem tất cả qua `status=ALL`).
- Tách hai collection `products` (dòng sản phẩm) và `product_variants` (SKU vật lý mang tồn kho `quantity`) theo **ADR-002** (Mongoose ODM).
- Tồn kho nằm ở **variant**, không nằm ở product — checkout trừ kho trên variant, job dọn đơn PENDING quá hạn hoàn kho lại variant (xem `feature-checkout`).

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Products |
| :--- | :--- | :--- |
| **Khách vãng lai / CUSTOMER** | Người mua | Đọc công khai (KHÔNG cần token): danh sách và chi tiết **chỉ với hàng `ACTIVE`**, danh sách biến thể. |
| **MANAGER / ADMIN** | Quản trị kho | Toàn quyền CRUD product + variant (`POST/PUT/DELETE`), yêu cầu JWT `Authorization: Bearer` (ADR-001) + `requireRole(['MANAGER','ADMIN'])`. |
| **SALE / SHIPPER** | Nhân viên khác | Chỉ đọc như khách — mọi request ghi bị chặn 403. |
| **Hệ thống Checkout** | Internal | `PricingService.priceOrderItem` đọc variant làm source-of-truth về giá; `OrderController` trừ/hoàn `variant.quantity`. Ngoài scope spec này. |

**[ĐÃ VÁ — OQ-1]** Route đọc gắn `optionalAuthenticate`: có token MANAGER/ADMIN hợp lệ thì `req.user` xác định quyền staff (thấy `INACTIVE` + `LENS`); khách vãng lai hoặc token hỏng luôn bị khóa ở `ACTIVE`. Cờ `isManager` đã bị gỡ khỏi cả backend lẫn FE.

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> Nguồn hành vi: `src/backend/routes/product.routes.js`, `controllers/ProductController.js`,
> `controllers/ProductVariantController.js`, `models/Product.js`, `models/ProductVariant.js`,
> FE: `pages/ProductsPage.jsx`, `pages/ProductDetailPage.jsx`,
> `feature/product/components/ProductForm.jsx`,
> `feature/manager/page/products/ProductManagePage.jsx`, `ProductVariantManagePage.jsx`.

### 3.1 Ubiquitous (Luôn luôn đúng)
- **U-1:** THE hệ thống SHALL sort danh sách sản phẩm ở phía server: mặc định `createdAt` giảm dần (mới nhất trước); WHERE `sortBy` thuộc whitelist (`price-asc` | `price-desc`), SHALL sort theo `price` gốc tương ứng (OQ-5).
- **U-2:** THE hệ thống SHALL phân trang bằng `page`/`limit`. **[REALITY]** Query param `page` là **1-based** (mặc định `1`, `limit=10`); nhưng field `page` trong response là **0-based** (`page - 1`) và `size` = số item thực trả về của trang hiện tại (không phải `limit`).
- **U-3:** THE hệ thống SHALL phục vụ ảnh upload dưới static route `/uploads` (`express.static`), FE tự nối `VITE_API_URL` + đường dẫn tương đối khi hiển thị.
- **U-4:** THE hệ thống SHALL lưu tồn kho (`quantity`) duy nhất trên `ProductVariant`; `Product` KHÔNG có trường tồn kho.

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

**Đọc (public):**
- **E-1:** WHEN client gọi `GET /api/products` kèm query (`search`, `category`, `brand`, `gender`, `shape`, `frameMaterial`, `frameType`, `minPrice`, `maxPrice`, `status`, `sortBy`), THE hệ thống SHALL trả 200 `{ code: 0, result: { items, page, size, totalElements, totalPages } }` với:
  - `search`: regex không phân biệt hoa thường trên `name` **OR** `brand`.
  - `brand`/`shape`/`frameMaterial`: regex i-case; `frameType`: khớp chính xác; `gender`: tự uppercase trước khi so.
  - **[ĐÃ VÁ — OQ-8]** Mọi input đưa vào `$regex` (`search`, `brand`, `shape`, `frameMaterial`) được `escapeRegex` trước để chặn pattern injection/ReDoS.
  - `sortBy`: whitelist `newest` (mặc định) | `price-asc` | `price-desc` — giá trị lạ rơi về `newest` (OQ-5).
  - `minPrice`/`maxPrice`: lọc trên trường `price` gốc của Product. **By design:** không xét `discountPrice` vì tính năng giảm giá không thuộc phạm vi dự án (xem Out of Scope).
- **E-2:** WHILE request không có quyền staff (không token hoặc role ngoài MANAGER/ADMIN), THE hệ thống SHALL **luôn khóa** lọc `status = 'ACTIVE'` bất kể client gửi gì; WHILE request có quyền staff: `status=ALL` → bỏ lọc trạng thái, `status=<giá trị>` → lọc đúng giá trị, không truyền → `ACTIVE`. **[ĐÃ VÁ — OQ-1]**
- **E-3:** WHEN client KHÔNG truyền `category` VÀ request không có quyền staff, THE hệ thống SHALL loại `category: LENS` khỏi kết quả (`$ne`); staff không truyền `category` thấy tất cả. Truyền đích danh `category=LENS` (popup chọn tròng của `ProductForm` gọi `?category=LENS&limit=100`) vẫn công khai như cũ.
- **E-4:** WHEN client gọi `GET /api/products/:id` với ID tồn tại, THE hệ thống SHALL trả 200 **đối tượng Product trực tiếp** (KHÔNG bọc `{code, result}` — FE đọc `response.data.result || response.data` để tương thích). **[REALITY]** WHERE product đang `INACTIVE` VÀ requester không phải staff, SHALL trả 404 `NOT_FOUND` để không lộ sản phẩm đã ngừng bán. **[ĐÃ VÁ — OQ-4]**
- **E-5:** WHEN client gọi `GET /api/products/:productId/variants`, THE hệ thống SHALL trả 200 `{ success: true, result: [variants] }` — mảng mọi variant thuộc product (không lọc status). **[REALITY]** Sub-route variants dùng envelope `{success}`, khác envelope `{code: 0}` của product.

**Ghi (MANAGER/ADMIN, JWT bắt buộc):**
- **E-6:** WHEN nhân viên gửi `POST /api/products` dạng `multipart/form-data` (field `product` = JSON string + field `files` = mảng ảnh), THE hệ thống SHALL parse JSON, validate `name`/`brand`/`price` bắt buộc, lưu file qua multer vào `uploads/` (tên `<timestamp>-<random><ext>`), map mỗi file thành `{ imageUrl: '/uploads/<filename>' }`, ép kiểu `price`/`discountPrice`/`weightGram` sang Number, tạo bản ghi và trả 201 `{ code: 0, result: product }`.
- **E-7:** WHERE không có file nào VÀ `imageUrl` trong payload rỗng khi tạo mới, THE hệ thống SHALL gán 1 ảnh placeholder Unsplash mặc định. **[REALITY]**
- **E-8:** WHEN nhân viên gửi `PUT /api/products/:id` (cùng format multipart), THE hệ thống SHALL `findByIdAndUpdate` với `runValidators: true` và trả 200 `{ code: 0, result }`. **[REALITY — cạm bẫy]** Nếu payload KHÔNG gửi lại mảng `imageUrl` hiện có, hệ thống set `imageUrl = []` trước khi merge file mới → **ảnh cũ bị xóa sạch**. Client bắt buộc gửi lại danh sách ảnh muốn giữ.
- **E-9:** WHEN nhân viên gửi `DELETE /api/products/:id`, THE hệ thống SHALL hard-delete bản ghi, **cascade xóa toàn bộ variants** của nó (`deleteMany({productId})`) và best-effort xóa các file ảnh cục bộ `/uploads/...` của cả product lẫn variants (bỏ qua lỗi I/O và URL ngoài), rồi trả 200 `{ code: 0, message }`. **[ĐÃ VÁ — OQ-3]**
- **E-10:** WHEN nhân viên gửi `POST /api/products/:productId/variants` (field `variant` = JSON string + `files`), THE hệ thống SHALL kiểm tra product cha tồn tại (404 nếu không), ép kiểu số các trường đo (`lensWidthMm`, `bridgeWidthMm`, `templeLengthMm`, `price`, `quantity` — thiếu thì mặc định `0`), và trả 201 `{ success: true, result: variant }`.
- **E-11:** WHEN nhân viên gửi `PUT /api/products/:productId/variants/:variantId`, THE hệ thống SHALL cập nhật theo `variantId`. **[REALITY]** `productId` trong URL bị **bỏ qua** (không verify variant thuộc product đó); và tương tự E-8, không gửi lại `imageUrl` → ảnh variant bị xóa.
- **E-12:** WHEN nhân viên gửi `DELETE /api/products/:productId/variants/:variantId`, THE hệ thống SHALL hard-delete variant và trả 200 `{ success: true, message }` — KHÔNG kiểm tra variant còn nằm trong đơn hàng đang xử lý (checkout đã có fallback, xem `PricingService`).

### 3.3 State-driven (Khi ở trạng thái)
- **S-1:** WHILE sản phẩm ở trạng thái `INACTIVE`, THE trang danh sách khách hàng (`ProductsPage` gọi `status: 'ACTIVE'`) SHALL không hiển thị sản phẩm đó; truy cập trực tiếp `GET /:id` VẪN trả về được (không chặn theo status — xem OQ-4).
- **S-2:** WHILE variant đang chọn có `quantity <= 0`, THE `ProductForm` SHALL disable nút "Thêm vào giỏ hàng", hiển thị "Sản phẩm tạm hết hàng" và badge "Hết hàng" đỏ trên từng dòng variant (kèm làm mờ `opacity-60 grayscale`).
- **S-3:** WHILE product KHÔNG có variant nào trong DB, THE `ProductForm` SHALL tự dựng 1 "variant mặc định" phía client với `quantity: 0` → hiển thị như hết hàng, chặn add-to-cart. **[REALITY]** Đây là guard FE, không phải dữ liệu server.
- **S-4:** WHILE variant có `orderItemType = 'PRE_ORDER'`, THE `ProductForm` SHALL hiển thị nhãn "Đặt trước" (vs "Có sẵn" cho `IN_STOCK`).
- **S-5:** WHILE bản ghi có sẵn `discountPrice < price` (dữ liệu tồn dư — không có tính năng quản lý giảm giá), THE FE SHALL hiển thị giá gạch (`price`) + giá bán (`discountPrice`); giá hiển thị ưu tiên `discountPrice || price`. Đây là khả năng hiển thị thụ động của FE, không phải feature giảm giá.

### 3.4 Optional / Where (Tùy chọn)
- **O-1:** WHERE khách đổi kiểu sắp xếp trên `ProductsPage`, THE FE SHALL gửi `sortBy` lên server và reset về trang 1 — thứ tự đúng trên **toàn bộ** kết quả, không chỉ trang hiện tại. **[ĐÃ VÁ — OQ-5]**
- **O-2:** WHERE URL vào trang có sẵn `?category=`, `?gender=`, `?search=` (deep-link từ Header/Trang chủ), THE `ProductsPage` SHALL khởi tạo bộ lọc từ query string và reset về trang 1.

### 3.5 Unwanted (Lỗi / Edge Case)
- **N-1:** WHERE `GET /:id` với ID không tồn tại (hoặc `INACTIVE` với khách), THE hệ thống SHALL trả 404 `{ error_code: 'NOT_FOUND' }`; ID sai định dạng ObjectId → 400 `{ error_code: 'INVALID_ID' }` (CastError được map ở `errorHandler`). FE hiển thị màn "Không tìm thấy sản phẩm" + nút quay lại cửa hàng cho mọi lỗi fetch.
- **N-2:** WHERE `POST /api/products` thiếu `name`/`brand`/`price`, THE hệ thống SHALL trả 400 `{ error_code: 'VALIDATION_ERROR', message: 'Thiếu thông tin bắt buộc...' }`.
- **N-3:** WHERE request ghi không có token / token hỏng, THE `authenticate` SHALL trả 401 `{ error_code: 'UNAUTHORIZED' }`; đúng token nhưng sai role → 403 `{ error_code: 'FORBIDDEN' }`; tài khoản bị khóa (`deleted_at != null`) → 403.
- **N-4:** WHERE lỗi bất kỳ trong controller, THE hệ thống SHALL đẩy qua `next(error)` về `errorHandler` trung tâm và trả `{ error_code, message }` theo CONSTITUTION Điều 5: Mongoose `ValidationError` → 400 `VALIDATION_ERROR`; `CastError` → 400 `INVALID_ID`; JSON hỏng (`JSON.parse` field `product`/`variant`) → 400 `INVALID_JSON`; còn lại → 500 `INTERNAL_ERROR`. **[ĐÃ VÁ — OQ-6]**
- **N-5:** WHERE file upload vượt 10MB, THE multer SHALL từ chối → 400 `FILE_TOO_LARGE`; WHERE mimetype ngoài PNG/JPEG/WEBP → 400 `INVALID_FILE_TYPE`; tối đa 10 file/request. File lưu dạng `<timestamp>-<random><ext>` — **giữ extension** để static route `/uploads` trả đúng `Content-Type`. **[ĐÃ VÁ — OQ-7]**

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

### 4.1 Performance
- `GET /api/products`: 2 query Mongo (`countDocuments` + `find.skip.limit`) — chấp nhận với catalog nhỏ (< vài nghìn SP). Chưa có index cho `search` regex (full scan) — chấp nhận ở quy mô hiện tại.
- Trang khách tải `limit=9`/trang; popup tròng kính tải 1 lần `limit=100`.
- Mục tiêu phản hồi API đọc `< 300ms` (P95, local/sandbox).

### 4.2 Security
- Write route bảo vệ 2 lớp: `authenticate` (JWT — ADR-001) → `requireRole(['MANAGER','ADMIN'])`. Kiểm tra role tại route level theo CONSTITUTION Điều 3.
- Toàn bộ truy vấn qua Mongoose query builder, không raw string (Điều 3); user input được `escapeRegex` trước khi vào `$regex` (OQ-8 — đã vá).
- Upload giới hạn 10MB/file, tối đa 10 file, chỉ PNG/JPEG/WEBP qua `fileFilter` (OQ-7 — đã vá).
- Đọc là public by-design (chỉ catalog `ACTIVE`); dữ liệu `INACTIVE` chỉ hiển thị cho staff xác thực qua JWT (`optionalAuthenticate` — OQ-1).

### 4.3 Scalability & Storage
- Ảnh lưu đĩa cục bộ `uploads/` + serve qua `/uploads` static — không dùng CDN/cloud storage. Scale ngang sẽ cần shared volume (đã ghi Out of Scope).

### 4.4 Consistency
- Envelope không đồng nhất giữa product (`{code: 0}`), variants (`{success: true}`) và `GET /:id` (bare object) — đã hợp thức hóa trong CONSTITUTION Điều 5 ("một số API GET trả trực tiếp"), FE có adapter đọc đa định dạng (`ProductManagePage.rawProducts`).

---

## 5. Data Model (Mô hình dữ liệu)

Hai collection độc lập, quan hệ 1-N qua `productId` (ref) — theo CONTEXT constraint.

### 5.1 Collection `products` — `src/backend/models/Product.js`

| Field | Type | Ràng buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| `name` | String | **required**, trim | Tên dòng sản phẩm |
| `brand` | String | **required**, trim | Thương hiệu |
| `price` | Number | **required**, min 0 | Giá niêm yết |
| `discountPrice` | Number | min 0, optional | Giá khuyến mãi |
| `imageUrl` | [{ imageUrl: String }] | default `[]` | Mảng sub-document ảnh |
| `description` | String | default `''` | |
| `category` | String enum | `FRAME` \| `SUNGLASSES` \| `LENS`, **required**, default `FRAME` | `LENS` bị ẩn khỏi danh mục chung (E-3) |
| `frameType`, `gender`, `shape`, `frameMaterial`, `hingeType`, `nosePadType` | String | default `''` | Thả lỏng để `LENS` nhận chuỗi rỗng |
| `weightGram` | Number | min 0, default 0 | |
| `status` | String enum | `ACTIVE` \| `INACTIVE`, default `ACTIVE` | Soft-hide, không phải soft-delete |
| `timestamps` | | auto | `createdAt` dùng để sort U-1 |

**[REALITY]** KHÔNG có trường `stock_quantity` trên Product (đã gỡ — comment trong `createProduct`). CONSTITUTION Điều 4 còn liệt kê `stock_quantity` là mô tả cũ.

### 5.2 Collection `product_variants` — `src/backend/models/ProductVariant.js`

| Field | Type | Ràng buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| `productId` | ObjectId ref `Product` | **required** | Không có FK cứng — product xóa thì variant mồ côi (E-9) |
| `sku` | String | trim, default `''` | Mã SKU tùy chọn |
| `colorName`, `frameFinish`, `sizeLabel` | String | default `''` | Định danh hiển thị variant |
| `lensWidthMm`, `bridgeWidthMm`, `templeLengthMm` | Number | **required** | Thông số đo gọng (controller fallback `0` nếu thiếu) |
| `price` | Number | **required**, min 0 | Giá riêng của variant — **checkout dùng giá này**, không dùng giá client gửi (LESSON-002) |
| `discountPrice` | Number | min 0, optional | |
| `quantity` | Number | **required**, min 0, default 0 | **Tồn kho thực** — trừ khi tạo đơn, hoàn khi hủy đơn PENDING quá 15' |
| `status` | String enum | `ACTIVE` \| `INACTIVE`, default `ACTIVE` | |
| `orderItemType` | String enum | `IN_STOCK` \| `PRE_ORDER`, default `IN_STOCK` | Nhãn "Có sẵn"/"Đặt trước" |
| `imageUrl` | [{ imageUrl: String }] | default `[]` | Ảnh riêng theo màu |
| `timestamps` | | auto | |

### 5.3 Contract với các feature khác
- **Cart (client-only):** `ProductForm` build cart item với `productId`, `variantId`, `price` (chỉ hiển thị), đọc `variant.quantity` để chặn hết hàng. Quick-add ở `ProductsPage` **không có `variantId`** (gửi `productId` làm định danh) — checkout xử lý nhờ fallback dưới.
- **Checkout/Pricing:** `PricingService.priceOrderItem` tìm `ProductVariant.findById(variantId)`; nếu miss → fallback `findOne({ productId: <id>, status: 'ACTIVE' })` (đỡ được luồng quick-add). Giá cuối luôn lấy từ DB.
- **Ảnh hiển thị:** FE ưu tiên `variant.imageUrl[0]` → `product.imageUrl[0]` → placeholder Unsplash; đường dẫn tương đối được nối `VITE_API_URL`.

---

## 6. Error Handling (Xử lý lỗi)

Toàn bộ lỗi đi qua `errorHandler` trung tâm, format thống nhất `{ error_code, message }` (OQ-6). Envelope **success** giữ nguyên như cũ (`{code: 0}` cho product, `{success: true}` cho variants, bare object cho `GET /:id`).

| Mã | Endpoint | Tình huống | HTTP | `error_code` |
| :--- | :--- | :--- | :--- | :--- |
| **PROD-E01** | `GET /:id` | ID không tồn tại, hoặc `INACTIVE` với khách | 404 | `NOT_FOUND` |
| **PROD-E02** | `GET /:id` | ID sai định dạng ObjectId | 400 | `INVALID_ID` |
| **PROD-E03** | `POST /` | Thiếu name/brand/price | 400 | `VALIDATION_ERROR` |
| **PROD-E04** | Mọi route ghi | Không token / token hết hạn | 401 | `UNAUTHORIZED` |
| **PROD-E05** | Mọi route ghi | Sai role (CUSTOMER/SALE/SHIPPER) | 403 | `FORBIDDEN` |
| **PROD-E06** | `POST /` `PUT /:id` | JSON field `product` hỏng / lỗi Mongoose validation | 400 | `INVALID_JSON` \| `VALIDATION_ERROR` |
| **PROD-E07** | `PUT /:id` `DELETE /:id` | Product không tồn tại | 404 | `NOT_FOUND` |
| **PROD-E08** | Route ghi có upload | File vượt 10MB | 400 | `FILE_TOO_LARGE` |
| **PROD-E09** | Route ghi có upload | Mimetype ngoài PNG/JPEG/WEBP | 400 | `INVALID_FILE_TYPE` |
| **VAR-E01** | `POST /:productId/variants` | Product cha không tồn tại | 404 | `NOT_FOUND` |
| **VAR-E02** | `PUT/DELETE .../:variantId` | Variant không tồn tại | 404 | `NOT_FOUND` |
| **VAR-E03** | Bất kỳ | Lỗi server khác | 500 | `INTERNAL_ERROR` |

FE feedback: `ProductsPage` hiện panel lỗi + nút "Thử lại"; `ProductDetailPage` hiện màn 404 thân thiện; trang Manager dùng toast (`sonner`) cho mọi mutation.

### 6.1 Edge Cases & Corner Cases
- **EC-1:** **[ĐÃ VÁ — OQ-3]** Xóa product giờ cascade xóa variants + dọn file ảnh cục bộ. Lưu ý còn lại: `OrderItem.variant_id` của đơn cũ trỏ tới variant đã xóa → màn refund tra variant sẽ không thấy; lịch sử đơn vẫn giữ snapshot `unitPrice` nên không mất dữ liệu tài chính (cân nhắc dài hạn: chặn xóa cứng khi đã có đơn tham chiếu — xem OQ-3).
- **EC-2:** `PUT` product/variant không gửi lại `imageUrl` cũ → mất toàn bộ ảnh cũ (E-8, E-11). Client quản lý phải luôn gửi mảng ảnh giữ lại.
- **EC-3:** `PUT` variant với `productId` URL không khớp variant → vẫn update thành công (chỉ tra theo `variantId`). **[REALITY]**
- **EC-4:** Product không có variant → FE dựng variant mặc định `quantity: 0` → hiển thị "Hết hàng", không mua được (S-3). Server không tự chặn.
- **EC-5:** Variant bị xóa sau khi khách đã bỏ vào giỏ → checkout trả `VARIANT_NOT_FOUND` hoặc fallback sang variant ACTIVE khác của cùng product (PricingService) — xử lý ở `feature-checkout`.
- **EC-6:** `minPrice`/`maxPrice` lọc trên `price` gốc, bỏ qua `discountPrice` — chấp nhận by-design vì không làm tính năng giảm giá (OQ-2 đã đóng).
- **EC-7:** **[ĐÃ VÁ — OQ-1]** Khách gọi tay `?status=ALL`/`?isManager=true` vẫn chỉ nhận hàng `ACTIVE` không-LENS; quyền staff suy từ JWT, cờ client bị bỏ qua.
- **EC-8:** **[ĐÃ VÁ — OQ-7]** Upload giới hạn 10MB + whitelist mimetype; file mới giữ extension. File upload từ trước (tên hash không extension) vẫn serve được nhưng thiếu `Content-Type` chuẩn — chấp nhận, không migrate.

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu — Given/When/Then)

- **AC-1 (Danh sách mặc định):** *Given* DB có sản phẩm `ACTIVE`, `INACTIVE` và `LENS`, *When* `GET /api/products` không query, *Then* 200 và `items` chỉ chứa `ACTIVE` + không có `LENS`; envelope `{ code: 0, result: { items, page, size, totalElements, totalPages } }` với `page = 0`.
- **AC-2 (Lọc & tìm kiếm):** *Given* sản phẩm brand "Gucci" giá 2tr, *When* `GET /api/products?search=guc&minPrice=1000000&maxPrice=3000000`, *Then* sản phẩm xuất hiện trong `items` (search khớp cả `name` lẫn `brand`, không phân biệt hoa thường).
- **AC-3 (Phân trang):** *Given* 15 sản phẩm ACTIVE, *When* `?page=2&limit=10`, *Then* `items.length = 5`, `page = 1`, `totalElements = 15`, `totalPages = 2`.
- **AC-4 (Lấy LENS đích danh):** *When* `?category=LENS`, *Then* trả về các sản phẩm tròng kính (không bị ẩn).
- **AC-5 (Chi tiết):** *When* `GET /api/products/:id` hợp lệ, *Then* 200 trả **bare object** Product; ID không tồn tại → 404 `NOT_FOUND`; ID sai định dạng → 400 `INVALID_ID`; product `INACTIVE` không kèm token staff → 404.
- **AC-6 (Tạo sản phẩm):** *Given* token MANAGER, *When* `POST /api/products` multipart (`product` JSON + 2 `files`), *Then* 201 `{ code: 0, result }`, `result.imageUrl` có 2 entry `/uploads/...`, file tồn tại trên đĩa và truy cập được qua static route.
- **AC-7 (Tạo thiếu trường):** *When* `POST` thiếu `brand`, *Then* 400 và KHÔNG có bản ghi mới.
- **AC-8 (Phân quyền):** *When* `POST /api/products` không token, *Then* 401 `error_code: UNAUTHORIZED`; token CUSTOMER → 403 `error_code: FORBIDDEN`.
- **AC-9 (Cập nhật):** *Given* product có ảnh cũ, *When* `PUT` gửi lại `imageUrl` cũ + 1 file mới, *Then* 200 và `imageUrl` = ảnh cũ + ảnh mới; *When* `PUT` không gửi `imageUrl`, *Then* ảnh cũ bị thay bằng chỉ file mới (hành vi đã biết — EC-2).
- **AC-10 (Xóa):** *When* `DELETE /api/products/:id` bởi ADMIN, *Then* 200, product biến mất khỏi `GET` danh sách VÀ toàn bộ variants của nó bị xóa theo (cascade); file ảnh `/uploads/...` liên quan được dọn best-effort.
- **AC-11 (CRUD variant):** *Given* product tồn tại, *When* `POST .../variants` với `variant` JSON hợp lệ, *Then* 201 `{ success: true, result }` có `productId` đúng; `PUT` đổi `quantity` → 200 phản ánh ngay trong `GET .../variants`; `DELETE` → 200 và variant biến mất.
- **AC-12 (Variant của product ma):** *When* `POST /api/products/<id-không-tồn-tại>/variants`, *Then* 404 `{ success: false }`.
- **AC-13 (Hết hàng FE):** *Given* mọi variant `quantity = 0`, *When* khách mở trang chi tiết, *Then* nút add-to-cart `disabled` + label "Sản phẩm tạm hết hàng", từng variant hiện badge "Hết hàng".
- **AC-14 (Deep-link filter):** *When* mở `/products?category=SUNGLASSES&gender=FEMALE`, *Then* bộ lọc khởi tạo đúng và request đầu tiên đã kèm 2 param đó.
- **AC-15 (Sort server-side):** *Given* nhiều sản phẩm rải trên nhiều trang, *When* `?sortBy=price-asc`, *Then* `items` tăng dần theo `price` và đúng thứ tự **liên trang** (trang 2 tiếp nối trang 1); FE đổi sort → reset về trang 1.
- **AC-16 (Khóa quyền đọc):** *Given* không có token, *When* `GET /api/products?status=ALL`, *Then* kết quả chỉ chứa `status: 'ACTIVE'`; *Given* token MANAGER, *Then* thấy cả `INACTIVE` và `LENS`.
- **AC-17 (Upload guard):** *When* upload file 15MB hoặc file `.exe`, *Then* 400 `FILE_TOO_LARGE`/`INVALID_FILE_TYPE` và không có file nào được ghi vào bản ghi.

### 7.1 Testing Requirements
- **Unit (BE):** query builder của `getProducts` (status default/ALL, ẩn LENS, isManager, regex search, price range); validate 400 create; behavior wipe-imageUrl khi update (chốt hành vi hiện tại).
- **Integration (BE):** full CRUD product + variant với 3 role (anonymous/CUSTOMER/MANAGER) → ma trận 200/201/400/401/403/404; multipart upload thật với file mẫu.
- **Component (FE):** `ProductForm` — chọn variant, chọn tròng (tổng tiền = variant + lens), chặn hết hàng; `ProductsPage` — pagination, empty state, error retry.
- **E2E:** Manager tạo product → thêm 2 variants → khách tìm thấy qua filter → chọn màu → add-to-cart → Manager set `INACTIVE` → sản phẩm biến mất khỏi trang khách.

---

## 8. Out of Scope (Phạm vi ngoài)

> **Quan trọng:** Các mục dưới đây hệ thống **KHÔNG** thực hiện ở giai đoạn này.

- **KHÔNG** có tính năng giảm giá / khuyến mãi: không có UI quản lý promotion, không lọc/sort theo giá khuyến mãi. Trường `discountPrice` trong schema là tùy chọn tồn dư — mọi logic lọc giá chỉ dùng `price` gốc.
- **KHÔNG** có sort theo độ phổ biến / bán chạy (chỉ `newest` và giá gốc qua `sortBy`).
- **KHÔNG** có full-text search engine (Atlas Search/Elastic) — chỉ regex Mongo.
- **KHÔNG** upload ảnh lên cloud/CDN — chỉ đĩa cục bộ `uploads/`.
- **KHÔNG** quản lý độ cận/loạn của tròng theo sản phẩm — đơn kính thuốc thuộc `feature-checkout` (prescription trên order item).
- **KHÔNG** có Virtual Try-on (thử kính ảo qua webcam).
- **KHÔNG** có review/rating trong feature này — `ProductFeedback` gọi `/api/feedbacks/...` thuộc feature riêng.
- **KHÔNG** có soft-delete (chỉ có ẩn qua `status: INACTIVE`).
- **KHÔNG** tự chuyển product sang `INACTIVE` khi mọi variant về 0 (chỉ hiển thị "Hết hàng" — theo CONTEXT Q1).

---

## Phụ lục — API Contract, Dependencies & Open Questions

### A. Bảng tổng hợp endpoint (Base: `/api/products`)

| Method & Path | Auth | Request | Success |
| :--- | :--- | :--- | :--- |
| `GET /` | Public (token staff tùy chọn) | Query: `page`(1-based), `limit`, `search`, `category`, `brand`, `gender`, `shape`, `frameMaterial`, `frameType`, `minPrice`, `maxPrice`, `status`(chỉ hiệu lực với staff), `sortBy`(`newest`\|`price-asc`\|`price-desc`) | 200 `{ code: 0, result: { items, page(0-based), size, totalElements, totalPages } }` |
| `GET /:id` | Public (khách bị chặn `INACTIVE`) | — | 200 bare Product object |
| `POST /` | MANAGER/ADMIN | multipart: `product`(JSON string) + `files[]` | 201 `{ code: 0, result }` |
| `PUT /:id` | MANAGER/ADMIN | multipart như trên (nhớ gửi lại `imageUrl` giữ lại) | 200 `{ code: 0, result }` |
| `DELETE /:id` | MANAGER/ADMIN | — | 200 `{ code: 0, message }` |
| `GET /:productId/variants` | Public | — | 200 `{ success: true, result: [] }` |
| `POST /:productId/variants` | MANAGER/ADMIN | multipart: `variant`(JSON string) + `files[]` | 201 `{ success: true, result }` |
| `PUT /:productId/variants/:variantId` | MANAGER/ADMIN | multipart như trên | 200 `{ success: true, result }` |
| `DELETE /:productId/variants/:variantId` | MANAGER/ADMIN | — | 200 `{ success: true, message }` |

Chi tiết payload mẫu: xem `docs/API_Document.md` §4.

### B. Dependencies & Integration Points
**Internal:**
- `feature-cart`: `ProductForm`/`ProductsPage` gọi `addToCart`; tồn kho variant quyết định nút mua.
- `feature-checkout`: `PricingService` + `OrderController` đọc/trừ `variant.quantity`; job cleaner hoàn kho đơn PENDING quá 15 phút (`server.js`).
- `feature-auth`: `authenticate` + `requireRole` bảo vệ route ghi.
- `feature-admin-dashboard`: thống kê đọc từ `products`/`product_variants`.
- FE Manager: `/manager/products` (`ProductManagePage` + `ProductModal`), `/manager/products/:productId/variants` (`ProductVariantManagePage`).

**Libraries:** BE: `express`, `mongoose`, `multer`, `jsonwebtoken`; FE: `axios`, `zustand`, `framer-motion`, `sonner`, `lucide-react`, `react-router-dom`.

### C. Open Questions — trạng thái 2026-07-19

Tất cả OQ đã được xử lý hoặc đóng; giữ nguyên số thứ tự làm changelog.

- ✅ **OQ-1 [ĐÃ XỬ LÝ]:** Thêm `optionalAuthenticate` (`authMiddleware.js`) gắn vào 2 route GET; `getProducts`/`getProductById` suy quyền staff từ `req.user.role`, gỡ cờ `isManager` cả backend lẫn FE. Khách luôn bị khóa `ACTIVE`.
- ✖️ **OQ-2 [ĐÃ ĐÓNG]:** Không làm tính năng giảm giá → lọc giá chỉ dùng `price` gốc là đúng by-design. Quyết định: Product Owner.
- ✅ **OQ-3 [ĐÃ XỬ LÝ]:** `deleteProduct` cascade `ProductVariant.deleteMany({productId})` + best-effort xóa file `/uploads/...` của product và variants. **Còn mở (dài hạn):** có nên chặn xóa cứng khi product đã có `OrderItem` tham chiếu (chuyển soft-delete)? — Owner: Product — Due: 2026-08-15.
- ✅ **OQ-4 [ĐÃ XỬ LÝ]:** `GET /:id` trả 404 `NOT_FOUND` cho khách khi product `INACTIVE`; staff (token MANAGER/ADMIN) vẫn xem được.
- ✅ **OQ-5 [ĐÃ XỬ LÝ]:** Thêm `sortBy` whitelist server-side (`newest`/`price-asc`/`price-desc`); `ProductsPage` gửi `sortBy`, bỏ sort client-side, đổi sort reset trang 1.
- ✅ **OQ-6 [ĐÃ XỬ LÝ]:** Mọi lỗi qua `next(error)` → `errorHandler` trung tâm trả `{ error_code, message }`; map ValidationError/CastError/MulterError/SyntaxError → 400 với mã tương ứng; thêm helper `httpError()` trong `errorMiddleware.js`.
- ✅ **OQ-7 [ĐÃ XỬ LÝ]:** Multer `limits: { fileSize: 10MB, files: 10 }` + `fileFilter` whitelist PNG/JPEG/WEBP + `diskStorage` giữ extension (`product.routes.js`).
- ✅ **OQ-8 [ĐÃ XỬ LÝ]:** Helper `escapeRegex` trong `ProductController.js` áp cho `search`/`brand`/`shape`/`frameMaterial`.
- ✅ **OQ-9 [ĐÃ XỬ LÝ]:** `useManagerProducts` đọc đúng `queryParams.search`; bỏ cờ `isManager` ở `ProductManagePage` (quyền lấy từ token) → ô tìm kiếm Manager hoạt động, tab "Tròng kính" có dữ liệu.
