# Feature: Checkout & Thanh toán VNPay — FULL SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Tech Lead Approval:** Tech Lead  
**Date:** 2026-06-23  
**Risk Level:** High (Thanh toán trực tuyến, Đồng bộ tồn kho kho, Background Worker)  
**Related Specs:** `cart.spec.md`, `products.spec.md`

---

## 1. Business Context & Goals
Checkout là tính năng then chốt kết nối giỏ hàng của Khách hàng với nghiệp vụ tạo hóa đơn bán hàng và cổng thanh toán trực tuyến. Mục tiêu là giúp giao dịch được hoàn tất nhanh chóng qua cổng VNPay Sandbox, quản lý chặt chẽ số lượng tồn kho của các biến thể kính mắt, tự động giải phóng tồn kho ảo của các đơn hàng chưa hoàn tất thanh toán để người mua sau có thể tiếp cận sản phẩm.

---

## 2. Stakeholders & User Personas
*   **Customer (Khách hàng):** Cần một quy trình thanh toán rõ ràng, hỗ trợ đính kèm ảnh toa kính thuốc dễ dàng, cho phép khôi phục thanh toán hoặc tự hủy đơn khi đổi ý.
*   **Sale Staff (Nhân viên bán hàng):** Tiếp nhận thông tin giao dịch chính xác (số tiền đã trả, mã giao dịch VNPay) để đóng gói và nâng trạng thái đơn hàng.
*   **Manager / Admin (Quản trị):** Theo dõi số lượng kho thực tế không bị quá bán (over-selling) và theo dõi báo cáo doanh thu từ các giao dịch thành công.

---

## 3. User Stories (all paths)
*   **Story 1 (Happy Path - Đặt hàng & Thanh toán thành công):**  
    Là khách hàng có giỏ hàng hợp lệ, khi tôi điền thông tin người nhận, đính kèm ảnh toa thuốc (tùy chọn) và nhấn "Đặt hàng", hệ thống sẽ trừ tồn kho của các biến thể ngay lập tức, chuyển hướng tôi sang VNPay. Tôi thanh toán thành công, hệ thống chuyển trạng thái đơn hàng sang `CONFIRMED`.
*   **Story 2 (Alternative Path - Khôi phục thanh toán):**  
    Là khách hàng đặt hàng xong nhưng lỡ tắt tab thanh toán VNPay khi đơn ở trạng thái `PENDING`, khi tôi truy cập lịch sử đơn hàng, tôi có thể nhấn nút "Thanh toán lại" để được chuyển hướng sang VNPay tiếp tục quá trình.
*   **Story 3 (Alternative Path - Hủy đơn chủ động):**  
    Là khách hàng có đơn hàng `PENDING` chưa thanh toán, khi tôi nhấn "Hủy đơn" tại lịch sử mua hàng, hệ thống cập nhật trạng thái đơn thành `CANCELLED` và tự động cộng trả lại tồn kho sản phẩm về MongoDB.
*   **Story 4 (Exception Path - Đơn hàng hết hạn thanh toán):**  
    Khi khách hàng tạo đơn hàng `PENDING` nhưng bỏ quên không thanh toán, tác vụ dọn dẹp chạy nền định kỳ (Worker) sẽ tìm kiếm, tự động hủy đơn sau 15 phút và trả lại số lượng tồn kho sản phẩm để tránh găm kho ảo.

---

## 4. Acceptance Criteria (EARS)
*   **Tạo đơn hàng:**
    - **WHEN** người dùng gửi yêu cầu `POST /orders/create` với tệp toa thuốc và thông tin giao hàng hợp lệ.
    - **THE SYSTEM SHALL** giảm trừ số lượng kho (`quantity` trong `product_variants`) tương ứng, tạo bản ghi `orders` và `order_items` với trạng thái `PENDING`, lưu trữ dữ liệu thanh toán nhúng ban đầu.
*   **Giới hạn trạng thái hủy đơn:**
    - **WHEN** chủ đơn gửi yêu cầu hủy đơn hàng `PUT /orders/:id/cancel`
    - **THE SYSTEM SHALL** chỉ cho phép thực thi nếu trạng thái hiện tại là `PENDING`. Sau khi hủy thành công, trả lại số lượng tồn kho variant sản phẩm tương ứng và trả về HTTP 200.
*   **Tác vụ dọn dẹp nền:**
    - **WHILE** máy chủ đang hoạt động, hệ thống chạy worker định kỳ (mỗi 5 phút).
    - **THE SYSTEM SHALL** tìm các đơn hàng có trạng thái `PENDING` được tạo cách thời điểm hiện tại hơn 15 phút, cập nhật trạng thái đơn thành `CANCELLED` và hoàn kho variant sản phẩm tương ứng.

---

## 5. API Contracts

### 5.1 Tạo đơn hàng mới
*   **Endpoint:** `POST /orders/create`
*   **Content-Type:** `multipart/form-data`
*   **Payload:** Field `orderInfo` (JSON dạng String) + Field `prescriptionImage` (Ảnh toa thuốc dạng file)
*   **Response 210:**
    ```json
    {
      "code": 0,
      "message": "Tạo đơn hàng thành công",
      "result": {
        "orderId": "6704b...",
        "order": { ... }
      }
    }
    ```

### 5.2 Khởi tạo link thanh toán VNPay
*   **Endpoint:** `POST /payment/checkout`
*   **Payload (JSON hoặc Query):** `{ "orderId": "6704b..." }`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
    }
    ```

### 5.3 Callback xử lý phản hồi từ VNPay
*   **Endpoint:** `GET /payment/vnpay-callback`
*   **Quyền:** Public (Gọi bởi VNPay IPN)
*   **Hành vi:** Xác minh chữ ký `vnp_SecureHash`.
    - Trùng khớp + thành công (`vnp_ResponseCode = '00'`): Cập nhật đơn thành `CONFIRMED`. Redirect về `${CLIENT_URL}/checkout/success?orderId=...`
    - Thất bại hoặc chữ ký sai: Cập nhật đơn thành `CANCELLED`. Redirect về `${CLIENT_URL}/checkout/failure`

---

## 6. Data Models & DB Schema Changes
*   **Mô hình Order (Mongoose):**
    ```javascript
    const OrderSchema = new mongoose.Schema({
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        enum: ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING'
      },
      deliveryAddress: String,
      recipientName: String,
      phoneNumber: String,
      total_amount: Number,
      prescription_text: String,
      prescription_image: String, // lưu path ảnh tải lên
      paymentInfo: {              // Nhúng trực tiếp
        method: { type: String, default: 'VNPAY' },
        status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
        transaction_id: String,
        payment_time: Date
      }
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
    ```

---

## 7. Non-Functional Requirements
*   **Security:** Tuyệt đối không cập nhật trạng thái đã thanh toán (`CONFIRMED`) nếu chữ ký checksum `vnp_SecureHash` gửi về không trùng khớp mã hóa SHA512.
*   **Tồn kho chính xác:** Việc trừ kho và hoàn kho phải sử dụng truy vấn Mongoose nguyên tố (atomic updates) hoặc kiểm soát đồng thời để tránh lỗi xung đột điều kiện dữ liệu (race condition) khi nhiều khách mua cùng lúc.

---

## 8. Error Handling Matrix
| Error Code | HTTP Status | Mô tả | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Thiếu thông tin hoặc sai định dạng payload | Trả lỗi và từ chối tạo đơn |
| `ORDER_NOT_FOUND` | 404 | Không thấy đơn hàng khi thanh toán / hủy | Báo lỗi không tìm thấy đơn |
| `INVALID_STATUS` | 400 | Trạng thái đơn hàng không hợp lệ | Từ chối cập nhật hoặc hủy đơn |

---

## 9. Edge Cases & Corner Cases
*   **Đóng tab khi thanh toán:** Được giải quyết bằng tính năng "Thanh toán lại" tại mục lịch sử đơn hàng của khách hàng.
*   **Tác vụ nền chạy trùng lặp:** Worker chạy ứng dụng Interval kiểm soát tốt khoảng quét dọn nên không xung đột dữ liệu.

---

## 10. Dependencies & Integration Points
*   **Multer middleware:** Chịu trách nhiệm nhận ảnh toa thuốc dạng nhị phân trước khi chuyển giao cho controller.
*   **VNPay Sandbox Merchant:** Nhận dữ liệu hóa đơn và cấp môi trường thanh toán giả lập.

---

## 11. Testing Requirements
*   **Kiểm thử tích hợp (Integration Test):** Kiểm tra tiến trình tạo đơn (trừ kho) -> mô phỏng callback VNPay trả về thành công -> chuyển trạng thái thành `CONFIRMED`.
*   **Kiểm thử tác vụ nền:** Xác minh các đơn hàng `PENDING` được tạo cách đây > 15 phút được tự động hủy thành công và hoàn kho variant tương ứng sau khi worker hoạt động.
