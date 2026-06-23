# PLAN.md — Trang sản phẩm & Biến thể (Store & Products Implementation Plan)
# Người viết: @antigravity | Ngày: 2026-06-23

## 1. ARCHITECTURAL APPROACH
Sử dụng mô hình MVC chia tách rõ ràng giữa Mongoose model ở lớp data, Express routing/controllers ở lớp xử lý logic Backend, và React Component giao tiếp bằng API Axios ở lớp hiển thị Client.
*   **Database split:** Tách thành hai collection `products` (gọng kính mắt cơ sở) và `product_variants` (SKU chi tiết) giúp việc quản lý thuộc tính vật lý dạng One-to-Many thuận lợi hơn.
*   **Pagination & Filter at DB-level:** Lọc tìm kiếm và phân trang trực tiếp trong database để tối ưu hóa băng thông truyền tải và sử dụng các index tối ưu của MongoDB.

## 2. COMPONENTS
*   **Mongoose Models (`Product`, `ProductVariant`):** Định nghĩa cấu trúc dữ liệu lưu bảng DB.
*   **Backend Controllers (`ProductController`, `ProductVariantController`):**
    - Trách nhiệm: Nhận tham số tìm kiếm, phân trang và truy vấn MongoDB. Xử lý lưu tệp tin ảnh gửi kèm qua Router.
    - Interface: 
      - Input: API query parameters, form-data payload.
      - Output: Standard JSON success `{ code: 0, result: ... }` lý tưởng.
*   **Frontend Pages & Components:**
    - `ProductsPage.jsx` - Giao diện lưới và thanh filter.
    - `ProductDetailPage.jsx` - Giao diện xem/chọn SKU.
    - `ProductManagePage.jsx` & `ProductVariantManagePage.jsx` - Giao diện quản lý CRUD dành cho Admin/Manager.

## 3. DATA FLOW
1.  **Duyệt:** Người dùng gửi query lọc từ UI client.
2.  **API:** Client gọi endpoint `GET /api/products` (có kèm các tham số).
3.  **Xử lý ở Backend:** Router phân nhánh qua Controller, gọi model thực thi `$match` và `$skip` / `$limit` để trả về danh sách phân trang chuẩn.
4.  **Kết xuất ở Frontend:** React map dữ liệu và in ra màn hình.

## 4. DEPENDENCIES
*   **Thứ tự implement:**
    1. Thiết kế và tạo schema Mongoose cho `Product` và `ProductVariant`.
    2. Viết API router và controller xử lý danh sách, chi tiết và CRUD.
    3. Thiết lập UI danh sách sản phẩm và chi tiết ở Client.
    4. Thiết lập UI Dashboard quản lý CRUD dành cho Admin/Manager.

## 5. RISKS & MITIGATIONS
*   **Rủi ro 1: Lỗi lưu file ảnh hỏng.**
    - Xác suất: Med | Biện pháp: Triển khai kiểm tra định dạng dữ liệu (mimetype) và giới hạn file size nhỏ hơn 10MB trước khi chuyển sang multers.
*   **Rủi ro 2: Chênh lệch tồn kho giữa Product và Variant.**
    - Xác suất: High | Biện pháp: Tuyệt đối không cho phép nhập số lượng tồn kho thủ công trên Product. Tổng tồn kho của Product là tổng của toàn bộ Variant thuộc về nó.
*   **Rủi ro 3: Xung đột API router trùng trùng.**
    - Xác suất: Low | Biện pháp: Thiết lập tên router rõ ràng, quản lý chặt chẽ theo cấu trúc `/api/products` và sub-path `/:productId/variants`.

## 6. QUESTIONS FOR HUMAN
*   Có bắt buộc tích hợp lưu trữ hình ảnh lên Cloudinary cho phiên bản này hay chỉ lưu trữ tệp cục bộ trên máy chủ lưu `/uploads`? (Hiện tại: Hỗ trợ lưu trữ cục bộ).
