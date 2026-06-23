# TASK.md — Giỏ hàng (Cart Feature Task List)

## A. THIẾT LẬP CLIENT STATE (ZUSTAND)
- [x] Cài đặt và cấu hình thư viện `zustand`
- [x] Tạo file store quản lý giỏ hàng tại client
- [x] Cấu hình `persist` middleware ghi dữ liệu tự động vào LocalStorage với key `vision-cart-storage`
- [x] Hiện thực hóa các phương thức nghiệp vụ:
  - [x] `addItem` (cộng dồn nếu trùng SKU và toa kính)
  - [x] `removeItem` (lọc bỏ phần tử khỏi store)
  - [x] `updateQuantity` (tăng/giảm số lượng có kiểm tra giới hạn kho)
  - [x] `clearCart` (làm trống giỏ hàng)

## B. XÂY DỰNG GIAO DIỆN (UI COMPONENTS)
- [x] Tạo component `CartDrawer` hiển thị slide-out panel bên phải màn hình
- [x] Thiết lập component `CartItemRow` hiển thị chi tiết biến thể và nút điều khiển số lượng
- [x] Tích hợp form khai báo thông số khúc xạ đơn kính mắt (prescription) vào item
- [x] Giao tiếp UI Header badge để phản ứng thay đổi số lượng mặt hàng thời gian thực

## C. KẾT NỐI & TÍCH HỢP HỆ THỐNG
- [x] Gắn sự kiện thêm giỏ hàng tại trang danh sách và trang chi tiết sản phẩm
- [x] Tự động ẩn giỏ hàng và chuyển hướng người dùng khi nhấp nút "Thanh toán" sang `/checkout`
- [x] Reset giỏ hàng về trống sau khi khách đặt hàng thành công
