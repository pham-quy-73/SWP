# CONTEXT.md — Phân hệ Quản lý Sản phẩm (Product Management)
# Dự án: Optics Management
# Phiên bản: 1.1.0 | Ngày lập: 2026-06-19 | Cập nhật: 2026-06-20 | Người lập: Lê Văn Bảo

> **CHANGELOG**
> - **v1.1.0 (2026-06-20):** Chuẩn hóa thư viện validation về **Joi** (trước đây ghi Zod — gây mâu thuẫn với PLAN/SPEC/TASKS). Dọn ký hiệu `[cite]` còn sót. Bổ sung Decision Maker. **Không thay đổi ràng buộc nghiệp vụ nào khác.** Phần bổ sung đánh dấu 🆕.
> - v1.0.0 (2026-06-19): Bản ban đầu.

## 1. PROBLEM STATEMENT (Bài toán nghiệp vụ)
Hệ thống Optics Management yêu cầu một phân hệ quản lý danh mục gọng kính mắt trực quan, tốc độ cao và an toàn dữ liệu.
- Khách hàng (CUSTOMER) cần trải nghiệm tìm kiếm, lọc sản phẩm theo giá/thương hiệu mượt mà để đưa quyết định mua hàng.
- Nhân viên (SALE) cần xem danh sách và tồn kho thực tế để tư vấn.
- Quản trị viên (ADMIN) cần bộ công cụ CRUD mạnh mẽ để số hóa kho hàng và kiểm soát tồn kho thực tế, chống overselling.

## 2. DOMAIN KNOWLEDGE & HARD CONSTRAINTS (Ràng buộc cứng)

### CONFIG-01: Đồng bộ Môi trường & Cổng kết nối
- Cổng chạy mặc định (Development Port): Backend chạy port `3000` (Node.js + Express), Frontend chạy port `5173` (React + Vite).
- Biến môi trường bắt buộc cấu hình qua `.env`, sử dụng `MONGO_URI=mongodb://localhost:27017/SWP`.

### CODE-01: Tiêu chuẩn mã nguồn (Đồng bộ với Constitution)
- Hệ thống áp dụng ES6 Modules (`import/export`).
- Định dạng Code: Bắt buộc cấu hình Prettier `semi: true` (Luôn sử dụng dấu chấm phẩy cuối dòng để đảm bảo tính tường minh).
- **Input Validation: Mọi request body/query/params gửi lên API thay đổi dữ liệu bắt buộc phải được validate thông qua thư viện Joi.** 🆕 *(Chuẩn hóa từ Zod → Joi để khớp PLAN/SPEC/TASKS — quy ước toàn dự án dùng **Joi**.)*

### DATA-01: Chiến lược Xóa mềm (Soft-delete)
- Tuyệt đối không sử dụng các lệnh xóa cứng bản ghi khỏi database đối với các thực thể sản phẩm.
- Hệ thống áp dụng cơ chế Xóa mềm bằng cách cập nhật trường `deleted_at` (kiểu dữ liệu `Date`, mặc định là `null`) để ẩn sản phẩm khỏi giao diện khách hàng nhưng giữ toàn vẹn lịch sử đơn hàng.

### STOCK-01: Cơ chế Đặt giữ kho tạm thời (Stock Reservation)
- Hệ thống không được phép trừ trực tiếp tồn kho thực tế khi người dùng đang ở giỏ hàng hoặc vừa nhấn thanh toán.
- Ngay khi người dùng tiến hành Checkout và chuyển sang cổng VNPay, số lượng kho tương ứng sẽ bị khóa tạm thời (Status: `PENDING_PAYMENT`) với TTL là 15 phút.
- Quá thời gian TTL mà Webhook VNPay không xác nhận thành công, tài nguyên kho sẽ được tự động hoàn tác (Rollback).
- *Lưu ý phạm vi:* 🆕 Logic Reservation thực thi ở **module Checkout/VNPay**, không thuộc module Product này. Module Product chỉ giữ trường `stock_quantity`.

### MEDIA-01: Quản lý Hình ảnh
- Toàn bộ file hình ảnh sản phẩm KHÔNG được lưu trực tiếp tại local storage của server backend.
- Hệ thống bắt buộc phải tích hợp với Cloudinary API để lưu trữ.
- Database bắt buộc phải lưu cấu trúc gồm song song: `image_url` (chuỗi hiển thị) và `image_public_id` (định danh để xóa tài nguyên cũ trên Cloudinary khi cập nhật hoặc xóa sản phẩm).

## 3. STAKEHOLDERS & ROLE MATRIX
- **CUSTOMER:** Xem danh sách, xem chi tiết các sản phẩm đang hoạt động (`deleted_at: null`).
- **SALE:** Có quyền xem danh sách và chi tiết sản phẩm (bao gồm số lượng tồn kho) để tư vấn, không có quyền can thiệp thay đổi dữ liệu (Read-only).
- **ADMIN:** Nắm toàn quyền kiểm soát danh mục (CRUD), cấu hình trạng thái ẩn/xóa mềm sản phẩm.
- **Decision Maker (chốt khi có conflict):** 🆕 @le-van-bao (backend lead) — người ra quyết định cuối về spec/architecture của module này. *(Ch6 cảnh báo: Context Discovery chưa xong nếu không ai biết ai chốt.)*

## 4. ASSUMPTIONS (Giả định hệ thống)
- **ASSUME-01:** Hệ thống không thiết kế bảng Biến thể (Variants). Mỗi thực thể sản phẩm trong DB là một SKU độc lập. Để phân biệt màu sắc/kích cỡ, Admin bắt buộc tuân thủ quy tắc đặt tên (Naming Convention): `[Tên sản phẩm] - [Màu sắc] - [Kích thước]`.
- **ASSUME-02:** Frontend xử lý form thêm mới dưới định dạng `multipart/form-data` hoặc JSON.

## 5. OPEN QUESTIONS RESOLVED (Câu hỏi đã chốt)
- **Q1: Sản phẩm bị xóa mềm xử lý thế nào trong giỏ hàng?**
  - *Xử lý:* Khi CUSTOMER truy cập `/cart`, hệ thống quét nếu sản phẩm có `deleted_at !== null`, Frontend SHALL hiện cảnh báo "Sản phẩm đã ngừng kinh doanh" và vô hiệu hóa nút thanh toán.
- **Q2: Thời điểm giảm số lượng tồn kho (`stock_quantity`) để tránh hụt kho ảo?**
  - *Xử lý:* Áp dụng triệt để quy tắc **STOCK-01**. Trừ kho thực tế và hủy kho tạm thời ngay khi nhận Webhook IPN trạng thái `SUCCESS` từ VNPay.
