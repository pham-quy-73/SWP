# CONTEXT.md — Sổ Địa chỉ Giao hàng (Address Book Feature)

## 1. PROBLEM STATEMENT

- **Nhập đi nhập lại thông tin giao hàng:** Khách hàng mua kính thường xuyên phải nhập lại họ tên người nhận, số điện thoại, địa chỉ mỗi lần thanh toán, dẫn đến trải nghiệm người dùng kém và dễ sai sót thông tin.
- **Tranh chấp quyền sở hữu địa chỉ:** Người dùng A có thể sửa đổi hoặc xem trộm thông tin địa chỉ lưu trữ của người dùng B nếu hệ thống không phân quyền sở hữu địa chỉ chặt chẽ ở cấp API.
- **Xáo trộn địa chỉ mặc định:** Khi khách hàng có nhiều địa chỉ, hệ thống cần biết địa chỉ nào là ưu tiên để tự động điền khi thanh toán. Nếu xóa địa chỉ mặc định đó, hệ thống phải tự động gán địa chỉ khác làm mặc định thay thế để không làm gián đoạn trải nghiệm checkout.

---

## 2. DOMAIN KNOWLEDGE

- **Địa chỉ (Address):** Bản ghi gồm tên người nhận, số điện thoại nhận hàng, địa chỉ chi tiết, nhãn phân loại (Nhà riêng, Văn phòng...) gắn liền với ID người dùng sở hữu.
- **Địa chỉ Mặc định (Default Address):** Địa chỉ được ưu tiên hiển thị và tự động chọn khi khách hàng tiến hành thanh toán đơn hàng mới. Mỗi người dùng chỉ có tối đa một địa chỉ mặc định tại một thời điểm.
- **Cơ chế fallback mặc định (Fallback default):** Khi người dùng xóa địa chỉ mặc định hiện tại, hệ thống tự động tìm địa chỉ còn lại được cập nhật gần nhất và gán làm mặc định mới.

---

## 3. STAKEHOLDERS

- **Customer:** Quản lý danh sách địa chỉ nhận hàng của mình, chọn địa chỉ khi mua hàng nhanh chóng.
- **System (Checkout):** Tự động truy vấn địa chỉ mặc định của người dùng để điền thông tin người nhận khi khởi tạo đơn hàng.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)

- **Tech:** Chỉ những user đã đăng nhập mới có quyền thao tác trên API sổ địa chỉ.
- **Tech:** Ràng buộc bảo mật IDOR: Tuyệt đối không cho phép truy cập, chỉnh sửa hoặc xóa địa chỉ thuộc sở hữu của người dùng khác.
- **Business:** Luôn đảm bảo người dùng có ít nhất một địa chỉ mặc định nếu tổng số địa chỉ lưu trữ lớn hơn 0.

---

## 5. ASSUMPTIONS (giả định — cần confirm)

- Giả định rằng địa chỉ giao hàng được nhập dưới dạng văn bản tự do (freestyle text), không cần phân chia bắt buộc thành các trường Tỉnh/Thành phố, Quận/Huyện, Phường/Xã trong phiên bản này.

---
