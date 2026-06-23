# TASKS.md — Danh sách task: Refunds Management (Manager/Admin)

**Spec ref:** `refunds.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo
**Lưu ý:** Risk Level HIGH — mỗi task chạm vào dòng tiền phải có test/verify.

| ID | Tên task | File(s) | Time | Deps | EARS Spec ref | Done Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R001** | ✅ Tạo `Refund` model với order_id, amount, reason, status | `src/backend/models/Refund.js` | 0.5h | — | §6 | Schema đúng; timestamps; ref → Order. |
| **R002** | ✅ `PATCH /refund/variant/:variantId/in-activate` — vô hiệu hóa variant | `refund.routes.js`, `RefundController.inActivateVariant` | 1.0h | R001 | §2 Story 2 | `ProductVariant.status='INACTIVE'`; 404 `VARIANT_NOT_FOUND` khi sai id. |
| **R003** | ✅ `GET /refund/affected-orders/:variantId` — đơn bị ảnh hưởng | `RefundController.getAffectedOrders` | 1.5h | R002 | §5.2, §2 Story 2 | Trả đơn có status ∈ {PENDING, AWAITING_VERIFICATION, CONFIRMED} và chứa variant.productId; kèm `paidAmount` từ Payment PAID. |
| **R004** | ✅ `POST /refund/create-batch` — tạo lô Refund PENDING | `RefundController.createBatch` | 2.0h | R003 | §4 (Batch), §5.3 | Validate `orderIds` mảng không rỗng (400 `VALIDATION_ERROR`); chuyển Order→CANCELLED; tạo Refund PENDING; trả list refund. |
| **R005** | ✅ `GET /refund/ready` — list Refund PENDING chờ duyệt | `RefundController.getReadyRefunds` | 1.0h | R004 | §2 Story 3 | Populate order + user; trả `amount`, `reason`, `bankInfo`. |
| **R006** | ✅ `POST /refund/:refundId/refund-checkout` — phê duyệt | `RefundController.checkoutRefund` | 2.0h | R005 | §4 (Xác nhận), §5.4 | Refund→COMPLETED, Order→REFUNDED, Payment PAID→UNPAID; 404 `REFUND_NOT_FOUND`. |
| **R007** | ⚠️ **(GAP)** Mount route `GET /api/refunds/cancelled-paid-orders` | `src/backend/routes/refund.routes.js` | 0.5h | R004 | §5.1 | Thêm dòng `router.get('/cancelled-paid-orders', RefundController.getCancelledPaidOrders)`. Controller đã viết sẵn. Verify FE `CustomerCancelModal` gọi được. |
| **R008** | ⬜ **(GAP)** Thêm enum `FAILED` vào `Refund.status` | `src/backend/models/Refund.js` | 0.25h | R001 | §6 | `enum: ['PENDING','COMPLETED','FAILED']`. Không phá dữ liệu cũ. |
| **R009** | ⬜ **(GAP, bảo mật)** Chỉ tạo Refund cho order có Payment PAID | `RefundController.createBatch` | 1.0h | R004 | §5.3, Risk #4 | Nếu không có Payment PAID → skip + collect `skippedOrders` vào response, hoặc trả 400 `ORDER_NOT_PAID`. Không fallback `total_amount`. |
| **R010** | ⬜ **(GAP)** Idempotency cho create-batch (tránh tạo refund trùng) | `RefundController.createBatch` | 1.0h | R004, R009 | Risk #2 | Trước khi tạo: `Refund.exists({ order_id, status:{ $in:['PENDING','COMPLETED'] } })` → skip nếu đã có. Response trả `created` + `skipped`. |
| **R011** | ⬜ **(GAP, quy ước tên)** Alias route `/checkout/:refundId` theo spec | `refund.routes.js` | 0.5h | R006 | §5.4 | Thêm alias `router.post('/checkout/:refundId', RefundController.checkoutRefund)` song song path cũ; cập nhật `refund-api.js` nếu cần. |
| **R012** | ⬜ **(khuyến nghị)** Bọc `checkoutRefund` trong MongoDB transaction | `RefundController.checkoutRefund` | 2.0h | R006 | Risk #1 | `session.startTransaction()` → commit khi cả 3 update (Refund, Order, Payment) ok; `abortTransaction` + trả 500 khi lỗi. Yêu cầu DB replica set. |
| **R013** | ⬜ **(khuyến nghị)** Hoàn lại tồn kho khi create-batch chuyển Order→CANCELLED | `RefundController.createBatch` | 1.5h | R004 | AGENTS.md #8 | Theo pattern `server.js` cleaner: tăng `Product.stock_quantity`/`ProductVariant.quantity` theo OrderItem. |
| **R014** | ✅ Implement UI hoàn tiền (FE) | `feature/manager/components/refund/*.jsx`, `api/refund-api.js`, `hooks/useRefunds.js` | 4.0h | R004-R006 | §2 Story 1-3 | 4 modal hoạt động: CustomerCancel (Path A), CreateBatch (Path B), ReadyRefunds (list PENDING), RefundDetail (duyệt). Toast phản hồi; refresh query sau mutation. |

### Tổng kết gap cần xử lý (ưu tiên)
1. **R007** (bắt buộc) — controller có nhưng route thiếu → FE lỗi.
2. **R008** — enum FAILED khớp schema spec.
3. **R009 + R010** — bảo mật dòng tiền (chỉ hoàn đơn đã PAID + idempotent).
4. **R011** — đồng bộ path với spec.
5. **R012, R013** — tính toàn vẹn dữ liệu (transaction + trả kho).
