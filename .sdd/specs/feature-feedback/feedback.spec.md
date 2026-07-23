# Feature: Đánh giá Sản phẩm (Feedback / Reviews) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-07-23  
**Priority:** Medium  
**Risk Level:** Low (CRUD chuẩn, ownership-based, không ảnh hưởng giao dịch tài chính)  
**Related Specs:** `feature-orders`, `feature-products`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Hệ thống đánh giá sản phẩm cho phép khách hàng chia sẻ trải nghiệm sau khi mua gọng kính / tròng kính. Đánh giá xuất hiện trên trang chi tiết sản phẩm (public) và giúp khách hàng tiềm năng ra quyết định mua hàng. Mỗi đánh giá gắn liền với cả đơn hàng (`order_id`) lẫn sản phẩm (`product_id`) để đảm bảo khách chỉ đánh giá sản phẩm mà họ thực sự đã mua.

**Pain point hiện tại:**
- Khách hàng gửi đánh giá trùng lặp (cùng user + order + product) → cần auto-upsert thay vì báo lỗi
- Cần hỗ trợ upload ảnh minh chứng kèm đánh giá (tối đa 5 ảnh)
- Đánh giá hiển thị công khai nhưng chỉ chủ sở hữu mới được sửa/xóa

### 1.2 Goals

1. **Đánh giá theo đơn hàng**: Mỗi khách chỉ đánh giá sản phẩm từ đơn hàng họ sở hữu
2. **Auto-upsert**: Nếu đã đánh giá trước đó (cùng user + order + product) → tự động cập nhật thay vì tạo mới
3. **Upload ảnh**: Hỗ trợ gắn tối đa 5 ảnh minh chứng
4. **Ownership protection**: Chỉ chủ sở hữu mới được sửa/xóa đánh giá của mình

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor | Vai trò | Phân quyền với Feedback |
| :--- | :--- | :--- |
| **CUSTOMER** | Khách hàng | Tạo/sửa/xóa đánh giá của mình, xem đánh giá của mình, xem đánh giá theo đơn hàng |
| **GUEST (Public)** | Khách vãng lai | Xem đánh giá theo sản phẩm (trang chi tiết sản phẩm) |
| **System** | Hệ thống | Validate ownership (order thuộc user), auto-upsert khi trùng |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
> - Backend: `src/backend/controllers/FeedbackController.js`, `src/backend/models/Feedback.js`
> - Routes: `src/backend/routes/feedback.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE Feedback model SHALL enforce a compound index on `{ user_id, order_id, product_id }` to support efficient upsert lookups.

- **U-2:** THE `rating` field SHALL be an integer between 1 and 5 (inclusive), enforced by Mongoose schema `min: 1, max: 5`.

- **U-3:** THE system SHALL accept `feedback` field in request body as either JSON string or object (dual parsing support for both `application/json` and `multipart/form-data` submissions).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

#### 3.2.1 Tạo Đánh giá (Create Feedback)

- **E-1:** WHEN Customer submits `POST /api/feedbacks` with `{ order_id, product_id, rating, comment?, images? }`, THE system SHALL validate: (1) `order_id`, `product_id`, `rating` are all present and non-null, (2) order exists AND belongs to `req.user._id`.

- **E-2:** WHEN a feedback already exists for the same `{ user_id, order_id, product_id }` combination, THE system SHALL auto-UPDATE the existing feedback (rating, comment, append images) instead of creating a new one, and return HTTP 200 with message `'Cập nhật đánh giá thành công'`.

- **E-3:** WHEN no existing feedback is found, THE system SHALL create a new Feedback document and return HTTP 201 with message `'Gửi đánh giá thành công'`.

- **E-4:** WHEN files are uploaded via `multer` (`req.files`), THE system SHALL save images to `/uploads/` and store URLs in the `images` array.

- **E-5:** WHEN order does not exist OR does not belong to the user, THE system SHALL return HTTP 404 `ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng hoặc bạn không có quyền đánh giá đơn này'`.

#### 3.2.2 Xem Đánh giá của Tôi (My Feedbacks)

- **E-6:** WHEN Customer requests `GET /api/feedbacks/me`, THE system SHALL return all feedbacks created by `req.user._id`, populated with `product_id` (name, price, thumbnail, image_url), sorted by `createdAt` descending.

#### 3.2.3 Xem Đánh giá theo Sản phẩm (Public)

- **E-7:** WHEN any user (authenticated or not) requests `GET /api/feedbacks/product/:productId`, THE system SHALL return all feedbacks for the given product, populated with `user_id` (first_name, last_name, avatar_url, username), sorted by `createdAt` descending.

#### 3.2.4 Xem Đánh giá theo Đơn hàng

- **E-8:** WHEN Customer requests `GET /api/feedbacks/order/:orderId`, THE system SHALL return feedbacks matching `{ order_id: orderId, user_id: req.user._id }`, populated with `product_id`.

#### 3.2.5 Xem Chi tiết Đánh giá

- **E-9:** WHEN Customer requests `GET /api/feedbacks/:feedbackId`, THE system SHALL return the feedback document populated with `product_id`; IF not found, SHALL return HTTP 404 `NOT_FOUND`.

#### 3.2.6 Cập nhật Đánh giá

- **E-10:** WHEN Customer requests `PUT /api/feedbacks/:feedbackId` with `{ rating?, comment?, images? }`, THE system SHALL validate that the feedback belongs to `req.user._id` (`findOne({ _id, user_id })`); IF not found, SHALL return HTTP 404.

- **E-11:** WHEN updating, THE system SHALL only overwrite fields that are provided (partial update): rating if truthy, comment if defined, images appended to existing array.

#### 3.2.7 Xóa Đánh giá

- **E-12:** WHEN Customer requests `DELETE /api/feedbacks/:feedbackId`, THE system SHALL delete using `findOneAndDelete({ _id, user_id })` to enforce ownership; IF not found, SHALL return HTTP 404 `NOT_FOUND: 'Không tìm thấy đánh giá hoặc không có quyền xóa'`.

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE viewing product detail page, THE UI SHALL display all feedbacks for that product with user avatar, name, rating stars, comment, and images.

- **S-2:** WHILE Customer has already reviewed a product for an order, THE UI SHOULD indicate "already reviewed" and allow editing instead of creating new.

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE Customer attempts to review a product from an order they don't own, THE system SHALL return HTTP 404 (same response as order-not-found to prevent order enumeration).

- **N-2:** WHERE Customer attempts to edit/delete a feedback owned by another user, THE system SHALL return HTTP 404 (ownership enforced via `findOne({ _id, user_id })`).

- **N-3:** WHERE `feedback` field in request body is a malformed JSON string, THE system SHALL catch parse error gracefully and fallback to top-level `req.body` fields.

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (File Upload):** Image uploads handled by `multer` with destination `uploads/`, maximum 5 files per request (`upload.array('images', 5)`).

- **NFR-2 (Security):** All mutating endpoints (POST, PUT, DELETE) require `authenticate` middleware. Product feedbacks endpoint (GET) is public (no authentication required).

- **NFR-3 (Data Integrity):** Compound index `{ user_id, order_id, product_id }` prevents duplicate reviews at the database level (in addition to application-level upsert logic).

---

## 5. Data Model (Mô hình dữ liệu)

### Collection: `feedbacks`

| Field | Type | Required | Default | Constraints / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | ObjectId (ref: User) | ✅ | — | Người đánh giá |
| `product_id` | ObjectId (ref: Product) | ✅ | — | Sản phẩm được đánh giá |
| `order_id` | ObjectId (ref: Order) | ✅ | — | Đơn hàng chứa sản phẩm |
| `rating` | Number | ✅ | — | `min: 1, max: 5` |
| `comment` | String | — | `''` | Nội dung đánh giá |
| `images` | [String] | — | `[]` | Danh sách URL ảnh minh chứng |
| `createdAt` | Date (auto) | — | `Date.now` | Timestamps plugin |
| `updatedAt` | Date (auto) | — | `Date.now` | Timestamps plugin |

**Indexes:**
- `{ user_id: 1, order_id: 1, product_id: 1 }` — compound index cho upsert lookup

---

## 6. Error Handling (Xử lý lỗi)

| Error Code | HTTP Status | Trigger | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Thiếu `order_id`, `product_id`, hoặc `rating` | Trả lỗi |
| `ORDER_NOT_FOUND` | 404 | Đơn hàng không tồn tại hoặc không thuộc user | Trả lỗi (chống enumeration) |
| `NOT_FOUND` | 404 | Feedback không tồn tại hoặc không thuộc user | Trả lỗi |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** Customer đã mua đơn hàng chứa sản phẩm X  
  **When** Customer gửi `POST /api/feedbacks` với `{ orderId, productId, rating: 5, comment: "Rất tốt" }`  
  **Then** Hệ thống tạo Feedback mới, trả HTTP 201

- **Given** Customer đã đánh giá sản phẩm X trong đơn Y trước đó  
  **When** Customer gửi `POST /api/feedbacks` lần 2 với cùng `orderId` + `productId`  
  **Then** Hệ thống cập nhật feedback cũ (auto-upsert), trả HTTP 200

- **Given** Khách vãng lai (chưa đăng nhập) xem trang chi tiết sản phẩm  
  **When** Request `GET /api/feedbacks/product/:productId`  
  **Then** Hệ thống trả danh sách đánh giá kèm thông tin user (tên, avatar)

- **Given** Customer A cố sửa đánh giá của Customer B  
  **When** Request `PUT /api/feedbacks/:feedbackId`  
  **Then** Hệ thống trả HTTP 404 (ownership check)

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** hỗ trợ Manager/Admin duyệt hoặc xóa đánh giá (moderation).
- **KHÔNG** hỗ trợ phản hồi / trả lời đánh giá (reply to feedback).
- **KHÔNG** tính điểm trung bình (average rating) trên sản phẩm — client tự tính từ danh sách.
- **KHÔNG** gửi thông báo khi có đánh giá mới.
- **KHÔNG** hỗ trợ đánh giá ẩn danh.
- **KHÔNG** hỗ trợ đánh giá video.
- **KHÔNG** yêu cầu đơn hàng phải ở trạng thái COMPLETED mới cho phép đánh giá (hiện tại chỉ kiểm tra ownership).
