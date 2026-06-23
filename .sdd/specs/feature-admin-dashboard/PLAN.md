# PLAN.md — Implementation Plan: Bảng phân tích doanh số (Dashboard Analytics)

**Status:** In-Progress (đã có code cơ sở, cần khớp spec)
**Author:** AI Agent
**Date:** 2026-06-23
**Spec ref:** `dashboard.spec.md`
**Risk Level:** Low (Read-only aggregation)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Backend-first, Read-only Aggregation:** Dashboard chỉ truy vấn dữ liệu, không ghi. Logic nghiệp vụ tập trung 100% trong `DashboardController` (Express/Mongoose), dùng aggregation pipeline hoặc `find().reduce()` để tính KPI thời gian thực.
- **Caching:** Chưa cần cache ( dữ liệu nhỏ, thời gian thực ưu tiên). Nếu sau này query chậm mới cân nhắc Redis hoặc memo ngắn hạn.
- **Phân quyền route-level:** Dùng middleware có sẵn `authenticate` + `requireRole(['ADMIN','MANAGER'])` áp dụng ở `router.use()` cho toàn bộ `/api/dashboard`.

### Pattern đã chọn
| Pattern | Lý do |
| :--- | :--- |
| Controller class (đã có sẵn `DashboardController`) | Đồng nhất với các feature khác (UserController, RefundController). |
| Centralized error via `next(error)` | Tận dụng `errorMiddleware` đã có. |
| Response envelope `{ code, message, result }` | Đồng nhất format toàn app (code 0 = thành công nhẹ; code 1000 = success hiện đang dùng). |

---

## 2. COMPONENTS

### Backend (đã có — cần hiệu chỉnh)
| Tên | Trách nhiệm | Interface (I/O) |
| :--- | :--- | :--- |
| `dashboard.routes.js` ✅ | Mount `GET /revenue` + guard role | Input: req.user → Output: handler |
| `DashboardController.getDashboardStats` ⚠️ | Tính KPI | Input: query (tuỳ chọn khoảng ngày) → Output JSON: `{ revenue, revenueGrowth, activeOrders, ordersToday, lowStockItems, ... }` |
| `authMiddleware` ✅ | Xác thực JWT + role | Có sẵn, không đổi |

### Frontend (đã có — không cần thay đổi lớn)
| Tên | Trách nhiệm |
| :--- | :--- |
| `feature/manager/page/dashboard/ManagerDashboardPage.jsx` ✅ | Render KPI cards (Doanh thu, Đơn mới, Cảnh báo kho) + navigation |
| `feature/manager/hooks/useManagerDashboard.js` ✅ | React Query hook gọi `/api/dashboard/revenue` |

---

## 3. DATA FLOW

```
Manager/Admin login (JWT) 
  → frontend useDashboardRevenue() 
  → GET /api/dashboard/revenue (Bearer token)
  → authenticate (verify JWT, gán req.user)
  → requireRole(['ADMIN','MANAGER'])
  → DashboardController.getDashboardStats:
        ├─ Order.find({ status:'COMPLETED', created_at ∈ [this month] }) → revenue
        ├─ Order.find({ status:'COMPLETED', created_at ∈ [last month] }) → growth %
        ├─ Order.countDocuments({ status ∈ [PENDING,AWAITING_VERIFICATION,CONFIRMED] }) → activeOrders
        ├─ Order.countDocuments({ created_at >= startOfToday }) → ordersToday
        └─ ProductVariant.countDocuments({ quantity < 10 })  ⚠️ GAP: hiện đang dùng Product.stock_quantity
  → res.json({ code:0, result:{...} })
  → React Query cache → ManagerDashboardPage render
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Model `Order`, `ProductVariant`, `Payment` — có sẵn.
2. **(đã xong)** `authMiddleware` + `requireRole` — có sẵn.
3. **(đã xong)** `DashboardController.getDashboardStats` — đã có logic cơ bản.
4. **(cần làm)** Khắc phục **GAP** với spec:
   - Spec §3 yêu cầu cảnh báo tồn kho thấp dựa trên **`product_variants.quantity < 10`**, nhưng code hiện đang dùng **`Product.stock_quantity < 10`**. Cần điều chỉnh để khớp spec.
   - Spec §4 yêu cầu response JSON có các field `totalRevenue`, `growthRate`, `totalOrders`, `lowStockItems`. Code hiện trả `revenue`, `revenueGrowth`, `activeOrders`, `ordersToday`, `lowStockItems`. → Quyết định: **giữ field hiện tại** vì frontend `ManagerDashboardPage` đang phụ thuộc; bổ sung alias tương thích nếu cần.
5. **(tuỳ chọn)** Export CSV/Excel — OUT OF SCOPE hiện tại (xem Open Question Q1 trong CONTEXT).

### External dependencies
- Không có thêm. Tận dụng: `express`, `mongoose`, `react-query` (frontend).

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Sai nguồn dữ liệu cảnh báo kho** — Code hiện đếm trên `Product.stock_quantity` thay vì `ProductVariant.quantity` theo spec → số liệu hiển thị sai thực tế tồn kho chi tiết. | **High** | Med | Đổi truy vấn sang `ProductVariant.countDocuments({ quantity: { $lt: 10 } })`. Tham chiếu: spec §3, §4. |
| 2 | **Query toàn bộ bảng** — `Order.find({ status:'COMPLETED' })` không phân trang; nếu bảng lớn sẽ chậm & tốn RAM. | Med | Low | Đổi sang aggregation `$match + $group` hoặc lọc theo tháng gần nhất. Đánh index `{ status:1, created_at:-1 }`. |
| 3 | **Tính growthRate khi tháng trước = 0** — chia cho 0. | Low | Low | Code hiện đã guard (`if (lastMonthRevenue > 0)`). Giữ nguyên. |
| 4 | **Field response lệch spec** — frontend có thể break nếu đổi tên field. | Med | Med | Bảo lưu field hiện tại (`revenue`, `revenueGrowth`...); nếu spec bắt buộc alias thì thêm cả hai. |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có muốn đổi field response về đúng tên spec (`totalRevenue`, `growthRate`, `totalOrders`) không? Việc này sẽ buộc cập nhật song song `ManagerDashboardPage.jsx` và `useManagerDashboard.js`. *(Đề xuất: giữ nguyên field hiện tại để tránh break FE.)*
- **Q2:** Cảnh báo kho thấp nên dựa trên `ProductVariant.quantity` (theo spec) hay `Product.stock_quantity` (theo code)? *(Đề xuất theo spec — variant-level chính xác hơn.)*
- **Q3:** Có cần thêm chỉ số `returnPending` (số refund PENDING) lên Dashboard không? Field đã có sẵn trong response (`returnPending: 0`) nhưng chưa wire với `Refund` collection.
