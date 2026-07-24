# PLAN.md — Implementation Plan: Quản lý Hoàn tiền (Refunds Management)

**Status:** Done 
**Author:** AI Agent
**Date:** 2026-06-10
**Spec ref:** `refunds.spec.md`
**Risk Level:** High (Giao dịch dòng tiền)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể

- **5-Step Workflow Enforcement:** Tách biệt và tối ưu hóa quy trình hoàn tiền hàng loạt thông qua 5 endpoint backend tương ứng: Vô hiệu hóa -> Liệt kê đơn ảnh hưởng -> Tạo lô -> Liệt kê chờ duyệt -> Duyệt.
- **Cash Security Guard (PAID Check & Idempotency):**
  - Trong `createBatch`, hệ thống lọc và chỉ tạo yêu cầu hoàn tiền cho những đơn hàng thực sự có `payment_status === 'PAID'`.
  - Kiểm tra xem đơn hàng đó đã từng được tạo yêu cầu hoàn tiền `PENDING`/`COMPLETED` trước đó chưa bằng `Refund.exists` để chặn tạo trùng.
- **Atomic Multi-Collection Update:** Khi duyệt hoàn tiền, cần cập nhật 3 collection (`Refund` -> COMPLETED, `Order` -> REFUNDED, `Payment` -> UNPAID). Khuyến khích sử dụng MongoDB transaction nếu có replica set để bảo đảm tính nhất quán dữ liệu.
- **Automatic Inventory Recovery on Cancel:** Khi đơn hàng bị hủy do gom lô hoàn tiền, hệ thống tự động hoàn kho bằng cách tăng lại số lượng `quantity` của các biến thể tương ứng, tránh mất mát tồn kho của cửa hàng.

### Pattern

| Pattern                   | Lý do                                                                                                                  |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| Sequence Batch Processing | Xử lý tuần tự danh sách đơn hàng để đảm bảo tính chính xác của tồn kho và trạng thái thanh toán, tránh race condition. |
| Role-level Gatekeeping    | Chặn tất cả request không phải MANAGER hoặc ADMIN ở cấp router nhằm bảo vệ luồng tiền.                                 |

---

## 2. COMPONENTS

### Backend (đã có)

| Tên                   | Trách nhiệm                                                  | Interface                                                                                                                                                                        |
| :-------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `refund.routes.js` ✅ | Khai báo API hoàn tiền                                       | PATCH `/variant/:variantId/in-activate`, GET `/affected-orders/:variantId`, POST `/create-batch`, GET `/ready`, POST `/:refundId/refund-checkout`, PUT `/reject-cancel/:orderId` |
| `RefundController` ✅ | Logic CRUD hoàn tiền, gom lô, duyệt hoàn tiền, khôi phục đơn | 6 methods                                                                                                                                                                        |
| `Refund` model ✅     | Schema dữ liệu yêu cầu hoàn tiền                             | order_id, amount, reason, status                                                                                                                                                 |

---

## 3. DATA FLOW

```
[Phê duyệt Hoàn tiền]
  Manager xác nhận đã chuyển khoản cho khách → POST /api/refunds/:refundId/refund-checkout
  → authenticate + requireRole(['MANAGER', 'ADMIN'])
  → RefundController.checkoutRefund:
      ├─ Tìm và cập nhật Refund sang status = 'COMPLETED'
      ├─ Tìm Order liên quan:
      │    ├─ Cập nhật order.status = 'REFUNDED'
      │    ├─ Cập nhật order.payment_status = 'UNPAID' (đánh dấu đã trả lại tiền)
      │    └─ Push history: "Hoàn tiền thành công..."
      └─ Trả về HTTP 200 JSON code 0
```

---

## 4. DEPENDENCIES

### Thứ tự implement

1. **(đã xong)** Model `Refund` hoàn thiện.
2. **(đã xong)** `RefundController` hỗ trợ đối soát, gom lô và hoàn kho.
3. **(đã xong)** Mount các routes và đồng bộ hóa format endpoints với spec.

### External dependencies

- Không có thêm. Dùng sẵn `mongoose`, `express`.

---

## 5. RISKS & MITIGATIONS

| #   | Rủi ro                                                  | Xác suất | Impact | Mitigation                                                                                                                |
| :-- | :------------------------------------------------------ | :------- | :----- | :------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Lỗi cập nhật nửa chừng (Partial update error)**       | Med      | High   | Cập nhật Refund thành công nhưng Order thất bại. Khắc phục: sử dụng MongoDB transaction hoặc cập nhật Order trước Refund. |
| 2   | **Tạo trùng bản ghi hoàn tiền (Double Refund Request)** | Med      | High   | Kiểm tra sự tồn tại của Refund PENDING/COMPLETED cho đơn hàng trước khi tạo yêu cầu mới. Đã thực hiện.                    |
| 3   | **Mất mát dữ liệu tồn kho do quên hoàn trả**            | Med      | Med    | Tự động cộng lại số lượng vào `ProductVariant.quantity` khi hủy đơn trong luồng gom lô. Đã thực hiện.                     |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có cần hỗ trợ luồng Manager từ chối duyệt hoàn tiền (chuyển sang `FAILED`) không? _(Đề xuất: Hiện tại nếu lỗi thì giữ PENDING để đối soát lại, hoặc Admin có thể override trạng thái đơn.)_
