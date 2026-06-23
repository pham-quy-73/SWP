# TASK.md — Checkout & Thanh toán (Checkout Feature Task List)

## A. THIẾT KẾ DATA SCHEMAS & LOGIC TÍNH LƯỢNG
- [x] Tạo Schema Mongoose `Order` (gồm 6 status và đối phụ `paymentInfo` nhúng)
- [x] Tạo Schema Mongoose `OrderItem`
- [x] Tạo API endpoint `/payment/orders/requirement` tính giá trị hàng trước khi checkout

## B. ĐẶT ĐƠN HÀNG & PHẢN HỒI KHO HÀNG (ATOMIC UPDATES)
- [x] Lập trình `OrderController.createOrder` nhận Multipart (ảnh toa kính thuốc)
- [x] Sử dụng toán tử atomic `$inc` của MongoDB để trừ kho an toàn cho variant sản phẩm
- [x] Tạo router `POST /orders/create`

## C. TÍCH HỢP CỔNG VNPAYmerchant
- [x] Xây dựng helper tạo URL thanh toán VNPay gửi đi
- [x] Tạo endpoint khởi tạo link thanh toán `POST /payment/checkout`
- [x] Viết logic callback kiểm tra chữ ký `vnp_SecureHash` tại `GET /payment/vnpay-callback`
- [x] Tự động cập nhật `CONFIRMED` khi thanh toán thành công, hoặc `CANCELLED` (hoàn kho) khi lỗi giao dịch

## D. TỰ ĐỘNG DỌN DẸP KHO TREO (WORKER)
- [x] Viết hàm `startOrderStatusCleanupJob` thực hiện quét các đơn `PENDING` quá 15 phút
- [x] Hoàn kho tự động và chuyển trạng thái đơn sang `CANCELLED`
- [x] Kích hoạt worker trong tệp khởi chạy `server.js`

## E. XÂY DỰNG FRONTEND FLOW
- [x] Tạo stepper tiến trình thanh toán tại `CheckoutPage.jsx`
- [x] Tích hợp trang hiển thị thành công/thất bại sau khi VNPay trả về
- [x] Chỉnh sửa `MyOrder.jsx` lịch sử đơn hàng của khách hàng:
  - [x] Mở rộng hiển thị nút Hủy đơn cho đơn `PENDING`
  - [x] Bổ sung nút "Thanh toán lại" khôi phục liên kết VNPay
