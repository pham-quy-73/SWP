# Feature: Sổ Địa chỉ Giao hàng (Address Book) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-15
**Priority:** Medium  
**Risk Level:** Low (CRUD cá nhân, ownership-based, không ảnh hưởng giao dịch)  
**Related Specs:** `feature-checkout`, `feature-orders`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Khách hàng mua gọng kính trực tuyến cần nhập địa chỉ giao hàng mỗi lần đặt đơn. Sổ địa chỉ cho phép khách lưu trữ nhiều địa chỉ (nhà, công ty, người thân...) và chọn nhanh khi checkout, tiết kiệm thời gian nhập liệu lặp lại. Mỗi khách có đúng một địa chỉ mặc định (default) — khi checkout, hệ thống tự động điền địa chỉ mặc định.

**Pain point hiện tại:**

- Khách phải nhập lại địa chỉ giao hàng mỗi lần đặt hàng
- Cần quản lý "địa chỉ mặc định" để checkout nhanh
- Khi xóa địa chỉ mặc định, cần auto-fallback sang địa chỉ khác

### 1.2 Goals

1. **Lưu trữ nhiều địa chỉ**: Mỗi khách lưu được nhiều địa chỉ kèm nhãn (label)
2. **Địa chỉ mặc định thông minh**: Auto-default cho địa chỉ đầu tiên, auto-fallback khi xóa default
3. **Ownership protection**: Chỉ chủ sở hữu được xem/sửa/xóa địa chỉ của mình
4. **Tích hợp checkout**: Trang checkout dùng địa chỉ mặc định làm giá trị điền sẵn

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor                  | Vai trò               | Phân quyền                                                              |
| :--------------------- | :-------------------- | :---------------------------------------------------------------------- |
| **Authenticated User** | Bất kỳ user đăng nhập | CRUD toàn bộ trên địa chỉ của chính mình                                |
| **System**             | Hệ thống              | Tự động đặt default cho địa chỉ đầu tiên, auto-fallback khi xóa default |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
>
> - Backend: `src/backend/controllers/AddressController.js`, `src/backend/models/Address.js`
> - Routes: `src/backend/routes/address.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** ALL address endpoints SHALL require authentication (`router.use(authenticate)`) — no public access.

- **U-2:** THE system SHALL enforce ownership on ALL operations — users can ONLY access their own addresses (validated via `address.user_id === req.user._id`).

- **U-3:** THE `is_default` field SHALL ensure at most one default address per user at any time (mutual exclusion via `updateMany` before setting new default).

- **U-4:** THE Address model SHALL enforce compound index `{ user_id: 1, is_default: -1, updatedAt: -1 }` for efficient sorting (default first, then most recently updated).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Xem Danh sách Địa chỉ

- **E-1:** WHEN authenticated user requests `GET /api/addresses`, THE system SHALL return all addresses belonging to `req.user._id`, sorted by `is_default` descending then `updatedAt` descending (default address first, then most recently updated).

#### 3.2.2 Tạo Địa chỉ Mới

- **E-2:** WHEN user submits `POST /api/addresses` with `{ label?, recipientName, phoneNumber, deliveryAddress, isDefault? }`, THE system SHALL validate that: (1) `recipientName` is present, non-empty, and ≤ 100 characters, (2) `phoneNumber` is present, non-empty, and matches format `^(\+84|0)\d{8,10}$` after stripping whitespaces/dots/dashes, (3) `deliveryAddress` is present, non-empty, and between `[3..300]` characters; IF any check fails, THE system SHALL return HTTP 400 `VALIDATION_ERROR` with a descriptive message.

- **E-3:** WHEN `isDefault === true` OR this is the user's FIRST address (count = 0), THE system SHALL: (1) clear `is_default` on ALL existing addresses of this user, (2) create new address with `is_default = true`.

- **E-4:** WHEN creation succeeds, THE system SHALL return HTTP 201:
  ```json
  { "code": 0, "message": "Đã lưu địa chỉ giao hàng", "result": {...} }
  ```

#### 3.2.3 Cập nhật Địa chỉ

- **E-5:** WHEN user submits `PUT /api/addresses/:id` with partial payload, THE system SHALL: (1) verify address exists, (2) verify ownership, (3) validate provided fields with same strict rules as creation (E-2) and return HTTP 400 `VALIDATION_ERROR` if invalid, (4) update only provided fields (label, recipientName, phoneNumber, deliveryAddress).

- **E-6:** WHEN `isDefault === true` AND address is NOT currently default, THE system SHALL clear `is_default` on ALL other addresses of this user, then set `is_default = true` on this address.

#### 3.2.4 Đặt Địa chỉ Mặc định

- **E-7:** WHEN user submits `PUT /api/addresses/:id/default`, THE system SHALL: (1) verify address exists, (2) verify ownership, (3) clear `is_default` on ALL addresses of this user, (4) set `is_default = true` on the target address.

- **E-8:** WHEN set-default succeeds, THE system SHALL return HTTP 200:
  ```json
  { "code": 0, "message": "Đã đặt làm địa chỉ mặc định", "result": {...} }
  ```

#### 3.2.5 Xóa Địa chỉ

- **E-9:** WHEN user submits `DELETE /api/addresses/:id`, THE system SHALL: (1) verify address exists, (2) verify ownership, (3) permanently delete the address document.

- **E-10:** WHEN deleted address was the default (`is_default === true`), THE system SHALL auto-select the most recently updated remaining address as the new default:

  ```javascript
  const fallback = await Address.findOne({ user_id }).sort({ updatedAt: -1 });
  if (fallback) {
    fallback.is_default = true;
    await fallback.save();
  }
  ```

- **E-11:** WHEN deletion succeeds, THE system SHALL return HTTP 200 `{ code: 0, message: 'Đã xóa địa chỉ' }`.

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE user has zero addresses, THE next address created SHALL automatically become the default (regardless of `isDefault` parameter).

- **S-2:** WHILE user has exactly one address, THE system SHALL prevent that address from having `is_default = false` (it's always the default by definition — enforced at creation via count check).

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE user attempts to access another user's address, THE system SHALL return HTTP 403 `FORBIDDEN: 'Bạn không có quyền chỉnh sửa địa chỉ này'` (or `'thao tác trên'` / `'xóa'` depending on action).

- **N-2:** WHERE address ID does not exist, THE system SHALL return HTTP 404 `ADDRESS_NOT_FOUND`.

- **N-3:** WHERE user deletes the default address AND has other addresses, THE system SHALL auto-fallback to the most recently updated address.

- **N-4:** WHERE user deletes the default address AND has NO other addresses, THE system SHALL NOT error (no fallback needed — next address created will auto-default).

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Security):** `router.use(authenticate)` applied to ALL endpoints — no public access to address data.

- **NFR-2 (Performance):** Compound index `{ user_id: 1, is_default: -1, updatedAt: -1 }` enables efficient sorted queries without full collection scan.

- **NFR-3 (Data Integrity):** Mutual exclusion of `is_default` flag maintained via `updateMany` + `save` (not atomic but sufficient for single-user address management).

---

## 5. Data Model (Mô hình dữ liệu)

### Collection: `addresses`

| Field              | Type                 | Required | Default    | Constraints / Notes                          |
| :----------------- | :------------------- | :------: | :--------- | :------------------------------------------- |
| `user_id`          | ObjectId (ref: User) |    ✅    | —          | Indexed. Chủ sở hữu                          |
| `label`            | String               |    —     | `''`       | Trim. Nhãn tùy chỉnh: "Nhà", "Công ty", v.v. |
| `recipient_name`   | String               |    ✅    | —          | Trim. Tên người nhận                         |
| `phone_number`     | String               |    ✅    | —          | Trim. SĐT người nhận                         |
| `delivery_address` | String               |    ✅    | —          | Trim. Địa chỉ giao hàng đầy đủ               |
| `is_default`       | Boolean              |    —     | `false`    | Tối đa 1 default per user                    |
| `createdAt`        | Date (auto)          |    —     | `Date.now` | Timestamps plugin                            |
| `updatedAt`        | Date (auto)          |    —     | `Date.now` | Timestamps plugin                            |

**Indexes:**

- `{ user_id: 1, is_default: -1, updatedAt: -1 }` — composite index cho danh sách sắp xếp

---

## 6. Error Handling (Xử lý lỗi)

| Error Code          | HTTP Status | Trigger                                                      | Hành vi hệ thống                            |
| :------------------ | :---------: | :----------------------------------------------------------- | :------------------------------------------ |
| `VALIDATION_ERROR`  |     400     | Thiếu `recipientName`, `phoneNumber`, hoặc `deliveryAddress` | Trả lỗi                                     |
| `ADDRESS_NOT_FOUND` |     404     | Address ID không tồn tại                                     | Trả lỗi                                     |
| `FORBIDDEN`         |     403     | User truy cập địa chỉ của người khác                         | Trả lỗi kèm thông báo cụ thể theo hành động |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** User chưa có địa chỉ nào  
  **When** User tạo địa chỉ đầu tiên (không gửi `isDefault`)  
  **Then** Địa chỉ tự động trở thành mặc định (`is_default = true`)

- **Given** User có 3 địa chỉ, trong đó #1 là default  
  **When** User đặt #3 làm mặc định  
  **Then** #1 mất cờ default, #3 trở thành default

- **Given** User có 2 địa chỉ, #1 là default  
  **When** User xóa #1  
  **Then** #2 tự động trở thành default (fallback)

- **Given** User A cố truy cập địa chỉ của User B  
  **When** Request `PUT /api/addresses/:idOfB`  
  **Then** Hệ thống trả HTTP 403 FORBIDDEN

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** hỗ trợ xác minh địa chỉ thông qua API bên thứ 3 (Google Maps, GHN, v.v.).
- **KHÔNG** hỗ trợ tách trường địa chỉ thành tỉnh/huyện/xã (hiện tại lưu `delivery_address` dạng freetext).
- **KHÔNG** hỗ trợ giới hạn số lượng địa chỉ tối đa per user.
- **KHÔNG** hỗ trợ chia sẻ sổ địa chỉ giữa các user.
- **KHÔNG** tích hợp tính phí vận chuyển theo địa chỉ (flat shipping rate hoặc free shipping).
