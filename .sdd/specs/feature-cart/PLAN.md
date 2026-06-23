# PLAN.md — Giỏ hàng (Cart Feature Implementation Plan)
# Người viết: @antigravity | Ngày: 2026-06-23

## 1. ARCHITECTURAL APPROACH
Hệ thống sử dụng mô hình giỏ hàng thuần túy phía client (Client-side Cart Pattern) để đạt hiệu năng xử lý cao nhất. 
*   **Zustand:** Lựa chọn làm công cụ quản lý state trung tâm ở client vì nó gọn nhẹ hơn Redux và có khả năng tương tác trực tiếp ngoài tầm React context.
*   **Zustand Persist Middleware:** Tự động hóa việc ghi nhận, chỉnh sửa và đồng bộ hóa trạng thái giỏ hàng vào `localStorage` của trình duyệt.
*   **Không Backend Sync:** Loại bỏ hoàn toàn sự phụ thuộc vào database để lưu giỏ hàng tạm, loại bỏ độ trễ mạng khi cập nhật số lượng hoặc xóa mặt hàng.

## 2. COMPONENTS
Tất cả các thành phần giao diện sẽ giao tiếp với store Zustand:
*   **Cart Store (Zustand Store):**
    - Trách nhiệm: Quản lý mảng phần tử giỏ hàng `items`, tổng tiền sản phẩm nháp, và các hàm nghiệp vụ (`addItem`, `removeItem`, `updateQuantity`, `clearCart`).
    - Interface: 
      - Input: `variantId`, `quantity`, `prescription`.
      - Output: State giỏ hàng hiện tại cùng các hàm callback.
*   **CartDrawer (React Component):**
    - Trách nhiệm: Cánh ngăn kéo trượt ra từ bên phải màn hình hiển thị danh sách sản phẩm đã thêm.
*   **CartItemRow (React Component):**
    - Trách nhiệm: Chi tiết dòng hiển thị biến thể (màu sắc, size) kèm input tăng giảm số lượng và form điền thông số toa kính thuốc.

## 3. DATA FLOW
1.  **Duyệt:** Người dùng nhấn nút "Thêm vào giỏ" ở trang danh sách/chi tiết.
2.  **Xử lý:** Zustand Store tiếp nhận `variantId` và thông tin toa kính. Nếu trùng biến thể và toa thuốc, tăng `quantity`, ngược lại thêm phần tử mới.
3.  **Lưu trữ:** Trạng thái giỏ được persist trực tiếp xuống LocalStorage (`vision-cart-storage`).
4.  **Phản hồi:** UI cập nhật số lượng tổng cộng ở góc Header và trượt mở CartDrawer để xác nhận.

## 4. DEPENDENCIES
*   **Thứ tự implement:**
    1. Thiết lập Zustand Store và cấu hình persist ghi file LocalStorage.
    2. Tạo UI CartDrawer cùng CartItemRow.
    3. Tích hợp nút đặt hàng ở trang ProductDetail.
*   **Thư viện ngoài:** `zustand` (chạy client-side).

## 5. RISKS & MITIGATIONS
*   **Rủi ro 1: Vượt quá số lượng tồn kho.**
    - Xác suất: Med | Biện pháp: Khi bấm tăng số lượng, frontend sẽ so sánh trực tiếp với trường `quantity` của biến thể sản phẩm đó.
*   **Rủi ro 2: Dữ liệu biến thể cũ tại Client.**
    - Xác suất: Med | Biện pháp: Khi tiến hành bấm nút Checkout, trang checkout sẽ gửi API yêu cầu tính toán tiền hàng (`POST /payment/orders/requirement`) để backend xác thực lại lượng tồn kho và giá bán mới nhất.
*   **Rủi ro 3: Xung đột thông số toa thuốc.**
    - Xác suất: Low | Biện pháp: Lưu trữ cấu trúc prescription tường minh dạng đối tượng JSON phẳng nhúng ngay trong item giỏ hàng.

## 6. QUESTIONS FOR HUMAN
*   Giới hạn tối đa số lượng (quantity) của 1 dòng sản phẩm trong giỏ hàng là bao nhiêu (ví dụ: tối đa 5 sản phẩm cùng loại trên mỗi đơn hàng)?
