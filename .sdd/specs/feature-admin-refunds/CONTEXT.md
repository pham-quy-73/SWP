# CONTEXT.md — Quản lý Hoàn tiền (Refunds Management Feature)
# Người viết: @antigravity | Ngày: 2026-06-23

## 1. PROBLEM STATEMENT
*   **Thiếu quy trình hoàn tất dòng tiền minh bạch:** Khi đơn hàng thanh toán qua VNPay bị hủy, nếu không kiểm soát chặt chẽ trạng thái và giá trị cần hoàn lại, hệ thống dễ rơi vào tình trạng mất mát tài chính hoặc chậm trễ trả tiền cho khách gây phản ứng xấu.
*   **Gặp khó khăn khi dừng bán mặt hàng kính:** Khi vô hiệu hóa một biến thể không còn sản xuất, cửa hàng còn tồn đọng nhiều đơn hàng đặt trước (pre-order) hoặc đơn chờ duyệt liên quan đến nó. Nếu không có cơ chế hoàn tiền tự động theo lô (Batch), nhân viên sẽ phải thao tác hủy/sửa từng đơn một cực kỳ cực khổ.

---

## 2. DOMAIN KNOWLEDGE
*   **Yêu cầu hoàn tiền (Refund request):** Bản ghi nghiệp vụ lưu trữ số tiền (`amount`), lý do (`reason`), mã đơn hàng mục tiêu (`order_id`) và trạng thái giải ngân (`status`).
*   **Lô hoàn tiền (Batch refund):** Quy gom nhiều đơn hàng bị hủy do cùng một nguyên do (ví dụ: dừng bán variant kính mắt) thành một tập danh sách để xử lý hoàn tiền một lượt, tránh thao tác nhiều lần.
*   **Trạng thái hoàn tiền (`Refund.status`):**
    - `PENDING`: Mới lập yêu cầu, cần đối soát ngân hàng.
    - `COMPLETED`: Đã thanh toán hoàn xong cho khách hàng.
    - `FAILED`: Lỗi giao dịch.

---

## 3. STAKEHOLDERS
*   **Manager / Admin:** Gom đơn lập lô hoàn tiền, kiểm tra tài khoản VNPay Merchant/Ngân hàng để gửi tiền hoàn và phê duyệt.
*   **Customer (Khách hàng):** Chờ nhận lại khoản tiền hoàn về tài khoản.

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Chỉ những người dùng có quyền `MANAGER` hoặc `ADMIN` mới có thể gọi tiếp cận API xử lý hoàn tiền.
*   **Vòng đời đơn:** Khi một yêu cầu hoàn tiền chuyển sang `COMPLETED`, đơn hàng tương ứng phải tự động chuyển sang trạng thái `REFUNDED` để khóa quy trình xử lý đơn.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng việc chuyển khoản hoàn tiền thực tế cho khách hàng được thực hiện thủ công hoặc qua panel Merchant VNPay, sau đó nhân viên sẽ nhấn nút Duyệt để đồng bộ trạng thái trên DB nội bộ.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần tích hợp trực tiếp API hoàn tiền của VNPay (VNPay Refund API) để thực hiện hoàn tiền tự động 100% tự động hay không? (Hiện tại: Xử lý mock/xác nhận đối soát thủ công).
