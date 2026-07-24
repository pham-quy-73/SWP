# CONTEXT.md — Quản lý thành viên (User Management Feature)

## 1. PROBLEM STATEMENT

- **Rủi ro bảo mật do quyền lực ngoài kiểm soát:** Nếu không có cơ chế quản trị và giám sát trực tiếp, nhân viên hoặc khách hàng có thể trượt khỏi ranh giới quyền hạn của họ (Ví dụ: khách hàng tự ý thay đổi trạng thái đơn, nhân viên thay đổi quyền gọng kính).
- **Khó khăn trong việc xử lý vi phạm:** Cửa hàng không có khả năng khóa đột ngột hoặc đình chỉ các tài khoản có dấu hiệu gian lận hoặc spam khi không có giao diện quản lý cụ thể.

## 2. DOMAIN KNOWLEDGE

- **Phân vai (Role):** 4 phân vai chính của hệ thống:
  - `CUSTOMER`: Người mua sản phẩm.
  - `MANAGER`: Người quản trị danh mục sản phẩm, biến thể, kho và dashboard.
  - `ADMIN`: Quản trị viên tối cao có toàn quyền quản trị người dùng.
- **Deleted At (deleted_at):** Thuộc tính dạng Date ghi nhận thời gian tài khoản bị vô hiệu hóa (Soft delete). Nếu bằng null, tài khoản hoạt động bình thường.

## 3. STAKEHOLDERS

- **Admin tối cao:** Có quyền thay đổi role, xóa tài khoản, bật/tắt hoạt động của tất cả người dùng khác.
- **Người chịu tác động:** Manager, Customer (Bị kiểm soát hoạt động trên hệ thống).

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)

- **Tech:** Chỉ có ADMIN mới được gán quyền tiếp cận danh sách middleware bảo vệ router quản trị `/api/users`. Manager và Sale không được phép CRUD phân vai của người khác.

## 5. ASSUMPTIONS (giả định — cần confirm)

- Giả định rằng Admin khi khóa tài khoản sẽ không làm mất các thông tin hóa đơn lịch sử liên quan đến tài khoản khách hàng đó (chỉ ẩn quyền truy cập).

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)

- _Q1:_ Có cần lưu giữ lịch sử nhật ký (Log) của Admin khi thực hiện đổi vai hoặc khóa tài khoản của người khác để dễ dàng tra cứu hay không? (Hiện tại: Chưa triển khai ghi Log admin).
