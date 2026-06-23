# Feature: Quản lý Hoàn tiền (Refunds Management) — FULL SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Tech Lead Approval:** Tech Lead  
**Date:** 2026-06-23  
**Risk Level:** High (Giao dịch hoàn tiền, trạng thái ví, hủy đơn hàng hàng loạt)  
**Related Specs:** `checkout.spec.md`

---

## 1. Business Context & Goals
Khi cửa hàng ngừng kinh doanh một gọng kính cụ thể, hoặc khi khách thanh toán thành công qua VNPay đổi ý muốn hủy đơn, hệ thống cần có cơ chế quản lý hoàn tiền rõ ràng. Cửa hàng Optics cung cấp quy trình hoàn trả tiền chuyên nghiệp qua các lô (Batch creation) dành cho Manager/Admin xử lý phê duyệt, đảo trạng thái đơn sang `REFUNDED` và cập nhật thông tin thanh toán hoàn nhằm bảo vệ quyền lợi người mua.

---

## 2. Stakeholders & User Personas
*   **Customer (Khách hàng):** Cần nhận lại tiền đầy đủ vào tài khoản ngân hàng khi được phê duyệt hoàn đơn.
*   **Manager / Admin (Quản trị viên):** Có quyền vô hiệu hóa biến thể, lọc đơn hàng bị ảnh hưởng, gom đơn tạo lô hoàn tiền và duyệt lệnh thanh toán hoàn tiền.

---

## 3. User Stories (all paths)
*   **Story 1 (Happy Path - Hoàn tiền đơn CANCELLED đơn lẻ):**  
    Là Manager, tôi mở danh sách các đơn hàng đã thanh toán thành công nhưng bị hủy (`CANCELLED`). Tôi nhấn nút khởi tạo hoàn tiền cho đơn đó, trạng thái ghi nhận yêu cầu `PENDING`.
*   **Story 2 (Happy Path - Hoàn tiền hàng loạt do dừng bán kính):**  
    Là Manager, tôi quyết định dừng bán một biến thể lỗi. Tôi nhấn "Vô hiệu hóa", hệ thống tập hợp danh sách đơn `PENDING`, `AWAITING_VERIFICATION`, `CONFIRMED` đang mua kính đó. Hệ thống tự tạo hàng loạt yêu cầu hoàn tiền `PENDING`.
*   **Story 3 (Happy Path - Phê duyệt thanh toán hoàn tất):**  
    Là Manager, tôi xem danh sách các yêu cầu hoàn tiền `PENDING`. Sau khi đối soát chuyển khoản ngân hàng, tôi bấm "Xác nhận hoàn tiền". Bản ghi Refund chuyển thành `COMPLETED`, Đơn chuyển thành `REFUNDED`, Payment tương ứng chuyển thành `UNPAID` (hoặc cập nhật trạng thái hủy).

---

## 4. Acceptance Criteria (EARS)
*   **Tạo lô hoàn tiền:**
    - **WHEN** Manager gửi yêu cầu tạo lô `POST /api/refunds/create-batch` với danh sách `orderIds` hợp lệ
    - **THE SYSTEM SHALL** cập nhật trạng thái tất cả đơn hàng đó sang `CANCELLED`, tạo bản ghi `Refund` tương ứng ở trạng thái `PENDING`.
*   **Xác nhận hoàn tiền:**
    - **WHEN** Manager gửi yêu cầu phê duyệt qua `POST /api/refunds/checkout/:refundId`
    - **THE SYSTEM SHALL** chuyển đổi trạng thái của Refund sang `COMPLETED`, chuyển trạng thái đơn hàng sang `REFUNDED` và cập nhật trạng thái payment tương ứng.

---

## 5. API Contracts

### 5.1 Lấy danh sách đơn hàng đã hủy cần hoàn trả tiền
*   **Endpoint:** `GET /api/refunds/cancelled-paid-orders`
*   **Query params:** `page`, `size`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": {
        "items": [
          { "orderId": "6704b...", "recipientName": "...", "paidAmount": 450000.0, "orderStatus": "CANCELLED" }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 1
      }
    }
    ```

### 5.2 Lấy danh sách các đơn hàng bị ảnh hưởng khi dừng bán biến thể
*   **Endpoint:** `GET /api/refunds/affected-orders/:variantId`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": [
        { "order": { "orderId": "6704b...", "recipientName": "...", "paidAmount": 450000.0, "status": "CONFIRMED" } }
      ]
    }
    ```

### 5.3 Tạo yêu cầu hoàn tiền hàng loạt (Batch)
*   **Endpoint:** `POST /api/refunds/create-batch`
*   **Payload:** `{ "orderIds": ["6704b..."] }`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "result": [
        { "_id": "6705c...", "order_id": "6704b...", "amount": 450000.0, "status": "PENDING" }
      ]
    }
    ```

### 5.4 Phê duyệt hoàn tiền thành công
*   **Endpoint:** `POST /api/refunds/checkout/:refundId`
*   **Response 200:**
    ```json
    {
      "code": 0,
      "message": "Hoàn tiền thành công",
      "result": null
    }
    ```

---

## 6. Data Models & DB Schema Changes
*   **Mô hình Refund (`Refund.js`):**
    ```javascript
    const RefundSchema = new mongoose.Schema({
      order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
      amount: { type: Number, required: true },
      reason: String,
      status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
      }
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
    ```

---

## 7. Non-Functional Requirements
*   **Security:** Chỉ `MANAGER` hoặc `ADMIN` mới được gán quyền gọi các API liên quan đến hoàn tiền.

---

## 8. Error Handling Matrix
| Error Code | HTTP Status | Mô tả | Hành vi hệ thống |
| :--- | :---: | :--- | :--- |
| `REFUND_NOT_FOUND` | 404 | Không thấy yêu cầu hoàn tiền để duyệt | Trả lỗi và từ chối |
| `ORDER_NOT_FOUND` | 404 | Không thấy thông tin đặt hàng | Báo lỗi |
| `VALIDATION_ERROR` | 400 | Thiếu danh sách orderIds khi batch | Từ chối tạo lô hoàn tiền |
