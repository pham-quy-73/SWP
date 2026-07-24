# CONTEXT.md — Quản lý Hoàn tiền (Refunds Management Feature)

## 1. PROBLEM STATEMENT

- **Thất thoát doanh thu và mâu thuẫn dòng tiền:** Khi một đơn hàng đã được thanh toán bị hủy, nếu không kiểm soát chặt chẽ quy trình hoàn tiền, cửa hàng có thể quên không trả tiền cho khách hoặc trả nhầm số tiền cần hoàn, gây khiếu nại xấu.
- **Thao tác hủy/sửa đơn thủ công tẻ nhạt khi dừng bán sản phẩm:** Khi một biến thể sản phẩm bị ngừng kinh doanh (ngưng sản xuất, lỗi kỹ thuật), cửa hàng cần hủy hàng loạt các đơn hàng đang chờ xử lý có chứa biến thể đó. Việc đi từng đơn để hủy và tạo yêu cầu hoàn tiền cực kỳ mất thời gian và dễ sai sót.
- **Sai lệch trạng thái tồn kho:** Khi hủy đơn hàng phục vụ cho quy trình hoàn tiền, nếu không tự động cộng lại tồn kho cho các biến thể trong đơn, cửa hàng sẽ bị sai lệch số lượng hàng thực tế có thể bán.

---

## 2. DOMAIN KNOWLEDGE

- **Quy trình Hoàn tiền 5 bước (5-step refund workflow):**
  1. Vô hiệu hóa biến thể (`ProductVariant.status = 'INACTIVE'`).
  2. Xem danh sách đơn hàng bị ảnh hưởng (chứa sản phẩm cha của biến thể đó).
  3. Gom đơn và tạo lô hoàn tiền hàng loạt (`createBatch`). Các đơn này chuyển sang `CANCELLED`.
  4. Xem danh sách hoàn tiền chờ duyệt (`status = 'PENDING'`).
  5. Manager kiểm tra tài khoản thực tế và bấm duyệt (`checkoutRefund`), chuyển Refund sang `COMPLETED`, Order sang `REFUNDED`, Payment sang `UNPAID`.
- **Lô hoàn tiền (Batch Refund):** Gom nhiều đơn hàng cần hoàn lại tiền vì cùng một nguyên do thành một lô để xử lý một lần, tối ưu thao tác cho Manager.

---

## 3. STAKEHOLDERS

- **Manager/Admin:** Người trực tiếp thực hiện quy trình vô hiệu hóa biến thể, tạo lô hoàn tiền và phê duyệt hoàn tiền sau khi đối soát ngân hàng.
- **Customer:** Người nhận lại khoản tiền hoàn vào tài khoản ngân hàng của họ.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)

- **Tech:** Chỉ những tài khoản gán quyền `MANAGER` hoặc `ADMIN` mới có thể sử dụng các API hoàn tiền.
- **Business:** Khi một yêu cầu hoàn tiền chuyển sang `COMPLETED`, đơn hàng tương ứng phải tự động chuyển sang trạng thái `REFUNDED` và trạng thái thanh toán chuyển sang `UNPAID` để chấm dứt vòng đời đơn.
- **Security:** Chỉ tạo yêu cầu hoàn tiền cho các đơn hàng đã thanh toán thành công thực tế (`payment_status = 'PAID'`).

---

## 5. ASSUMPTIONS (giả định — cần confirm)

- Giả định rằng việc chuyển tiền thực tế cho khách được thực hiện thủ công bằng chuyển khoản ngân hàng hoặc panel VNPay Merchant, hệ thống chỉ ghi nhận trạng thái DB sau khi Manager xác nhận đã chuyển tiền thành công.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)

- _Q1:_ Có cần tích hợp trực tiếp API hoàn tiền tự động của VNPay để thực hiện chuyển khoản tự động không? (Hiện tại: Manager đối soát và bấm duyệt thủ công).
