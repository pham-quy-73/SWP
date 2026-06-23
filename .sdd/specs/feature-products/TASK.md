# TASK.md — Trang sản phẩm & Biến thể (Store & Products Task List)

## A. THIẾT KẾ CƠ SỞ DỮ LIỆU & API CORE
- [x] Tạo Schema Mongoose `Product` (gọng kính mắt chính)
- [x] Tạo Schema Mongoose `ProductVariant` (liên kết khóa `productId`)
- [x] Lập trình `ProductController` các nghiệp vụ tìm kiếm, phân trang và CRUD gọng kính
- [x] Lập trình `ProductVariantController` quản lý SKU liên đới gọng kính
- [x] Khai báo các endpoint router dưới prefix `/api/products`

## B. XÂY DỰNG GIAO DIỆN HIỂN THỊ CỬA HÀNG (FE)
- [x] Hiện thực hóa trang danh sách sản phẩm `ProductsPage.jsx`
- [x] Tích hợp bộ lọc filter (Thương hiệu, kiểu dáng, mức giá, giới tính) kết xuất danh sách
- [x] Hiện thực hóa trang chi tiết gọng kính `ProductDetailPage.jsx`
- [x] Tải danh sách biến thể tương ứng, cho phép khách hàng lựa chọn màu sắc và kích cỡ tùy ý trên UI

## C. XÂY DỰNG BỘ CÔNG CỤ QUẢN TRỊ (ADMIN CRUD)
- [x] Tạo trang quản lý danh sách sản phẩm `ProductManagePage.jsx` dành cho Manager/Admin
- [x] Triển khai Form thêm mới/chỉnh sửa sản phẩm dạng Multipart Form-Data (kèm tải ảnh)
- [x] Tạo trang quản lý biến thể `ProductVariantManagePage.jsx`
- [x] Triển khai Form thêm/chỉnh sửa biến thể chi tiết (Màu sắc, kích thước, tồn kho, giá bán)
