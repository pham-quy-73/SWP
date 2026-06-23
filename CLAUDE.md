# CLAUDE.md — Claude Code Project Memory

## MANUAL MEMORY (human-maintained)

### Architecture Decisions (ADR)

#### ADR-001: Chọn JWT + Google OAuth2 thay vì Session

- **Lý do:** Hệ thống cần stateless API để có thể mở rộng và hỗ trợ cả cơ chế đăng nhập truyền thống lẫn đăng nhập qua các bên thứ ba tiện lợi.
- **Triển khai:** JWT access token, gửi qua header `Authorization: Bearer <token>`.

#### ADR-002: Chọn Mongoose ODM thay vì MongoDB Native Driver

- **Lý do:** Mongoose cung cấp schema verification (hợp thức hóa dữ liệu), middleware hooks (pre-save, post-save), và tự động ép kiểu dữ liệu giúp tránh các lỗi logic thao tác DB.
- **Triển khai:** Cấu hình db.js và các model tương thích chặt chẽ với MongoDB.

#### ADR-003: Nhúng dữ liệu Payment vào Order thay vì tách collection riêng

- **Lý do:** Mỗi hóa đơn chỉ được kích hoạt thanh toán trực tiếp một lần duy nhất qua cổng trực tuyến VNPay. Việc nhúng đối tượng thanh toán giúp tối ưu tốc độ kết xuất dữ liệu hóa đơn.
- **Triển khai:** Cập nhật thông tin giao dịch (`transaction_id`) và thời gian đóng giao dịch ngay trên trường thuộc tính của `Order`.

#### ADR-004: Loại bỏ hoàn toàn COD, chấp nhận duy nhất cổng VNPay Sandbox

- **Lý do:** Giảm thiểu rủi ro bùng hàng và đơn ảo, đảm bảo tất cả đơn hàng đều có giao dịch được đảm bảo trước khi kích hoạt.
- **Triển khai:** Hủy bỏ nút chọn thanh toán bằng tiền mặt (COD) trên màn hình thanh toán ở FE (`PaymentForm.jsx`), chỉ xử lý thanh toán thông qua VNPay Sandbox.

#### ADR-005: Cho phép quản lý đơn hàng đặt trước (Pre-order) và Hủy đơn PENDING ở Client

- **Lý do:** Đảm bảo khách hàng có quyền chủ động hủy các đơn mua nhầm đang ở trạng thái `PENDING`. Cho phép đặt hàng trước để tối đa hóa doanh thu của cửa hàng.
- **Triển khai:** Mở rộng giao diện quản lý lịch sử đơn `MyOrder.jsx` cho phép hiển thị và kích hoạt nút Hủy đơn cho cả các hóa đơn trạng thái `PENDING`.

#### ADR-006: Giỏ hàng client-only hoàn toàn (Zustand + LocalStorage)

- **Lý do:** Đơn giản hóa kiến trúc backend, tối ưu hiệu năng cơ sở dữ liệu khi không cần lưu trữ hay merge dữ liệu giỏ tạm thời lên MongoDB.
- **Triển khai:** Phía Client lưu trữ giỏ hàng độc lập bằng Zustand thông qua key `vision-cart-storage`, không sử dụng collection `carts` và không có API `/cart` tại Backend.

---

### Lessons Learned (từ incidents và code review)

#### LESSON-001: Tự động giải phóng tồn kho ảo của các đơn hàng treo PENDING

- **Sự cố:** Khách tạo đơn hàng dẫn đến trừ tồn kho trong DB, sau đó tắt tab thanh toán VNPay khiến sản phẩm bị giữ kho ảo vô thời hạn.
- **Giải pháp:** Tích hợp Background Cleanup Job tại `server.js` chạy định kỳ mỗi 5 phút, quét dọn và tự động hủy các hóa đơn `PENDING` quá hạn 15 phút, trả lại số lượng tồn kho sản phẩm về CSDL.

#### LESSON-002: Kiểm chứng bảo mật checksum callback VNPay kỹ lưỡng

- **Sự cố:** Các request giả lập callback hệ thống có thể tùy ý thay đổi trạng thái hóa đơn nếu không kiểm soát mã hóa bảo mật chữ ký.
- **Giải pháp:** Sử dụng mã hóa HmacSHA512 với `secretKey` của VNPay để tự tạo chữ ký đối sánh trực tiếp với `vnp_SecureHash` gửi về, chỉ xử lý đơn khi trùng khớp hoàn toàn.

#### LESSON-003: Validation dữ liệu đầu vào thông qua Multipart Form-Data khi kèm ảnh

- **Sự cố:** Việc tạo đơn hàng chứa cả ảnh toa thuốc (prescriptionImage) và chuỗi JSON thông tin vận chuyển đòi hỏi giải pháp phối hợp xử lý multer.
- **Giải pháp:** Gửi chuỗi thông tin JSON qua trường `orderInfo` kết hợp file đính kèm dưới dạng `multipart/form-data`, sau đó tại Controller dùng `JSON.parse` để hợp thức hóa dữ liệu đầu vào.

---

### Current Focus

- **Hiện tại:** Hệ thống đã hoàn thiện xong luồng thanh toán VNPay-only, cơ chế hồi phục thanh toán (Resume Payment) và tự động dọn dẹp kho hàng quá hạn.
- **Việc tiếp theo:** Tăng cường xác thực giá sản phẩm phía Server-side trong `OrderController` để chống tấn công giả mạo giá tiền từ Client; cân nhắc phát triển tiếp các tính năng mở rộng cải tiến dịch vụ khách hàng (nhập đơn thuốc Lens Builder, sổ địa chỉ, tích điểm...).

---

## PATTERNS TO FOLLOW

- **Controller & Router:** Phân rã luồng rõ ràng, router chịu trách nhiệm phân quyền bằng các middleware `authenticate` và `requireRole`, controller đảm nhận tiếp nhận, validate dữ liệu (`Joi` hoặc kiểm tra điều kiện) và thực thi dịch vụ.
- **Background Worker:** Các tác vụ ngầm chạy định kỳ (như dọn dẹp đơn cũ) được khởi tạo trực tiếp tại `server.js` thông qua các tiến trình lập lịch độc lập.
- **Client State:** Toàn bộ thao tác thêm, bớt, tăng giảm số lượng sản phẩm trong giỏ hàng đều sử dụng store state Zustand cục bộ của frontend.

---

## AUTO MEMORY

> **Lưu ý:** Các mốc thay đổi chi tiết tự động được ghi nhận tại file riêng **[MEMORY_LOG.md](./MEMORY_LOG.md)** nhằm giữ tài liệu CLAUDE.md luôn cô đọng và dễ tra cứu.
