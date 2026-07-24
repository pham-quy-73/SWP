# PLAN.md — Implementation Plan: Bảng phân tích doanh số (Dashboard Analytics)

**Status:** Done (đã chỉnh sửa xong nguồn dữ liệu cảnh báo kho và các thống kê bán chạy)
**Author:** AI Agent
**Date:** 2026-06-15
**Spec ref:** `dashboard.spec.md`
**Risk Level:** Low (Truy vấn tổng hợp dữ liệu)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể

- **Realtime DB Aggregation:** Toàn bộ dữ liệu được tính toán động (dynamic query) khi có request. Sử dụng Mongoose Aggregation Pipeline để nhóm và tính toán top sản phẩm bán chạy từ bảng `orderitems`, kết nối với bảng `products` để lấy thông tin chi tiết.
- **GMT+7 Timezone Normalization:** Sử dụng chênh lệch giờ `7 * 60 * 60 * 1000` để quy đổi mốc thời gian bắt đầu hôm nay, bắt đầu tháng này, tháng trước về đúng giờ Việt Nam, đảm bảo tính toán doanh thu và đơn hàng hôm nay chính xác tuyệt đối.
- **Correct Stock Warning Source:** Khắc phục lỗi đếm kho cũ. Đếm lượng biến thể tồn kho thấp trực tiếp trên bảng `product_variants` bằng điều kiện `{ status: 'ACTIVE', quantity: { $lt: 10 } }` thay vì đếm trên bảng `products`.
- **Role-guarded Router:** Sử dụng middleware có sẵn `authenticate` và `requireRole(['MANAGER', 'ADMIN'])` ở cấp router để chặn các request trái phép.

### Pattern

| Pattern                      | Lý do                                                                                                                                             |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| MongoDB Aggregation Pipeline | Giúp tính toán lượng hàng bán ra và doanh thu của top sản phẩm trực tiếp từ DB, tối ưu hóa RAM và băng thông.                                     |
| Timezone Alignment Helper    | Tự tính toán date boundaries bằng tay theo UTC và trừ đi offset giúp code chạy độc lập, không phụ thuộc vào timezone cấu hình trên OS của server. |

---

## 2. COMPONENTS

### Backend (đã có)

| Tên                       | Trách nhiệm                                                   | Interface                                 |
| :------------------------ | :------------------------------------------------------------ | :---------------------------------------- |
| `dashboard.routes.js` ✅  | Khai báo API báo cáo                                          | GET `/revenue`                            |
| `DashboardController` ✅  | Logic tính toán doanh thu, tăng trưởng, top bán chạy, đếm kho | 1 method `getDashboardStats`              |
| `Order` model ✅          | Bảng dữ liệu đơn hàng                                         | status, total_amount, created_at          |
| `OrderItem` model ✅      | Bảng chi tiết đơn                                             | product_id, lens_id, quantity, unit_price |
| `ProductVariant` model ✅ | Bảng biến thể                                                 | status, quantity                          |

### Frontend (đã có)

| Tên                       | Trách nhiệm                                                     |
| :------------------------ | :-------------------------------------------------------------- |
| `ManagerDashboardPage` ✅ | Hiển thị các chỉ số tài chính, biểu đồ xu hướng và cảnh báo kho |

---

## 3. DATA FLOW

```
[Manager Xem Dashboard]
  Manager load trang → GET /api/dashboard/revenue (Bearer token)
  → authenticate + requireRole(['MANAGER', 'ADMIN'])
  → DashboardController.getDashboardStats:
      ├─ Tổng doanh thu từ các đơn hàng COMPLETED
      ├─ Tính toán date boundaries hôm nay, đầu tháng này, đầu tháng trước theo GMT+7
      ├─ Doanh thu tháng này vs tháng trước → tính % tăng trưởng
      ├─ Đếm số lượng đơn đang xử lý và đơn hàng mới hôm nay
      ├─ Đếm biến thể ACTIVE có tồn kho < 10
      ├─ Aggregate top 5 gọng kính bán chạy (chỉ tính đơn non-cancelled)
      ├─ Aggregate top 3 tròng kính bán chạy (chỉ tính đơn non-cancelled)
      ├─ Tính tỷ lệ đơn hàng có cắt tròng thuốc
      └─ Trả về HTTP 200 JSON code 1000
```

---

## 4. DEPENDENCIES

### Thứ tự implement

1. **(đã xong)** Sửa đổi nguồn dữ liệu cảnh báo tồn kho thấp khớp với spec (`ProductVariant` thay vì `Product`).
2. **(đã xong)** Cài đặt pipeline tính toán best sellers cho gọng và tròng kính.
3. **(đã xong)** Validate timezone GMT+7 trên môi trường server thực tế.

### External dependencies

- Không có. Tận dụng `mongoose`, `express`.

---

## 5. RISKS & MITIGATIONS

| #   | Rủi ro                                                | Xác suất | Impact | Mitigation                                                                                                                  |
| :-- | :---------------------------------------------------- | :------- | :----- | :-------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Sai lệch số liệu báo cáo do múi giờ server**        | High     | Med    | Thực hiện chuyển đổi UTC Date bằng tay bằng cách trừ/cộng offset GMT+7. Đã thực hiện.                                       |
| 2   | **Query aggregation làm chậm server khi dữ liệu lớn** | Med      | Med    | Tạo index cho các trường truy vấn thường xuyên như `{ status: 1, created_at: -1 }`. Đã thực hiện.                           |
| 3   | **Lỗi chia cho 0 khi tính % tăng trưởng**             | Low      | Low    | Cài đặt kiểm tra: nếu tháng trước doanh thu = 0 và tháng này > 0 thì trả về 100, nếu cả hai = 0 thì trả về 0. Đã thực hiện. |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có cần hỗ trợ lọc thống kê doanh số theo khoảng thời gian tùy chọn (Date Range Filter) không? _(Đề xuất: Chưa làm ở phiên bản này, hệ thống hiện tại đang tính mặc định theo hôm nay và tháng này/tháng trước)._
