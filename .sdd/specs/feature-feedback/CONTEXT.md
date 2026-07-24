# CONTEXT.md — Đánh giá Sản phẩm (Feedback / Reviews Feature)

## 1. PROBLEM STATEMENT
*   **Spam đánh giá hoặc đánh giá giả mạo:** Đối thủ hoặc khách hàng chưa từng mua sản phẩm có thể spam đánh giá tiêu cực làm ảnh hưởng đến uy tín sản phẩm của cửa hàng.
*   **Trùng lặp dữ liệu đánh giá:** Khách hàng bấm gửi nhiều lần hoặc đánh giá lại cùng một sản phẩm trong cùng một đơn hàng có thể tạo ra nhiều bản ghi thừa thãi trên DB.
*   **Bảo vệ quyền riêng tư và bản quyền:** Khách hàng cần quyền quản lý đánh giá của mình (chỉnh sửa nội dung hoặc xóa bỏ khi không còn muốn hiển thị), và người khác không được phép can thiệp.

---

## 2. DOMAIN KNOWLEDGE
*   **Đánh giá (Feedback):** Bản ghi gồm điểm số (rating 1-5), nội dung bình luận, hình ảnh đính kèm (tối đa 5 ảnh) liên kết trực tiếp với sản phẩm, đơn hàng và khách hàng.
*   **Ràng buộc Đơn hàng (Order Purchase Guard):** Khách hàng chỉ được phép đánh giá sản phẩm nếu sản phẩm đó nằm trong một đơn hàng hợp lệ do họ sở hữu.
*   **Tự động cập nhật (Upsert Logic):** Nếu khách hàng gửi đánh giá cho cặp sản phẩm và đơn hàng đã tồn tại bản ghi, hệ thống sẽ thực hiện cập nhật bản ghi cũ thay vì báo lỗi hoặc tạo bản ghi mới.

---

## 3. STAKEHOLDERS
*   **Customer:** Người viết đánh giá, tải ảnh trải nghiệm thực tế lên hệ thống.
*   **Guest (Khách vãng lai):** Đọc các đánh giá công khai trên trang sản phẩm để tham khảo.
*   **Cửa hàng:** Tăng độ uy tín của sản phẩm và dịch vụ thông qua phản hồi tích cực.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Chỉ những user đã đăng nhập mới có quyền tạo/sửa/xóa đánh giá của chính họ.
*   **Tech:** Khống chế rating trong khoảng từ `1` đến `5` (Mongoose validation).
*   **Tech:** Chỉ được upload tối đa 5 file ảnh minh họa cho mỗi đánh giá.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng hệ thống không yêu cầu trạng thái đơn hàng phải là `COMPLETED` mới được đánh giá, chỉ cần kiểm tra xem đơn hàng đó có thực sự thuộc về khách hàng hay không.
*   Giả định rằng khi một sản phẩm bị xóa, các đánh giá liên quan vẫn được giữ lại để lưu trữ lịch sử hoặc bị xóa cascade (hiện tại: giữ lại và hiển thị fallback nếu populate null).

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần tích hợp bộ lọc từ ngữ thô tục (profanity filter) tự động để chặn các bình luận phản cảm không? (Hiện tại: không).
*   *Q2:* Manager/Admin có cần quyền duyệt đánh giá trước khi cho hiển thị ra ngoài (review moderation) không? (Hiện tại: đánh giá hiển thị public lập tức sau khi gửi).
