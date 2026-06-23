# PLAN.md — Implementation Plan: Quản lý Hoàn tiền (Refunds Management)

**Status:** In-Progress (đã có code + UI, cần khớp endpoint spec)
**Author:** AI Agent
**Date:** 2026-06-23
**Spec ref:** `refunds.spec.md`
**Risk Level:** High (giao dịch tài chính, hủy đơn hàng)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Workflow 5 bước (state-machine trên Order/Refund):** Refund không phải thao tác đơn lẻ mà là pipeline:
  1. Tìm đơn `CANCELLED` đã `PAID` (hoàn tiền customer đổi ý).
  2. **HOẶC** vô hiệu hóa variant → lấy đơn bị ảnh hưởng → gom batch.
  3. Tạo Refund `PENDING` + chuyển Order → `CANCELLED`.
  4. Đối soát ngân hàng thủ công (out-of-band, theo assumption §5).
  5. Manager xác nhận → Refund `COMPLETED` + Order `REFUNDED` + Payment `UNPAID`.
- **Manual/Mock payment:** Theo CONTEXT §5, tiền thực tế chuyển qua Merchant VNPay panel, sau đó nhân viên bấm "Xác nhận" để đồng bộ trạng thái. Không gọi VNPay Refund API tự động (out-of-scope, xem CONTEXT Q1).
- **Atomic update chuỗi trạng thái:** Mỗi checkout phải cập nhật **3 collection** (Refund, Order, Payment) — cần MongoDB transaction (khuyến nghị) hoặc tối thiểu thứ tự ghi có thể rollback.

### Pattern
| Pattern | Lý do |
| :--- | :--- |
| Controller class `RefundController` | Đồng nhất với các feature khác. |
| Envelope `{ code:0, result }` | Đồng bộ toàn app. |
| Role-guard `requireRole(['MANAGER','ADMIN'])` | Đúng spec §7. |
| Error matrix (§8) | Mapping lỗi nghiệp vụ → HTTP code rõ ràng. |

---

## 2. COMPONENTS

### Backend (đã có — cần khớp tên route với spec)
| Tên | Trách nhiệm | Interface |
| :--- | :--- | :--- |
| `refund.routes.js` ⚠️ | Mount routes + guard | Xem §6 — lệch path với spec |
| `RefundController.getCancelledPaidOrders` ⚠️ | List đơn CANCELLED + PAID | **chưa mount route** |
| `RefundController.inActivateVariant` ✅ | Vô hiệu hóa variant | `PATCH /refund/variant/:variantId/in-activate` |
| `RefundController.getAffectedOrders` ✅ | Đơn bị ảnh hưởng | `GET /refund/affected-orders/:variantId` |
| `RefundController.createBatch` ✅ | Tạo lô refund PENDING | `POST /refund/create-batch` |
| `RefundController.getReadyRefunds` ✅ | List refund PENDING | `GET /refund/ready` |
| `RefundController.checkoutRefund` ✅ | Phê duyệt → COMPLETED | `POST /refund/:refundId/refund-checkout` |
| `Refund` model ⚠️ | Schema | Thiếu enum `FAILED` (spec §6) |

### Frontend (đã có)
| Tên | Trách nhiệm |
| :--- | :--- |
| `feature/manager/api/refund-api.js` ✅ | axios wrapper |
| `feature/manager/hooks/useRefunds.js` ✅ | React Query hooks |
| `feature/manager/components/refund/CustomerCancelModal.jsx` ✅ | UI hoàn tiền đơn customer hủy |
| `feature/manager/components/refund/CreateBatchModal.jsx` ✅ | UI tạo batch |
| `feature/manager/components/refund/ReadyRefundsModal.jsx` ✅ | UI list refund PENDING |
| `feature/manager/components/refund/RefundDetailModal.jsx` ✅ | UI chi tiết/duyệt refund |

---

## 3. DATA FLOW

```
[Path A — Customer đổi ý]
  Manager mở ManagerOrderPage → CustomerCancelModal
  → GET /api/refunds/cancelled-paid-orders? (⚠️ chưa có route)
  → RefundController.getCancelledPaidOrders:
        Payment.find({status:'PAID'}) → paidOrderIds
        Order.find({_id ∈ paidOrderIds, status:'CANCELLED'}) → items
  → chọn đơn → POST /api/refunds/create-batch { orderIds:[...] }
        → for each order: order.status='CANCELLED'; new Refund({PENDING}); save
  → Refund xuất hiện trong getReadyRefunds

[Path B — Dừng bán variant]
  Manager chọn variant → PATCH /refund/variant/:id/in-activate
  → GET /refund/affected-orders/:variantId
        → OrderItem.find({product_id: variant.productId}) → orderIds
        → Order.find({_id ∈ orderIds, status ∈ [PENDING,AWAITING_VERIFICATION,CONFIRMED]})
  → CreateBatchModal → POST /refund/create-batch { orderIds }

[Phê duyệt]
  ReadyRefundsModal → GET /refund/ready → list Refund PENDING
  → chọn → POST /refund/:refundId/refund-checkout
        → Refund.status='COMPLETED'
        → Order.findByIdAndUpdate(order_id, {status:'REFUNDED'})
        → Payment.findOneAndUpdate({order_id, status:'PAID'}, {status:'UNPAID'})
  → toast "Hoàn tiền thành công"
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Model `Refund`, `Order`, `Payment`, `OrderItem`, `ProductVariant`.
2. **(đã xong)** `RefundController` 6 method.
3. **(đã xong)** `refund.routes.js` (5 route mount, guard MANAGER/ADMIN).
4. **(GAP)** **Mount route `GET /cancelled-paid-orders`** — controller `getCancelledPaidOrders` đã viết nhưng routes đang thiếu (spec §5.1).
5. **(GAP)** **Thêm enum `FAILED` vào `Refund.status`** — spec §6 yêu cầu `['PENDING','COMPLETED','FAILED']`, model hiện chỉ có `['PENDING','COMPLETED']`.
6. **(GAP, quy ước tên route)** Spec §5.4 dùng `POST /api/refunds/checkout/:refundId` nhưng code mount `/refund/:refundId/refund-checkout`. Cần quyết định alias hay rename.
7. **(đã xong)** Frontend modals + hooks.
8. **(khuyến nghị)** Bọc `checkoutRefund` trong MongoDB session/transaction vì cập nhật 3 collection.

### External dependencies
- Không thêm thư viện. Dùng sẵn `mongoose` (hỗ trợ transaction nếu replica set).

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Checkout không atomic** — cập nhật Refund→COMPLETED nhưng Order/Payment fail giữa chừng → dữ liệu mâu thuẫn. | **High** | **High** | Bọc 3 thao tác trong `mongoose.startSession()` + `transaction.commit/abort`. Nếu MongoDB standalone (không replica), ít nhất phải ghi theo thứ tự và log lỗi. |
| 2 | **Tạo batch idempotent** — gọi create-batch 2 lần với cùng orderIds → 2 refund trùng. | Med | **High** | Trước khi tạo, check `Refund.exists({ order_id, status: { $in:['PENDING','COMPLETED'] } })` → skip nếu đã có. |
| 3 | **Endpoint lệch spec** — spec dùng `/api/refunds/...` + `/checkout/:refundId` nhưng code mount `/refund/...` + `/:refundId/refund-checkout`. FE có thể gọi sai. | **High** | Med | Quyết định rename/alias. Đồng bộ cả FE `refund-api.js`. |
| 4 | **Hoàn tiền đơn chưa thanh toán** — tạo Refund cho order chưa PAID → mất tiền. | Med | **High** | Trong `createBatch`: chỉ tạo Refund khi có Payment `status:'PAID'`; nếu không → bỏ qua hoặc trả lỗi `ORDER_NOT_PAID`. Code hiện fallback `o.total_amount` → **cần sửa**. |
| 5 | **Race condition variant in-activate** — giữa lúc gom đơn, có đơn mới mua variant đó. | Low | Med | In-activate variant trước khi lấy affected-orders; ProductVariant có field `status` để frontend chặn mua. |
| 6 | **Bỏ sót hoàn lại tồn kho** — spec checkoutRefund không nói trả lại kho, nhưng theo AGENTS.md quy tắc #8, đơn CANCELLED phải trả kho. | Med | Med | Đảm bảo luồng create-batch (chuyển Order→CANCELLED) đã gọi trả kho như background job trong `server.js`. |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Đổi route về đúng spec (`/api/refunds/checkout/:refundId` thay vì `/refund/:refundId/refund-checkout`) hay giữ path hiện tại + thêm alias? *(Đề xuất: thêm alias để không break FE hiện tại.)*
- **Q2:** Có dùng MongoDB transaction cho checkout không? Yêu cầu replica set. *(Đề xuất: có nếu DB hỗ trợ; nếu standalone thì skip + log.)*
- **Q3:** `createBatch` với order chưa PAID nên báo lỗi hay skip im lặng? *(Đề xuất: báo lỗi `ORDER_NOT_PAID`.)  *
- **Q4:** Có muốn thêm enum `FAILED` vào `Refund.status` + luồng mark FAILED khi checkout lỗi không? *(Spec §6 nêu, nên có.)*
- **Q5:** CONTEXT Q1 — có cần tích hợp VNPay Refund API tự động không? *(Mặc định: KHÔNG, xử lý thủ công.)*
