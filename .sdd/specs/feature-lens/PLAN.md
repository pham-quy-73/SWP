# PLAN.md — Implementation Plan: Quản lý Tròng kính (Lens Management)

**Status:** Done (đã hoàn thành CRUD + tích hợp PricingService)
**Author:** AI Agent
**Date:** 2026-07-12
**Spec ref:** `lens.spec.md`
**Risk Level:** Medium (ảnh hưởng trực tiếp đến tính tiền đơn hàng)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Safe Soft-Delete:** API `DELETE /api/lenses/:id` thực hiện soft-delete bằng cách cập nhật `status = 'INACTIVE'`. Điều này đảm bảo tròng kính cũ vẫn tồn tại trong DB để populate thông tin các đơn hàng lịch sử mà không gây crash API.
- **Payload Sanitization & Custom Validator:** Sử dụng hàm helper `validateLensPayload` để kiểm tra dữ liệu đầu vào cho cả hai luồng: tạo mới (bắt buộc nhập các trường cốt lõi) và cập nhật (chỉ validate các trường có truyền lên).
- **Public Directory, Protected Management:** Các API đọc danh sách tròng kính mở công khai để khách hàng lựa chọn khi checkout. Các API ghi (tạo, sửa, xóa) được bảo vệ nghiêm ngặt bằng phân quyền role-level `['MANAGER', 'ADMIN']`.
- **Pricing Integration:** Giá tròng kính được PricingService đọc trực tiếp từ DB khi tính toán hóa đơn thanh toán hoặc tạo đơn.

### Pattern
| Pattern | Lý do |
| :--- | :--- |
| Soft-Delete Pattern | Giúp bảo toàn tính toàn vẹn tham chiếu (referential integrity) cho dữ liệu đơn hàng. |
| Dual-purpose Validator | Một hàm kiểm tra duy nhất cho POST/PUT giúp giảm trùng lặp code và đồng bộ hóa điều kiện ràng buộc. |

---

## 2. COMPONENTS

### Backend (đã có)
| Tên | Trách nhiệm | Interface |
| :--- | :--- | :--- |
| `lens.routes.js` ✅ | Khai báo các API tròng kính | GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id` |
| `LensController` ✅ | Logic CRUD, phân quyền, soft-delete | 5 methods |
| `Lens` model ✅ | Schema dữ liệu tròng kính | name, material, price, discountPrice, status |
| `PricingService` ✅ | Lấy giá tròng kính từ DB để thanh toán | `priceOrderItem` |

---

## 3. DATA FLOW

```
[Khách hàng xem danh sách]
  Customer vào trang đặt kính → GET /api/lenses (không truyền status)
  → LensController.getLenses:
      ├─ Mặc định gán query { status: 'ACTIVE' }
      ├─ Trả về danh sách tròng kính đang hoạt động
      └─ Sắp xếp theo ngày tạo giảm dần

[Manager Xóa tròng kính]
  Manager bấm Xóa tròng kính → DELETE /api/lenses/:id
  → authenticate + requireRole(['MANAGER', 'ADMIN'])
  → LensController.deleteLens:
      ├─ findByIdAndUpdate(id, { status: 'INACTIVE' })
      └─ Trả về 200 "Xóa tròng kính thành công (đã chuyển sang INACTIVE)"
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Model `Lens` với đầy đủ validator.
2. **(đã xong)** Tích hợp logic kiểm soát giá tròng trong `PricingService`.
3. **(đã xong)** `LensController` hoàn chỉnh logic.
4. **(đã xong)** Khai báo routes bảo mật và tích hợp với client frontend.

### External dependencies
- Không có thêm. Dùng sẵn `mongoose`, `express`.

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Crash API hóa đơn do mất dữ liệu tròng kính** | Low | High | Sử dụng soft-delete. Tuyệt đối không dùng `findByIdAndDelete`. Đã thực hiện. |
| 2 | **Đặt hàng tròng kính đã dừng bán** | Med | Med | `PricingService` kiểm tra `lens.status !== 'ACTIVE'` khi tạo đơn, nếu sai trả lỗi `INVALID_LENS`. Đã thực hiện. |
| 3 | **Ghi đè giá trị mặc định khi update rỗng** | Low | Med | Hàm `delete req.body.xxx` loại bỏ các trường không truyền hoặc rỗng trước khi thực hiện cập nhật DB. Đã thực hiện. |

---

## 6. QUESTIONS FOR HUMAN
- **Q1:** Có cần hiển thị các tròng kính `INACTIVE` trên trang admin của Manager để họ có thể kích hoạt hoạt động trở lại (`ACTIVE`) không? *(Đề xuất: Có, Manager có thể gọi API cập nhật status sang ACTIVE bất cứ lúc nào.)*
