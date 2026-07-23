# TASK.md — Checkout & Thanh toán (Checkout Feature Task List)

## A. THIẾT KẾ DATA SCHEMAS & LOGIC TÍNH LƯỢNG
- [x] Tạo Schema Mongoose `Order` (6 status; flat fields snake_case: `payment_status`, `transaction_id`, `paid_at`, `bank_info`, `status_history[]`)
- [x] Tạo Schema Mongoose `OrderItem` (kèm `PrescriptionSchema` nhúng khi item có `lens_id`)
- [x] Tạo API endpoint `POST /api/payment/orders/requirement` báo giá trước checkout (dùng chung PricingService)

## B. ĐẶT ĐƠN HÀNG & PHẢN HỒI KHO HÀNG (ATOMIC UPDATES)
- [x] Lập trình `OrderController.createOrder` nhận Multipart (ảnh toa kính thuốc)
- [x] Sử dụng toán tử atomic `$inc` của MongoDB để trừ kho an toàn cho variant sản phẩm
- [x] Tạo router `POST /orders/create`

## C. TÍCH HỢP CỔNG VNPAYmerchant
- [x] Xây dựng helper tạo URL thanh toán VNPay gửi đi (ký SHA512, base path `/api/payment/checkout`)
- [x] Tạo endpoint khởi tạo link thanh toán `POST /api/payment/checkout`
- [x] Viết logic callback kiểm tra chữ ký `vnp_SecureHash` tại `GET /api/payment/vnpay-callback`
- [x] Đối chiếu số tiền `vnp_Amount === total_amount*100` và guard chỉ xử lý đơn `PENDING` (chống double-processing)
- [x] Chọn trạng thái sau thanh toán: `AWAITING_VERIFICATION` (đơn có tròng/đơn thuốc) hoặc `CONFIRMED` (còn lại); đặt `payment_status=PAID`
- [x] Chữ ký sai / số tiền lệch → redirect failure, KHÔNG đổi trạng thái đơn
- [x] `vnp_ResponseCode != '00'` → chuyển đơn `CANCELLED`
- [x] Endpoint mô phỏng dev-only `POST /api/payment/mock-checkout` (chặn 403 ở production)

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
