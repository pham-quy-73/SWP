Dưới đây là file **CLAUDE.md** đã được cập nhật, sửa lỗi mâu thuẫn về test file (`.jsx`/`.js` thay vì `.tsx`) và chuyển phần Auto Memory sang file riêng (chỉ để lại tham chiếu). Nội dung phù hợp với dự án Node.js + Express, MongoDB, React JavaScript thuần.

````markdown
# CLAUDE.md — Claude Code Project Memory

> **⚠️ Quan trọng:** Đọc file `AGENTS.md` trước để hiểu đầy đủ context về project (tech stack, kiến trúc, quy tắc đặt tên, v.v.). File này chỉ chứa các quyết định cụ thể và kinh nghiệm thực tế trong quá trình phát triển.

---

## MANUAL MEMORY (human-maintained)

### Architecture Decisions (ADR)

#### ADR-001: Chọn JWT thay vì Session

- **Lý do:** Hệ thống cần stateless API để có thể mở rộng và tích hợp với mobile app sau này.
- **Triển khai:** JWT access token, lưu trong `HttpOnly cookie` hoặc `Authorization: Bearer`. Không dùng refresh token ở phiên bản đầu.

#### ADR-002: Mongoose ODM thay vì MongoDB Native Driver

- **Lý do:** Mongoose cung cấp schema validation, middleware (pre/post hooks), và type casting giúp giảm lỗi.
- **Thay thế:** Không dùng Prisma vì database là MongoDB, không phải SQL.

#### ADR-003: Tách riêng collection `Verification` và `Refund` thay vì nhúng trong `Order`

- **Lý do:** Verification và Refund có thể có nhiều bản ghi trong tương lai (ví dụ: verify lại nhiều lần). Nhúng sẽ làm document order quá lớn.
- **Hiện tại:** Mỗi order chỉ có một verification, nhưng vẫn tách để dễ mở rộng.

#### ADR-004: Dùng `Jest` cho cả backend và frontend

- **Lý do:** Jest là standard trong hệ sinh thái Node.js/React, có thể chạy unit test và integration test. Frontend dùng React Testing Library cùng Jest.
- **Thay thế:** Không dùng Vitest vì team đã quen Jest và cần đồng nhất.

### Lessons Learned (từ incidents và code review)

#### LESSON-001: Luôn tạo index cho các trường dùng trong `$lookup` và filter

- **Sự cố:** API lấy danh sách đơn hàng của user chạy rất chậm (3-5 giây) khi có >1000 orders.
- **Nguyên nhân:** Không có index trên `orders.user_id` và `order_items.order_id`.
- **Giải pháp:** Tạo index đơn giản: `db.orders.createIndex({ user_id: 1 })`, `db.order_items.createIndex({ order_id: 1 })`. Tốc độ giảm xuống <50ms.
- **Áp dụng:** Khi tạo collection mới, luôn xem xét các query thường dùng và thêm index ngay từ đầu.

#### LESSON-002: Validate file size và loại file TRƯỚC khi upload lên Cloudinary

- **Sự cố:** Một khách hàng upload ảnh đơn thuốc dung lượng 25MB, gây timeout và tiêu tốn băng thông.
- **Giải pháp:** Thêm middleware kiểm tra `multer` với giới hạn `fileSize: 10MB` và chỉ cho phép `image/jpeg, image/png, application/pdf`.
- **Code mẫu:**
  ```javascript
  const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/image\/(jpeg|png)|application\/pdf/))
        cb(null, true);
      else cb(new Error("Only JPEG, PNG, PDF"), false);
    },
  });
  ```
````

#### LESSON-003: Wrap Mongoose calls trong try-catch với custom error mapping

- **Sự cố:** Lỗi `CastError` (ObjectId sai) hoặc `ValidationError` không được bắt, trả về stack trace cho client.
- **Giải pháp:** Tạo một `errorHandler` middleware chuyển đổi lỗi Mongoose thành HTTP response phù hợp.
- **Ví dụ:** `CastError` → 400 Bad Request, `ValidationError` → 422 Unprocessable Entity.
- **Áp dụng:** Tất cả controller đều gọi service có `try-catch` và ném lỗi chuẩn.

#### LESSON-004: Xử lý callback VNPay an toàn – không chỉ dựa vào tham số URL

- **Sự cố:** Ban đầu, sau khi nhận callback, hệ thống cập nhật payment status dựa vào `vnp_ResponseCode` từ query params mà không kiểm tra checksum.
- **Rủi ro:** Kẻ tấn công có thể giả mạo callback.
- **Giải pháp:** Luôn kiểm tra checksum (vnp_SecureHash) theo đúng tài liệu VNPay trước khi cập nhật.
- **Code mẫu:** So sánh `vnp_SecureHash` với hash tính toán từ các params còn lại.

### Current Focus (không dùng sprint)

- **Hiện tại đang làm:** Hoàn thiện luồng xác minh đơn hàng (Sale duyệt/từ chối) và tích hợp thanh toán VNPay.
- **Blocked:** Chưa có `vnpay_return_url` công khai trên môi trường production – đang dùng ngrok để test.
- **Việc tiếp theo:** Dashboard cho Admin, quản lý người dùng, và các tính năng còn lại (upload ảnh, order history).
- **Ghi chú:** Notification (email) sẽ làm sau nếu còn thời gian – không bắt buộc cho MVP.

**Các task đang được triển khai:**

- Backend: API `/verification/approve/:orderId` và `/verification/reject/:orderId`.
- Frontend: Trang "Xác minh đơn hàng" cho Sale, hiển thị đơn thuốc text + ảnh.
- Testing: Viết test cho service `OrderService.updateStatus`.

---

## PATTERNS TO FOLLOW

### Service Pattern

- **Nơi đặt:** `src/services/[name].service.js`
- **Nội dung:** Chứa logic nghiệp vụ, gọi model, không xử lý request/response.
- **Ví dụ:** `OrderService.js` có các method `createOrder`, `verifyOrder`, `cancelOrder`.

### Controller Pattern

- **Nơi đặt:** `src/controllers/[name].controller.js`
- **Nội dung:** Nhận request, validate dữ liệu đầu vào, gọi service, trả về response.
- **Chú ý:** Không chứa logic nghiệp vụ, chỉ điều phối.

### Test File Convention

- **Backend:** Tạo file `[name].service.test.js` ngay cạnh service file.
- **Frontend:** Tạo `[Component].test.jsx` hoặc `[Component].test.js` trong cùng thư mục component.
- **Bắt buộc:** Mỗi service có ít nhất unit test cho method chính (ví dụ: `createOrder` kiểm tra trừ kho, tạo order items).

### Error Codes Constants

- Tạo file `src/constants/errors.js` định nghĩa các mã lỗi dùng chung.
- Ví dụ:
  ```javascript
  module.exports = {
    ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
    INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
    INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  };
  ```

### Logging Convention

- Dùng `winston` logger, không `console.log`.
- Mức độ: `error`, `warn`, `info`, `debug`.
- Ghi log đầy đủ khi có lỗi (stack trace, requestId, userId nếu có).

---

## AUTO MEMORY

> **Lưu ý:** Các entry tự động từ Claude Code hiện được ghi vào file riêng **[MEMORY_LOG.md](./MEMORY_LOG.md)** để tránh làm phình file này.  
> Vui lòng đọc `MEMORY_LOG.md` để biết lịch sử các quyết định và bài học gần đây.

```

```
