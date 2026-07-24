# CONTEXT.md — Giỏ hàng (Cart Feature)

## 1. PROBLEM STATEMENT
*   **Trải nghiệm mua sắm bị gián đoạn:** Khi duyệt sản phẩm gọng kính, người dùng cần lưu trữ các lựa chọn kính mắt (bao gồm các biến thể màu sắc, kích cỡ và cả thông tin đo mắt/to thuốc kèm theo) trước khi ra quyết định thanh toán cuối cùng.
*   **Quá tải tài nguyên database:** Nếu lưu trữ trạng thái giỏ tạm thời tại database sẽ phát sinh một số lượng lớn các thao tác ghi/xóa rác khi khách hàng thử thêm/bớt liên tục mà không bao giờ thực hiện thanh toán, gây chậm trễ cho các giao tác nghiệp vụ cốt lõi khác.

---

## 2. DOMAIN KNOWLEDGE
*   **Giỏ hàng (Cart):** Tập hợp danh sách các sản phẩm gọng kính tạm chọn mua.
*   **Biến thể sản phẩm (Product Variant):** SKU vật lý cụ thể (chứa màu sắc, kích cỡ và lượng tồn kho riêng) được tham chiếu bởi phần tử giỏ hàng.
*   **Toa thuốc đi kèm (Prescription):** Thông số khúc xạ chi tiết (độ cận SPH, độ loạn CYL, trục loạn AXIS cho cả 2 mắt) được chỉ định trên từng phần tử giỏ hàng.

---

## 3. STAKEHOLDERS
*   **Người được lợi trực tiếp:** Khách hàng (duyệt chọn kính mượt mà không độ trễ, lưu giỏ tự động kể cả khi reload trang).
*   **Người chịu ảnh hưởng nghiệp vụ:** Nhà phát triển (dễ dàng truy xuất thông số giỏ hàng để hiển thị hoặc đóng gói lập đơn hàng tại trang Checkout).

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Giỏ hàng bắt buộc được quản lý 100% ở phía client thông qua Zustand kết hợp persistence middleware lưu tại LocalStorage thiết bị (`vision-cart-storage`). Không được phép thiết kế database collection `carts` hay gửi bất kỳ request giỏ hàng nào lên backend.
*   **Tồn kho:** Không cho phép người dùng thêm số lượng vượt quá tồn kho thực tế của biến thể đang truy xuất.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng khách hàng không cần đồng bộ giỏ hàng chéo giữa các thiết bị khác nhau (ví dụ: giỏ hàng từ điện thoại không tự đồng bộ lên máy tính khi đăng nhập).
*   Giả định dữ liệu tồn kho biến thể sản phẩm phía Client được cập nhật đủ mới khi giỏ hàng thực hiện kiểm tra giới hạn số lượng đặt.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần hỗ trợ tính năng tự lưu trữ/đồng bộ giỏ hàng lên Database nếu khách hàng đã thực hiện đăng nhập hay không? (Hiện tại: Quyết định là 100% Client-side).
