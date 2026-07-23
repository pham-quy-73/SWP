# PLAN.md — Implementation Plan: Quản lý Đơn hàng (Order Management)

**Status:** Done (đã có code đầy đủ cả BE lẫn FE)
**Author:** AI Agent
**Date:** 2026-07-23
**Spec ref:** `orders.spec.md`
**Risk Level:** Critical (giao dịch tài chính, tồn kho, đơn kính y tế)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Transaction-first, Fallback-ready:** Tạo đơn hàng bọc trong MongoDB session/transaction. Nếu DB standalone (lỗi code 20), fallback sang sequential execution + manual rollback.
- **Atomic Stock Decrement:** Trừ kho bằng `findOneAndUpdate({ quantity: { $gte: qty } }, { $inc: { quantity: -qty } })` — không bao giờ để kho âm, giải quyết race condition tự nhiên.
- **Single Source of Truth (Pricing):** `PricingService.priceOrderItem()` là nguồn giá duy nhất cho cả checkout requirement lẫn tạo đơn, đảm bảo không lệch giá.
- **State Machine + Admin Override:** Manager bị giới hạn bởi `VALID_TRANSITIONS`, Admin bypass toàn bộ với `is_override: true` + security audit log.
- **Background Cleanup:** `orderCleanupJob` chạy `setInterval(5min)`, xử lý đơn PENDING quá hạn.

### Pattern
| Pattern | Lý do |
| :--- | :--- |
| Controller class `OrderController` | Đồng nhất với các feature khác. |
| Envelope `{ code: 0, result }` | Đồng bộ format toàn app. |
| Role-guard `requireRole()` | Phân quyền ở route-level. |
| PricingService (shared) | Tái sử dụng giữa Payment requirement + createOrder. |
| `VALID_TRANSITIONS` dict | State machine rõ ràng, dễ mở rộng. |

---

## 2. COMPONENTS

### Backend (đã có)
| Tên | Trách nhiệm | Interface |
| :--- | :--- | :--- |
| `order.routes.js` ✅ | Mount routes + guard per-route | POST `/create`, GET `/me`, GET `/`, GET `/:id`, PUT `/:id/cancel`, PUT `/:id/status`, PUT `/:id/items/:itemId/prescription`, DELETE `/:id`, PUT `/:id/reject-cancel` |
| `OrderController` ✅ | Logic CRUD + state machine + prescription | 10 methods |
| `PricingService` ✅ | Tính giá từ DB | `priceOrderItem(item, session?)` |
| `orderCleanupJob` ✅ | Auto-cancel expired orders | `cleanupExpiredOrders()`, `startOrderStatusCleanupJob()` |
| `Order` model ✅ | Schema đơn hàng | Status enum, status_history, bank_info, payment fields |
| `OrderItem` model ✅ | Schema mục đơn hàng | Prescription subdocument |

### Frontend (đã có)
| Tên | Trách nhiệm |
| :--- | :--- |
| Customer: `OrderHistoryPage`, `OrderDetailPage` ✅ | Xem lịch sử + chi tiết đơn hàng |
| Manager: `ManagerOrderPage` ✅ | Quản lý tất cả đơn hàng, chuyển trạng thái |
| Shared: `useOrders` hooks ✅ | React Query hooks |

---

## 3. DATA FLOW

```
[Tạo đơn hàng]
  Customer checkout → POST /api/orders/create { items, recipientName, deliveryAddress, phoneNumber, bankInfo }
  → authenticate
  → OrderController.createOrder:
      ├─ Validate items, phone, bankInfo
      ├─ START TRANSACTION (or fallback)
      ├─ for each item:
      │   ├─ PricingService.priceOrderItem(item, session) → { variant, finalUnitPrice }
      │   ├─ ProductVariant.findOneAndUpdate({ _id, quantity: { $gte: qty } }, { $inc: { quantity: -qty } })
      │   └─ If null → ROLLBACK + return OUT_OF_STOCK
      ├─ new Order({ status:'PENDING', total_amount, ... })
      ├─ OrderItem.insertMany([...])
      └─ COMMIT → 201 { orderId, order }

[State Machine — Manager]
  PUT /api/orders/:id/status { status, note? }
  → requireRole(['MANAGER','ADMIN'])
  → OrderController.updateOrderStatus:
      ├─ if MANAGER: check VALID_TRANSITIONS[currentStatus].includes(newStatus)
      ├─ if ADMIN: bypass (is_override=true, console.warn [SECURITY AUDIT])
      ├─ if → CANCELLED: restore inventory
      ├─ if from CANCELLED →: decrement inventory
      └─ push status_history → save

[Cleanup Job]
  setInterval(5min) → cleanupExpiredOrders():
      Order.find({ status:'PENDING', payment_status:'UNPAID', created_at < 15min, payment_initiated_at < 30min|null })
      → for each: restore stock → status='CANCELLED' → history 'AUTO_EXPIRED:...'
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Models: `Order`, `OrderItem`, `Product`, `ProductVariant`, `Lens`.
2. **(đã xong)** `PricingService` — shared pricing logic.
3. **(đã xong)** `OrderController` — 10 methods đầy đủ.
4. **(đã xong)** `order.routes.js` — full CRUD + guard.
5. **(đã xong)** `orderCleanupJob` — background cleanup.
6. **(đã xong)** Frontend pages + hooks.

### External dependencies
- Không thêm. Tận dụng `express`, `mongoose`, `multer` (prescription image upload).

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Race condition tồn kho** — 2 khách mua cùng lúc variant chỉ còn 1. | **High** | **High** | Conditional decrement `{ quantity: { $gte: qty } }` — người thứ 2 nhận null → OUT_OF_STOCK. Đã implement. |
| 2 | **Transaction fail trên standalone MongoDB** — createOrder partial failure. | Med | **High** | Fallback: sequential execution + manual rollback (increment lại tất cả variant đã trừ). Đã implement. |
| 3 | **Cleanup job vs Payment race** — job hủy đơn trong lúc khách đang trả tiền trên VNPay. | Med | **High** | Gia hạn 30 phút nếu `payment_initiated_at` được set. Payment callback phát hiện `AUTO_EXPIRED` → phục hồi. Đã implement. |
| 4 | **Manager cố chuyển trạng thái không hợp lệ** — COMPLETED → PENDING. | Med | Med | `VALID_TRANSITIONS` dict chặn; Admin override ghi audit. Đã implement. |
| 5 | **Kho âm do rollback không đầy đủ** — lỗi giữa chừng khi rollback manual. | Low | **High** | Catch error trong vòng lặp rollback, log chi tiết. Đã implement. |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có cần gửi email/SMS khi đơn chuyển trạng thái (CONFIRMED, COMPLETED, CANCELLED)? *(Hiện tại: không. Đề xuất: bổ sung sau.)*
- **Q2:** Cleanup job 5 phút chạy `setInterval` — có cần chuyển sang cron job chuyên nghiệp hơn (node-cron, agenda)? *(Đề xuất: giữ setInterval cho đơn giản.)*
- **Q3:** Có cần hỗ trợ partial cancellation (hủy 1 item trong đơn nhiều item) không? *(Hiện tại: không — chỉ hủy toàn bộ đơn.)*
