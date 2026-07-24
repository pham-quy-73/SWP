# Hướng dẫn Phát triển Dự án Optic (CLAUDE.md)

Tài liệu này chứa các thông tin hướng dẫn phát triển, kiến trúc và quy chuẩn viết mã dành cho nhà phát triển và các AI agent khi làm việc trong codebase này.

---

## 1. Quyết định Kiến trúc (ADRs)

### ADR-001: Chọn JWT + Google OAuth2 thay vì Session
- **Lý do:** stateless API để dễ dàng mở rộng và hỗ trợ đăng nhập qua mạng xã hội tiện lợi.
- **Triển khai:** JWT access token gửi qua header `Authorization: Bearer <token>`.

### ADR-002: Chọn Mongoose ODM thay vì MongoDB Native Driver
- **Lý do:** Mongoose cung cấp schema verification, middleware hooks, và ép kiểu tự động giúp hạn chế tối đa lỗi dữ liệu.
- **Triển khai:** Các model định nghĩa rõ ràng cấu trúc dữ liệu trong `src/backend/models/`.

### ADR-003: Nhúng dữ liệu Payment vào Order
- **Lý do:** Mỗi hóa đơn chỉ được kích hoạt thanh toán trực tiếp một lần duy nhất qua cổng trực tuyến VNPay. Nhúng đối tượng thanh toán giúp tối ưu tốc độ kết xuất dữ liệu hóa đơn.

---

## 2. Các lệnh phát triển thường dùng (Dev Commands)

### Backend (`src/backend/`)
- **Chạy Server phát triển**: `npm run dev` (sử dụng `node --watch` tự động tải lại code).
- **Chạy Server Production**: `npm start`
- **Khởi tạo dữ liệu mẫu (Seed)**:
  - Seed toàn bộ: `npm run seed`
  - Seed tài khoản: `npm run seed:users`
  - Seed tròng kính: `npm run seed:lenses`
- **Chạy Kiểm thử (Tests)**:
  - Chạy toàn bộ test tích hợp: `npx vitest run tests/integration`
  - Chạy một file test cụ thể: `npx vitest run tests/integration/order.routes.test.js`

### Frontend (`src/frontend/`)
- **Chạy ứng dụng phát triển**: `npm run dev` (chạy Vite local server).
- **Xây dựng bản production**: `npm run build`
- **Xem trước bản build**: `npm run preview`

---

## 3. Cấu trúc thư mục (Directory Structure)

- `src/backend/`:
  - `controllers/`: Chứa các bộ điều khiển logic nghiệp vụ (ví dụ: `OrderController.js`, `AddressController.js`).
  - `models/`: Định nghĩa các schema cơ sở dữ liệu Mongoose (`Order.js`, `Address.js`).
  - `routes/`: Mount các endpoints API (`order.routes.js`, `address.routes.js`).
  - `tests/integration/`: Các ca kiểm thử API tự động (sử dụng Vitest + Supertest).
- `src/frontend/src/`:
  - `feature/`: Tiếp cận theo hướng Module/Feature (ví dụ: `feature/product/components/PrescriptionModal.jsx`, `feature/checkout/store/useCheckoutFlow.js`).
  - `contexts/`: Chia sẻ trạng thái toàn cục (User context, v.v.).

---

## 4. Quy chuẩn Validate & Xử lý lỗi (Validation Standards)

### A. Ràng buộc ở Frontend (FE Validation)
- **Đơn kính thuốc**: Các trường thông số quang học phải được validate thời gian thực và format ngay khi mất focus (`onBlur` gọi `formatOpticalValue`). Độ cận SPH, CYL, ADD phải được làm tròn về bội số gần nhất của `0.25`, PD làm tròn về bội số của `0.5`. Chặn nút "Thêm vào giỏ hàng" và toast lỗi cụ thể nếu thông số sai miền giá trị.
- **Thông tin giao hàng**: Họ tên ≤ 100 ký tự, SĐT khớp định dạng Việt Nam, và địa chỉ giao hàng tối thiểu từ 3 đến 300 ký tự.

### B. Ràng buộc ở Backend (BE Validation)
- Không sử dụng cơ chế tự động chuyển đổi thông số sai về `0` một cách âm thầm (silent normalization). 
- Khi nhận payload, bắt buộc gọi hàm kiểm tra dữ liệu nghiêm ngặt (như `validatePrescriptionFields` hoặc `validateAddressInputs`).
- Nếu phát hiện dữ liệu lỗi, ném ra lỗi hoặc trả về mã lỗi HTTP `400` với mã lỗi `VALIDATION_ERROR` kèm thông báo lỗi rõ ràng.

---

## 5. Duy trì Mạng lưới Tri thức (Graphify & Wiki)

Dự án này sử dụng bản đồ tri thức tại `graphify-out/` để quản lý các mối quan hệ chéo giữa các tệp.

Quy tắc làm việc:
- **Truy vấn trước**: Khi có câu hỏi về codebase, chạy lệnh `graphify query "<câu hỏi>"` hoặc `graphify explain "<khái niệm>"` để trích xuất subgraph gọn gàng.
- **Điều hướng rộng**: Nếu có thư mục `graphify-out/wiki/index.md`, hãy đọc nó để hiểu kiến trúc tổng quan thay vì duyệt file thủ công.
- **Cập nhật đồ thị**: Sau khi thực hiện sửa đổi mã nguồn, hãy chạy lệnh `graphify update .` để giữ cho sơ đồ tri thức luôn mới (lệnh này chạy AST-only cục bộ, không tốn chi phí API).

