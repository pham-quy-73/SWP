# Feature: Giỏ hàng (Cart) — LIGHT SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Date:** 2026-06-23  
**Risk Level:** Low (Client-side state only)

---

## 1. Business Context
Giỏ hàng đóng vai trò lưu trữ tạm thời các sản phẩm kính mắt và biến thể mà người dùng muốn mua trước khi thực hiện bước Checkout. Do tính chất quy mô cửa hàng nhỏ, giỏ hàng được quản lý hoàn toàn ở phía client để giảm tải cho database và tối ưu hóa trải nghiệm người dùng tức thì.

---

## 2. User Stories
*   **Story 1 (Thêm sản phẩm):** 
    Là khách hàng, tôi muốn thêm biến thể sản phẩm (màu sắc, kích thước) vào giỏ hàng từ trang danh sách hoặc chi tiết sản phẩm.
*   **Story 2 (Điều chỉnh giỏ hàng):** 
    Là khách hàng, tôi muốn thay đổi số lượng hoặc xóa bỏ sản phẩm khỏi giỏ hàng trực tiếp từ Drawer Giỏ hàng.
*   **Story 3 (Ghi nhận toa thuốc):** 
    Là khách hàng, tôi có thể điền thông tin độ khúc xạ mắt cận/viễn/loạn trực tiếp vào từng phần tử sản phẩm trong giỏ hàng.

---

## 3. Technical Implementation
*   **Phương thức quản lý:**
    - Sử dụng **Zustand** làm State Client kết hợp **persist middleware** để lưu trữ tự động vào `localStorage` qua key `vision-cart-storage`.
    - **Không có** cơ sở dữ liệu MongoDB hay API backend `/cart` nào được định nghĩa hoặc gọi tới từ phía frontend.
*   **Cấu trúc phần tử giỏ hàng (Cart Item):**
    ```javascript
    {
      productVariantId: String,  // ID của biến thể sản phẩm chọn mua
      productId: String,         // ID sản phẩm chính (phục vụ lấy ảnh, tên)
      quantity: Number,          // Số lượng chọn mua (không vượt quá stock_quantity thực tế)
      lensId: String || null,    // ID tròng kính đi kèm (tùy chọn)
      prescription: {            // Thông tin độ khúc xạ mắt (tùy chọn)
        od_sph: Number,          // Cầu mắt phải (SPH)
        od_cyl: Number,          // Trụ mắt phải (CYL)
        od_axis: Number,         // Trục mắt phải (AXIS)
        os_sph: Number,          // Cầu mắt trái (SPH)
        os_cyl: Number,          // Trụ mắt trái (CYL)
        os_axis: Number          // Trục mắt trái (AXIS)
      } || null
    }
    ```

---

## 4. Acceptance Criteria
*   **Thêm sản phẩm thành công:**
    - Thay đổi trạng thái giỏ hàng ngay lập tức trên UI và tăng số lượng tổng mặt hàng ở badge góc Header.
    - Nếu thêm cùng một `productVariantId` và cùng cấu hình `lensId` / `prescription`, hệ thống sẽ cộng dồn số lượng `quantity`.
*   **Ràng buộc số lượng tồn kho:**
    - Khách hàng không thể tăng `quantity` lớn hơn `stock_quantity` của mặt hàng đó.
*   **Tự động dọn dẹp khi tạo đơn:**
    - Khi đơn hàng được thanh toán/khởi tạo đơn tại trang Checkout thành công, Zustand state giỏ hàng sẽ tự động làm trống (`clearCart`).
