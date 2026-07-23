# Feature: Quản lý Tròng kính (Lens Management) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-23  
**Priority:** Medium  
**Risk Level:** Medium (Ảnh hưởng tính giá đơn hàng khi tròng bị INACTIVE, dữ liệu y tế liên quan)  
**Related Specs:** `feature-products`, `feature-orders`, `feature-payment`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Cửa hàng Optics bán gọng kính kết hợp với tròng kính. Khách hàng có thể chọn mua gọng kính riêng lẻ (frame-only) hoặc kết hợp gọng + tròng (frame + lens) khi đặt hàng. Tròng kính là sản phẩm phụ trợ được quản lý riêng biệt, có giá riêng, và được gắn vào OrderItem khi khách chọn cắt kính theo toa thuốc.

**Pain point hiện tại:**
- Thiếu giao diện quản lý danh mục tròng kính cho Manager/Admin
- Cần soft-delete (chuyển INACTIVE) thay vì xóa vĩnh viễn để bảo toàn dữ liệu đơn hàng cũ
- Cần hỗ trợ giá khuyến mãi (`discountPrice`) cho từng loại tròng

### 1.2 Goals

1. **CRUD tròng kính**: Manager/Admin quản lý danh mục tròng kính (tên, chất liệu, giá, mô tả)
2. **Soft-delete**: Xóa tròng kính = chuyển sang INACTIVE, không xóa vĩnh viễn
3. **Tìm kiếm**: Hỗ trợ tìm kiếm theo tên, chất liệu, mô tả
4. **Lọc trạng thái**: Khách hàng chỉ thấy tròng ACTIVE, Manager/Admin thấy tất cả

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Lens Management |
| :--- | :--- | :--- |
| **GUEST / CUSTOMER** | Khách hàng | Xem danh sách tròng kính ACTIVE (chọn khi đặt hàng), xem chi tiết |
| **MANAGER** | Quản lý | Tạo, sửa, xóa (soft-delete) tròng kính |
| **ADMIN** | Quản trị | Tất cả quyền của MANAGER |
| **System (PricingService)** | Hệ thống | Lấy giá tròng từ DB khi tính giá đơn hàng — ưu tiên `discountPrice` > 0, ngược lại dùng `price` |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
> - Backend: `src/backend/controllers/LensController.js`, `src/backend/models/Lens.js`
> - Routes: `src/backend/routes/lens.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE Lens model SHALL enforce `name` and `material` as required fields (String, trimmed).

- **U-2:** THE `price` field SHALL be a non-negative Number (`min: 0`, required).

- **U-3:** THE `status` field SHALL be limited to enum `['ACTIVE', 'INACTIVE']` with default `'ACTIVE'`.

- **U-4:** THE `discountPrice` field SHALL be optional and non-negative when provided. `PricingService` ưu tiên `discountPrice > 0`, ngược lại dùng `price` gốc.

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Lấy Danh sách Tròng kính

- **E-1:** WHEN any user requests `GET /api/lenses` with optional query params (`search`, `status`), THE system SHALL:
  - Default `status = 'ACTIVE'` (khách chỉ thấy tròng đang bán)
  - If `status = 'ALL'`, show all lenses regardless of status
  - If `search` is provided, perform case-insensitive regex search across `name`, `material`, `description`
  - Return sorted by `createdAt` descending
  ```json
  { "success": true, "count": 5, "data": [{ "_id", "name", "material", "price", "discountPrice", "description", "status" }] }
  ```

#### 3.2.2 Lấy Chi tiết Tròng kính

- **E-2:** WHEN any user requests `GET /api/lenses/:id`, THE system SHALL return the lens document; IF not found, SHALL return HTTP 404 `{ success: false, message: 'Không tìm thấy tròng kính' }`.

#### 3.2.3 Tạo Tròng kính Mới

- **E-3:** WHEN Manager/Admin submits `POST /api/lenses` with `{ name, material, price, discountPrice?, description?, status? }`, THE system SHALL validate via `validateLensPayload()`:
  - `name`: required, string, 1-200 ký tự (trimmed)
  - `material`: required, string, 1-200 ký tự (trimmed)
  - `price`: required, number, `≥ 0`
  - `discountPrice`: optional, number, `≥ 0` (nếu provided và non-empty)
  - `description`: optional, string, max 2000 ký tự
  - `status`: optional, must be `'ACTIVE'` or `'INACTIVE'`

- **E-4:** WHEN validation passes, THE system SHALL create lens with defaults `description = ''`, `status = 'ACTIVE'` (overridden by payload if provided), and return HTTP 201:
  ```json
  { "success": true, "message": "Tạo tròng kính thành công", "data": {...} }
  ```

#### 3.2.4 Cập nhật Tròng kính

- **E-5:** WHEN Manager/Admin submits `PUT /api/lenses/:id` with partial payload, THE system SHALL validate provided fields using `validateLensPayload(body, false)` (non-create mode: no required fields).

- **E-6:** WHEN no valid fields are provided (empty update), THE system SHALL return HTTP 400 `{ success: false, message: 'Không có trường hợp lệ nào để cập nhật' }`.

- **E-7:** WHEN update is valid, THE system SHALL use `$set` with only provided fields (avoid overwriting untouched fields with `undefined`), `runValidators: true`, and return HTTP 200 with updated document.

#### 3.2.5 Xóa Tròng kính (Soft-Delete)

- **E-8:** WHEN Manager/Admin submits `DELETE /api/lenses/:id`, THE system SHALL perform soft-delete by setting `status = 'INACTIVE'` (using `findByIdAndUpdate`), NOT permanently delete.

- **E-9:** WHEN soft-delete succeeds, THE system SHALL return HTTP 200:
  ```json
  { "success": true, "message": "Xóa tròng kính thành công (đã chuyển sang INACTIVE)", "data": {...} }
  ```

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE a lens has `status === 'INACTIVE'`, THE PricingService SHALL reject orders containing that lens with error `INVALID_LENS: 'Tròng kính không hợp lệ hoặc đã ngưng bán'`.

- **S-2:** WHILE default `status` query param is `'ACTIVE'`, THE customer-facing lens list SHALL only show active lenses.

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE `name` or `material` exceeds 200 characters, THE system SHALL return HTTP 400 with specific validation message.

- **N-2:** WHERE `price` or `discountPrice` is negative or NaN, THE system SHALL return HTTP 400.

- **N-3:** WHERE Manager deletes a lens that is referenced by existing OrderItems, THE lens document SHALL NOT be physically deleted (soft-delete preserves referential integrity).

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Security):** Read endpoints (`GET /`, `GET /:id`) are public (no authentication). Write endpoints (`POST`, `PUT`, `DELETE`) require `authenticate` + `requireRole(['MANAGER', 'ADMIN'])`.

- **NFR-2 (Consistency):** Authorization model is synchronized with `product.routes.js` — same roles can manage lenses as products.

- **NFR-3 (Validation):** `validateLensPayload()` is a shared validator for both create and update, using `isCreate` flag to toggle required-field checks.

---

## 5. Data Model (Mô hình dữ liệu)

### Collection: `lenses`

| Field | Type | Required | Default | Constraints / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `name` | String | ✅ | — | Trim, 1-200 ký tự |
| `material` | String | ✅ | — | Trim, 1-200 ký tự (chất liệu: polycarbonate, CR-39, v.v.) |
| `price` | Number | ✅ | — | `min: 0`. Giá gốc |
| `discountPrice` | Number | — | — | `min: 0`. Giá khuyến mãi (PricingService ưu tiên khi > 0) |
| `description` | String | — | `''` | Trim, max 2000 ký tự |
| `status` | String (Enum) | — | `'ACTIVE'` | `ACTIVE`, `INACTIVE` |
| `createdAt` | Date (auto) | — | `Date.now` | Timestamps plugin |
| `updatedAt` | Date (auto) | — | `Date.now` | Timestamps plugin |

---

## 6. Error Handling (Xử lý lỗi)

| Error | HTTP Status | Trigger | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| Validation (tên/chất liệu/giá) | 400 | Thiếu trường bắt buộc, vượt giới hạn ký tự, giá âm | Trả `{ success: false, message: '...' }` |
| Empty update | 400 | PUT không có trường hợp lệ nào | Trả thông báo cụ thể |
| Not found | 404 | ID không tồn tại | Trả `{ success: false, message: 'Không tìm thấy tròng kính' }` |
| INVALID_LENS (PricingService) | 400 | Đặt hàng tròng INACTIVE | Trả lỗi từ PricingError trong luồng Order/Payment |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** Manager đăng nhập  
  **When** Manager gửi `POST /api/lenses` với `{ name: "Tròng chống ánh sáng xanh", material: "Polycarbonate", price: 350000 }`  
  **Then** Hệ thống tạo lens mới với `status = 'ACTIVE'`, trả HTTP 201

- **Given** Khách hàng xem trang đặt hàng  
  **When** Request `GET /api/lenses` (không có query status)  
  **Then** Chỉ trả danh sách tròng kính có `status = 'ACTIVE'`

- **Given** Manager muốn ngưng bán tròng kính X  
  **When** Manager gửi `DELETE /api/lenses/:id`  
  **Then** Tròng kính chuyển sang INACTIVE (không bị xóa vĩnh viễn)

- **Given** Tròng kính X đã INACTIVE  
  **When** Khách đặt đơn có chọn tròng X  
  **Then** PricingService trả lỗi `INVALID_LENS`, đơn không được tạo

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** hỗ trợ phân loại tròng kính theo danh mục (category / type).
- **KHÔNG** hỗ trợ upload ảnh cho tròng kính.
- **KHÔNG** hỗ trợ quản lý thương hiệu tròng kính (brand).
- **KHÔNG** hỗ trợ import/export danh mục tròng kính từ Excel.
- **KHÔNG** hỗ trợ hard-delete tròng kính (chỉ soft-delete sang INACTIVE).
- **KHÔNG** tích hợp tính năng so sánh tròng kính.
