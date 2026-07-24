# Feature: Bảng Phân tích Doanh số (Dashboard Analytics) — STANDARD SPECIFICATION

**Status:** Approved  
**Author:** AI Agent  
**Reviewer:** Tech Lead  
**Date:** 2026-06-15
**Priority:** Medium  
**Risk Level:** Low (Read-only aggregation, không thay đổi dữ liệu)  
**Related Specs:** `feature-orders`, `feature-products`  
**Cấu trúc:** Tuân theo `docs/spec.md` — 8 thành phần cốt lõi + EARS Notation.

---

## 1. Context & Goal (Bối cảnh & Mục tiêu)

### 1.1 Business Context

Ban giám đốc và quản lý cửa hàng Optics cần một giao diện tổng quát để nắm bắt sức khỏe tài chính và hoạt động kinh doanh hàng ngày. Dashboard cung cấp dữ liệu tổng hợp thời gian thực (realtime aggregation) từ các collection `orders`, `orderitems`, `products`, `product_variants` — không lưu cache, mỗi lần gọi đều truy vấn trực tiếp.

**Pain point hiện tại:**

- Quản lý phải tự tổng hợp doanh thu từ danh sách đơn hàng
- Không có cảnh báo sớm khi sản phẩm sắp hết hàng
- Không biết sản phẩm nào bán chạy nhất để điều chỉnh chiến lược nhập hàng
- Tỷ lệ đơn có cắt tròng kính vs chỉ mua gọng ảnh hưởng đến chiến lược dịch vụ

### 1.2 Goals

1. **Tổng quan doanh thu**: Doanh thu toàn bộ, tháng này, tỷ lệ tăng trưởng so với tháng trước
2. **Đơn hàng hoạt động**: Số đơn đang xử lý (PENDING + AWAITING_VERIFICATION + CONFIRMED), đơn mới hôm nay
3. **Cảnh báo tồn kho**: Số biến thể có tồn kho < 10 (ProductVariant.quantity)
4. **Sản phẩm bán chạy**: Top 5 gọng kính, top 3 tròng kính, tỷ lệ đơn có tròng kính

---

## 2. Actors & Roles (Tác nhân & Vai trò)

| Actor        | Vai trò    | Phân quyền                                                                 |
| :----------- | :--------- | :------------------------------------------------------------------------- |
| **MANAGER**  | Quản lý    | Toàn quyền xem Dashboard                                                   |
| **ADMIN**    | Quản trị   | Toàn quyền xem Dashboard                                                   |
| **CUSTOMER** | Khách hàng | **KHÔNG** có quyền truy cập (chặn bởi `requireRole(['ADMIN', 'MANAGER'])`) |

---

## 3. Functional Requirements (Yêu cầu chức năng — EARS)

> **Nguồn hành vi:**
>
> - Backend: `src/backend/controllers/DashboardController.js`
> - Routes: `src/backend/routes/dashboard.routes.js`

### 3.1 Ubiquitous (Luôn luôn đúng)

- **U-1:** THE Dashboard API SHALL only be accessible by authenticated users with role `ADMIN` or `MANAGER` (enforced by `router.use(authenticate, requireRole(['ADMIN', 'MANAGER']))`).

- **U-2:** ALL date calculations SHALL be normalized to Vietnam timezone (GMT+7) using offset `7 * 60 * 60 * 1000` to ensure "tháng này", "tháng trước", "hôm nay" align with business hours.

- **U-3:** THE system SHALL calculate revenue ONLY from orders with `status === 'COMPLETED'` (confirmed delivered, not cancelled/refunded).

### 3.2 Event-driven (Kích hoạt bằng sự kiện)

- **E-1:** WHEN Manager/Admin requests `GET /api/dashboard/revenue`, THE system SHALL perform the following aggregations and return:

  ```json
  {
    "code": 1000,
    "message": "Success",
    "result": {
      "revenue": 25000000,
      "revenueGrowth": 15.5,
      "activeOrders": 12,
      "ordersToday": 3,
      "returnPending": 0,
      "lowStockItems": 7,
      "bestSellers": {
        "topProducts": [...],
        "topLenses": [...],
        "prescriptionRatio": 42.5,
        "totalItemsSold": 150
      }
    }
  }
  ```

- **E-2:** WHEN calculating `revenue`, THE system SHALL sum `total_amount` of ALL orders with `status === 'COMPLETED'` (toàn bộ lịch sử, không giới hạn thời gian).

- **E-3:** WHEN calculating `revenueGrowth`, THE system SHALL:
  - Sum `total_amount` of COMPLETED orders created from start of this month (VN timezone)
  - Sum `total_amount` of COMPLETED orders created during last month
  - Calculate: `((thisMonth - lastMonth) / lastMonth) * 100`, rounded to 2 decimal places
  - IF `lastMonthRevenue === 0` AND `thisMonthRevenue > 0`: return `100`
  - IF both are `0`: return `0`

- **E-4:** WHEN calculating `activeOrders`, THE system SHALL count orders with `status ∈ ['PENDING', 'AWAITING_VERIFICATION', 'CONFIRMED']`.

- **E-5:** WHEN calculating `ordersToday`, THE system SHALL count ALL orders (any status) created from start of today (VN timezone).

- **E-6:** WHEN calculating `lowStockItems`, THE system SHALL count ProductVariants with `status === 'ACTIVE'` AND `quantity < 10`.

- **E-7:** WHEN calculating `bestSellers.topProducts`, THE system SHALL:
  - Aggregate OrderItems from orders NOT CANCELLED
  - Group by `product_id`, sum `quantity` as `totalSold`, sum `unit_price × quantity` as `totalRevenue`
  - Sort by `totalSold` descending, limit 5
  - Populate product info: `name`, `brand`, `imageUrl` (first element if array), `category`

- **E-8:** WHEN calculating `bestSellers.topLenses`, THE system SHALL:
  - Aggregate OrderItems from orders NOT CANCELLED, filtered by `lens_id !== null`
  - Group by `lens_id`, sum `quantity` as `totalSold`
  - Sort by `totalSold` descending, limit 3
  - Populate lens info: `name`, `brand`, `price`

- **E-9:** WHEN calculating `prescriptionRatio`, THE system SHALL:
  - Count total OrderItems from non-cancelled orders
  - Count OrderItems with `lens_id !== null` from non-cancelled orders
  - Calculate: `(lensItems / totalItems) * 100`, rounded to 1 decimal place
  - IF `totalItems === 0`: return `0`

### 3.3 State-driven (Khi ở trạng thái)

- **S-1:** WHILE Dashboard page is loading, THE UI SHALL display loading indicators for each metric card.

- **S-2:** WHILE a product referenced in bestSellers has been deleted, THE system SHALL display `'Sản phẩm đã xóa'` as fallback name.

### 3.4 Unwanted (Lỗi / Edge Case)

- **N-1:** WHERE no orders exist in the system, THE API SHALL return all metrics as `0` without error.

- **N-2:** WHERE `lastMonthRevenue === 0` AND `thisMonthRevenue === 0`, THE `revenueGrowth` SHALL be `0` (not `NaN` or `Infinity`).

- **N-3:** WHERE a referenced Product has been deleted from DB, THE `topProducts` entry SHALL show `{ name: 'Sản phẩm đã xóa', brand: '' }`.

---

## 4. Non-functional Requirements (Yêu cầu phi chức năng)

- **NFR-1 (Performance):** Dashboard performs multiple MongoDB queries and aggregations per request. Acceptable latency: `< 2000ms` with typical dataset (< 10,000 orders, < 1,000 products).

- **NFR-2 (Security):** Route-level authorization via `router.use(authenticate, requireRole(['ADMIN', 'MANAGER']))` — ALL endpoints under this router are protected.

- **NFR-3 (Accuracy):** Revenue calculations use raw `total_amount` from Order documents (no rounding). Growth percentage rounded to 2 decimal places, prescription ratio to 1 decimal place.

- **NFR-4 (Timezone):** All date boundaries (start of month, start of day) SHALL be computed in Vietnam timezone (UTC+7) to align with business reporting expectations.

---

## 5. Data Model (Mô hình dữ liệu)

Dashboard API is **read-only** — no dedicated collection. Data is aggregated from:

| Source Collection  | Fields Used                                                   | Purpose                              |
| :----------------- | :------------------------------------------------------------ | :----------------------------------- |
| `orders`           | `status`, `total_amount`, `created_at`                        | Revenue, active orders, orders today |
| `orderitems`       | `product_id`, `lens_id`, `quantity`, `unit_price`, `order_id` | Best sellers, prescription ratio     |
| `products`         | `name`, `brand`, `imageUrl`, `category`                       | Populate top products                |
| `product_variants` | `status`, `quantity`                                          | Low stock count                      |

### Response Schema

```json
{
  "code": 1000,
  "result": {
    "revenue": "Number — tổng doanh thu toàn bộ lịch sử (COMPLETED)",
    "revenueGrowth": "Number — % tăng trưởng tháng này vs tháng trước",
    "activeOrders": "Number — đơn đang xử lý",
    "ordersToday": "Number — đơn phát sinh hôm nay",
    "returnPending": "Number — luôn 0 (reserved cho future use)",
    "lowStockItems": "Number — biến thể tồn kho < 10",
    "bestSellers": {
      "topProducts": "[{ productId, name, brand, imageUrl, category, totalSold, totalRevenue }]",
      "topLenses": "[{ lensId, name, brand, price, totalSold }]",
      "prescriptionRatio": "Number — % đơn có cắt tròng",
      "totalItemsSold": "Number — tổng items đã bán (non-cancelled)"
    }
  }
}
```

---

## 6. Error Handling (Xử lý lỗi)

| Error                      | HTTP Status | Trigger                       | Hành vi hệ thống               |
| :------------------------- | :---------: | :---------------------------- | :----------------------------- |
| `UNAUTHORIZED`             |     401     | Thiếu hoặc JWT hết hạn        | Middleware chặn                |
| `FORBIDDEN`                |     403     | Role không phải MANAGER/ADMIN | Middleware chặn                |
| Internal aggregation error |     500     | MongoDB query fail            | Đẩy xuống `errorHandler` chung |

---

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)

- **Given** Manager đăng nhập thành công  
  **When** Mở trang Dashboard, gọi `GET /api/dashboard/revenue`  
  **Then** Hệ thống trả JSON chứa `revenue`, `revenueGrowth`, `activeOrders`, `ordersToday`, `lowStockItems`, `bestSellers`

- **Given** Hệ thống có 3 đơn COMPLETED trong tháng này (tổng 3M) và 2 đơn tháng trước (tổng 2M)  
  **When** Dashboard API được gọi  
  **Then** `revenueGrowth = 50.00` (tăng 50%)

- **Given** Có 5 ProductVariant ACTIVE với `quantity` lần lượt là `[3, 15, 8, 0, 50]`  
  **When** Dashboard API được gọi  
  **Then** `lowStockItems = 3` (variants có quantity 3, 8, 0 — tất cả < 10)

- **Given** Customer đăng nhập  
  **When** Gọi `GET /api/dashboard/revenue`  
  **Then** Hệ thống trả HTTP 403 FORBIDDEN

---

## 8. Out of Scope (Phạm vi ngoài)

- **KHÔNG** hỗ trợ lọc theo khoảng thời gian tùy chỉnh (date range picker).
- **KHÔNG** cache kết quả aggregation — mỗi request đều truy vấn realtime.
- **KHÔNG** hỗ trợ export báo cáo (PDF, Excel).
- **KHÔNG** hiển thị biểu đồ doanh thu theo ngày/tuần (line chart) — chỉ có tổng + tỷ lệ tăng trưởng.
- **KHÔNG** tính doanh thu theo danh mục sản phẩm (category breakdown).
- **KHÔNG** hiển thị thống kê khách hàng (new users, returning customers).
