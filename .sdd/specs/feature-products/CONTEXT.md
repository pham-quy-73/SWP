# CONTEXT.md — Trang sản phẩm & Biến thể (Store & Products Feature)

## 1. PROBLEM STATEMENT
*   **Khó khăn trong việc tìm kiếm gọng kính phù hợp:** Các sản phẩm gọng kính thông thường có rất nhiều kích cỡ vật lý khác nhau (temple length, lens width, bridge width) và màu sắc đặc thù. Nếu không lọc chi tiết, khách hàng rất dễ mua nhầm gọng kính quá rộng/quá chật so với khuôn mặt.
*   **Trở ngại quản lý kho hàng:** Quản lý kho hàng thủ công cho hàng trăm SKU gọng kính phối hợp theo dòng/màu/kích thước cực kỳ phức tạp và dễ gây ra sai số về lượng tồn kho thực tế, dẫn đến nguy cơ bán khống sản phẩm đã hết hàng.

---

## 2. DOMAIN KNOWLEDGE
*   **Gọng kính cơ sở (Product):** Đại diện chung cho dòng kính (Ví dụ: Rayban Aviator), chứa thông tin thương hiệu, hình ảnh cơ bản, giá chung.
*   **Biến thể gọng kính (Product Variant):** Sản phẩm vật lý đích thực có mã tồn kho riêng biệt, định danh qua Màu sắc (`colorName`) và Kích thước (`sizeLabel` - bao gồm Lens Width, Bridge Width, Temple Length).
*   **Trạng thái kích hoạt (Status):** Cho phép tạm ngừng hiển thị kinh doanh sản phẩm (`INACTIVE`) mà không bắt buộc phải xóa bản ghi khỏi DB.

---

## 3. STAKEHOLDERS
*   **Người được lợi trực tiếp:** 
    - Khách hàng (lọc và tìm kiếm nhanh gọng kính chuẩn tỉ lệ mặt).
    - Quản lý cửa hàng (đồng bộ số lượng tồn kho theo từng biến thể SKU cụ thể cực kỳ chính xác).
*   **Quyền quyết định:** Manager & Admin (quản lý thêm bớt sửa xóa sản phẩm/variant).

---

## 4. CONSTRAINTS (ràng buộc không thể thay đổi)
*   **Tech:** Bắt buộc sử dụng cấu trúc quan hệ Mongoose giữa hai bảng độc lập: gọng kính `products` và biến thể `product_variants` (chứa liên kết `productId` tham chiếu đến `Product._id`).
*   **Phân quyền:** Chỉ tài khoản có phân vai `MANAGER` hoặc `ADMIN` mới được phép tác động chỉnh sửa (viết/sửa/xóa) lên API/Giao diện quản lý sản phẩm.

---

## 5. ASSUMPTIONS (giả định — cần confirm)
*   Giả định rằng gọng kính khi hết hàng tất cả các biến thể thì sẽ tự động hiển thị nhãn "Hết hàng" tại trang danh sách ngoại trừ trường hợp pre-order.
*   Giả định rằng dữ liệu thuộc tính bộ lọc như thương hiệu, chất liệu được điền chuẩn xác khi nhân viên nhập gọng kính mới lên hệ thống.

---

## 6. OPEN QUESTIONS (câu hỏi chưa có câu trả lời)
*   *Q1:* Có cần áp dụng cơ chế tự động hạ bộ lọc sang trạng thái ẩn (ngừng bán) nếu toàn bộ biến thể của sản phẩm chính đều có số lượng bằng 0 hay không? (Hiện tại: Vẫn cho hiển thị nhưng báo Hết hàng).
