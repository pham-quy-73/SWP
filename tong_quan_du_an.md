## 📌 Tổng quan dự án: Optics Management (Thu nhỏ)

### 1. Giới thiệu

**Optics Management** là hệ thống quản lý bán hàng trực tuyến cho một cửa hàng kính mắt nhỏ. Hệ thống tập trung vào luồng nghiệp vụ cốt lõi: khách hàng chọn mua gọng kính có sẵn, nhập đơn thuốc (prescription), thanh toán qua VNPay, nhân viên bán hàng xác minh đơn thuốc, và hoàn tất đơn hàng. Các vai trò phức tạp như nhân viên sản xuất, shipper, pre‑order, combo nâng cao được lược bỏ để đảm bảo tiến độ.

### 2. Mục tiêu

- Xây dựng một web app hoàn chỉnh với đầy đủ chức năng của một shop kính mắt trực tuyến quy mô nhỏ.
- Thực hành phát triển full‑stack: backend API, frontend giao diện, tích hợp thanh toán thực tế (VNPay sandbox).
- Áp dụng các kỹ thuật: xác thực JWT, phân quyền dựa trên role, upload ảnh, quản lý trạng thái đơn hàng.
- Hoàn thành đúng tiến độ với sản phẩm demo ổn định, code sạch, tài liệu đầy đủ.

### 3. Phạm vi (Scope)

**Bao gồm:**

- 3 vai trò: **Customer** (khách hàng), **Sale Staff** (nhân viên bán hàng), **Admin** (quản trị).
- Quản lý sản phẩm (gọng kính): xem, tìm kiếm, CRUD cho admin.
- Giỏ hàng, đặt hàng kèm nhập đơn thuốc (text + upload ảnh).
- Thanh toán 100% qua VNPay.
- Xác minh đơn hàng (Sale duyệt/từ chối dựa trên đơn thuốc).
- Quản lý trạng thái đơn: PENDING → AWAITING_VERIFICATION → CONFIRMED → COMPLETED; hoặc CANCELLED, REFUNDED.
- Khách hàng tự xác nhận đã nhận hàng, hủy đơn trước khi xác minh.
- Admin xem tất cả đơn, quản lý người dùng (tạo tài khoản Sale, khóa tài khoản).
- Dashboard đơn giản (tổng đơn, doanh thu).

**Không bao gồm:**

- Pre‑order, đặt cọc, thanh toán 2 lần.
- Vai trò Operation, Shipper.
- Quy trình sản xuất, giao hàng phức tạp.
- Combo khuyến mãi, voucher, đánh giá sản phẩm.
- Thông báo email hay realtime.
- Hoàn tiền tự động qua VNPay (chỉ ghi nhận thủ công).

### 4. Các actor chính & chức năng

| Actor        | Chức năng chính                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Customer** | Đăng ký/đăng nhập, xem sản phẩm, quản lý giỏ hàng, tạo đơn (nhập đơn thuốc + upload ảnh), thanh toán VNPay, xem lịch sử đơn, xác nhận nhận hàng, hủy đơn (khi đang chờ). |
| **Sale**     | Xem danh sách đơn chờ xác minh, xem chi tiết đơn (kèm đơn thuốc), duyệt (→ CONFIRMED) hoặc từ chối (→ CANCELLED), ghi chú nội bộ.                                        |
| **Admin**    | CRUD sản phẩm, cập nhật tồn kho, xem tất cả đơn hàng, chuyển trạng thái đơn (nếu cần), quản lý người dùng (tạo tài khoản Sale, khóa/mở khóa), xem dashboard tổng quan.   |

### 5. Luồng nghiệp vụ chính

```
1. Customer chọn sản phẩm → thêm giỏ → tạo đơn (nhập đơn thuốc)
2. Đơn hàng trạng thái PENDING → Customer thanh toán qua VNPay
3. Thanh toán thành công → chuyển thành AWAITING_VERIFICATION
4. Sale đăng nhập, xem danh sách chờ → xem chi tiết đơn thuốc
   - Nếu đúng: duyệt → CONFIRMED
   - Nếu sai: từ chối → CANCELLED (kèm lý do)
5. Đơn CONFIRMED → Customer bấm "Đã nhận hàng" → COMPLETED
   (hoặc Admin có thể đánh dấu hoàn thành thay)
6. Nếu hủy trước khi duyệt → CANCELLED; Admin có thể tạo refund (ghi nhận thủ công)
```

### 6. Công nghệ dự kiến

| Thành phần        | Công nghệ                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Backend           | Node.js + Express                                                                             |
| Database          | MongoDB (8 collections: User, Product, Cart, Order, OrderItem, Payment, Verification, Refund) |
| Frontend          | React.js                                                                                      |
| Xác thực          | JWT, bcrypt                                                                                   |
| Thanh toán        | VNPay sandbox (tạo link, callback)                                                            |
| Upload ảnh        | Cloudinary (hoặc lưu local)                                                                   |
| Quản lý phiên bản | Git (GitHub/GitLab)                                                                           |

### 7. Kế hoạch phát triển 6 tuần (nhóm 3–4 người)

| Tuần | Backend                                                                 | Frontend                                                   | Công việc chung                            |
| ---- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| 1    | Thiết lập project, MongoDB schema, JWT                                  | Thiết kế giao diện cơ bản (Figma), cấu trúc React          | Họp yêu cầu, phân công, tạo backlog        |
| 2    | API Auth (login/register), API Product (CRUD)                           | Trang chủ, danh sách sản phẩm, chi tiết                    | Tích hợp API lấy sản phẩm                  |
| 3    | API Cart (thêm/sửa/xóa), API Order (tạo đơn + upload ảnh)               | Giỏ hàng, form tạo đơn (nhập đơn thuốc)                    | Upload ảnh đơn thuốc lên Cloudinary        |
| 4    | Tích hợp VNPay (tạo link, callback), API Payment                        | Trang thanh toán, xử lý callback                           | Cập nhật trạng thái đơn sau thanh toán     |
| 5    | API Verification (Sale: list đơn chờ, duyệt/từ chối), API Order history | Giao diện Sale (duyệt đơn), lịch sử đơn của khách          | Phân quyền trên FE dựa theo role           |
| 6    | API Admin (user management, dashboard đơn giản), API Refund (ghi nhận)  | Dashboard admin, quản lý người dùng, chuyển trạng thái đơn | Test toàn bộ, viết báo cáo, làm video demo |

### 8. Đánh giá rủi ro và giải pháp

| Rủi ro                                       | Giải pháp                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Tích hợp VNPay phức tạp, callback không nhận | Dùng ngrok để test local, log chi tiết, tham khảo tài liệu mẫu.                      |
| Upload ảnh đơn thuốc thất bại                | Cho phép nhập text thay thế, lưu ảnh tạm thời trước khi submit.                      |
| Không kịp thời gian                          | Ưu tiên luồng chính, cắt bỏ tính năng không quan trọng (refund, dashboard nâng cao). |
| Xung đột khi làm việc nhóm                   | Họp daily 15 phút, dùng Git feature branch, code review.                             |

### 9. Kết luận

Optics Management – bản thu nhỏ là một dự án thực tế, vừa đủ độ khó cho nhóm 3–4 người trong 6 tuần. Hệ thống thể hiện rõ nghiệp vụ đặc thù của ngành kính mắt (đơn thuốc, xác minh) nhưng tránh được sự phức tạp không cần thiết. Với kế hoạch rõ ràng, phân công hợp lý và sử dụng các công nghệ phổ biến, dự án có khả năng thành công cao, đồng thời mang lại trải nghiệm học tập quý giá về phát triển phần mềm theo nhóm.
