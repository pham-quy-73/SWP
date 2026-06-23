# Feature: Trang sản phẩm (Store & Products) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-06-23  
**Priority:** High

---

## 1. Business Context
Trang sản phẩm là bộ mặt của cửa hàng mắt kính Optics Management, cho phép khách hàng duyệt, lọc và tìm kiếm nhanh các gọng kính mắt mong muốn. Hệ thống phải đảm bảo hỗ trợ kiểm tra chi tiết các thông số đo của gọng, màu mắt và quản lý chặt chẽ các biến thể sản phẩm theo sự thay đổi về kích thước/giá bán tại kho.

---

## 2. User Stories
*   **Story 1 (Happy Path - Khách hàng bộ lọc):**  
    Là khách hàng, tôi muốn tìm kiếm từ khóa và lọc sản phẩm theo Thương hiệu (Gucci, Rayban,...), Kiểu dáng (Tròn, Vuông,...), Chất liệu (Titanium, Plastic,...), Giới tính và khoảng giá để nhanh chóng tìm thấy sản phẩm phù hợp.
*   **Story 2 (Happy Path - Quản trị viên quản lý kho):**  
    Là quản lý cử hàng (Manager/Admin), tôi muốn CRUD sản phẩm chính và CRUD các biến thể chi tiết (colorName, sizeLabel, bridgeWidthMm, lensWidthMm, templeLengthMm, giávariant, số lượng variant) để đồng bộ tồn kho thực tế.
*   **Story 3 (Edge Case - Hết hàng / Ngừng bán):**  
    Là khách hàng, khi xem sản phẩm có tổng tồn kho bằng 0 hoặc trạng thái `INACTIVE`, tôi sẽ thấy nút "Hết hàng" hoặc sản phẩm bị ẩn đi để tránh đặt hàng khống.

---

## 3. Acceptance Criteria (EARS)
*   **Tìm kiếm & Lọc:**
    - **WHEN** người dùng gửi yêu cầu lấy danh sách kèm theo các tham số query (`search`, `category`, `gender`, `minPrice`, `maxPrice`,...)
    - **THE SYSTEM SHALL** trả về mã HTTP 200 kèm danh sách sản phẩm đã được phân trang (0-indexed).
*   **Xem sản phẩm tồn tại:**
    - **WHEN** người dùng gửi yêu cầu xem chi tiết gọng kính theo ID hợp lệ
    - **THE SYSTEM SHALL** trả về trực tiếp đối tượng chứa thông tin thuộc tính của sản phẩm đó trong CSDL Mongoose.
*   **Thêm sản phẩm (Manager/Admin):**
    - **WHEN** nhân viên gửi dữ liệu sản phẩm mới dạng `multipart/form-data` kèm danh sách file ảnh
    - **THE SYSTEM SHALL** lưu trữ file cục bộ dưới thư mục `/uploads`, tạo bản ghi DB mới, và trả về HTTP 201 kèm kết quả sản phẩm vừa tạo.
*   **Quản lý biến thể sản phẩm:**
    - **WHEN** nhân viên CRUD biến thể theo route `POST/PUT/DELETE /api/products/:productId/variants`
    - **THE SYSTEM SHALL** tự động đồng bộ thay đổi trong bảng `product_variants`.

---

## 4. API Contract

### 4.1 Lấy danh sách sản phẩm
*   **Endpoint:** `GET /api/products`
*   **Query params:** `page`, `limit`, `search`, `category`, `brand`, `gender`, `shape`, `frameMaterial`, `frameType`, `minPrice`, `maxPrice`, `status`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": {
        "items": [ ... ],
        "page": 0,
        "size": 10,
        "totalElements": 1,
        "totalPages": 1
      }
    }
    ```

### 4.2 Thêm sản phẩm mới (dành cho MANAGER/ADMIN)
*   **Endpoint:** `POST /api/products`
*   **Content-Type:** `multipart/form-data`
*   **Payload:** Field `product` (JSON String) + Field `files` (Danh sách ảnh)
*   **Response 201:**
    ```json
    {
      "code": 0,
      "result": { "_id": "...", "name": "...", "price": 1000... }
    }
    ```

### 4.3 Biến thể sản phẩm (Product Variants sub-routes)
*   `GET /api/products/:productId/variants`
*   `POST /api/products/:productId/variants` (MANAGER/ADMIN)
*   `PUT /api/products/:productId/variants/:variantId` (MANAGER/ADMIN)
*   `DELETE /api/products/:productId/variants/:variantId` (MANAGER/ADMIN)
*   **Response format (success):** `{ "success": true, "result": { ... } }`

---

## 5. Technical Constraints
*   **Database Collections:** `products` (tập trung thông tin chung của gọng kính) và `product_variants` (chứa chi tiết từng SKU vật lý).
*   **Tải ảnh sản phẩm:** Giới hạn mỗi file gửi lên không vượt quá 10MB và chỉ chấp nhận định dạng ảnh phổ thông (PNG, JPG, JPEG, WEBP).

---

## 6. Out of Scope
*   Quy trình tự động thay đổi độ cận/loạn của tròng kính theo sản phẩm chính (việc cắt tròng kính sẽ được xử lý riêng hoặc đi kèm qua đơn kính thuốc ở Checkout).
*   Hệ thống so sánh kính ảo (Virtual Try-on) qua webcam.
