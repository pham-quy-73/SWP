# Báo cáo kiểm thử Backend

Tài liệu thống kê bộ kiểm thử tự động cho backend (Express + Mongoose). Test chạy trên `vitest` với MongoDB in-memory (`mongodb-memory-server`), không chạm cơ sở dữ liệu thật.

## Cách chạy

```bash
# Chạy toàn bộ test
npx vitest run

# Chạy kèm báo cáo độ phủ
npx vitest run --coverage

# Chạy một nhóm cụ thể
npx vitest run tests/system         # system / end-to-end
npx vitest run tests/integration    # tích hợp theo route
npx vitest run tests/unit           # đơn vị (service/job)
```

Báo cáo HTML độ phủ được sinh tại `coverage/index.html`.

## Tổng quan

| Chỉ số | Giá trị |
|---|---|
| Test file | 16 |
| Tổng số test | 265 |
| Nhóm `describe` | 82 |
| Kết quả | 265 passed (0 failed) |

## Thống kê theo loại test

| Loại | File | Số test | Phạm vi |
|---|---|---|---|
| Smoke | 1 | 2 | Kết nối DB in-memory, route gốc `/` |
| Unit | 4 | 44 | Service & job tách biệt (Auth, Mail, Pricing, OrderCleanup) |
| Integration | 10 | 213 | Từng route HTTP theo phân hệ |
| System (E2E) | 1 | 6 | Hành trình đầu-cuối xuyên nhiều phân hệ |

## Thống kê theo file

| File | Số test |
|---|---|
| tests/smoke.test.js | 2 |
| tests/unit/AuthService.test.js | 22 |
| tests/unit/PricingService.test.js | 13 |
| tests/unit/orderCleanupJob.test.js | 6 |
| tests/unit/MailService.test.js | 3 |
| tests/integration/order.routes.test.js | 38 |
| tests/integration/product.routes.test.js | 38 |
| tests/integration/user.routes.test.js | 29 |
| tests/integration/auth.routes.test.js | 22 |
| tests/integration/payment.routes.test.js | 22 |
| tests/integration/refund.routes.test.js | 20 |
| tests/integration/address.routes.test.js | 14 |
| tests/integration/variant.routes.test.js | 13 |
| tests/integration/middleware.test.js | 10 |
| tests/integration/dashboard.routes.test.js | 7 |
| tests/system/customer-journey.system.test.js | 6 |

## Độ phủ mã nguồn

Ngưỡng tối thiểu cấu hình trong `vitest.config.js`: lines 90%, branches 85%, functions 90%, statements 90%. Tất cả đều đạt.

| Chỉ số | Độ phủ | Ngưỡng | Trạng thái |
|---|---|---|---|
| Statements | 93.47% (1060/1134) | 90% | Đạt |
| Branches | 85.43% (616/721) | 85% | Đạt |
| Functions | 98.09% (103/105) | 90% | Đạt |
| Lines | 93.79% (1012/1079) | 90% | Đạt |

### Độ phủ theo nhóm

| Nhóm | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| controllers | 92.97% | 85.66% | 100% | 93.06% |
| services | 97.67% | 92.06% | 100% | 99.20% |
| middlewares | 91.93% | 80.00% | 100% | 91.80% |
| jobs | 94.73% | 100% | 100% | 94.44% |
| routes | 98.75% | 100% | 66.66% | 98.73% |
| models | 87.50% | 83.33% | 100% | 90.90% |

## System test (End-to-End)

File: `tests/system/customer-journey.system.test.js`. Khác integration test (kiểm thử từng route riêng lẻ), nhóm này đi xuyên nhiều phân hệ như người dùng thật: qua đúng endpoint HTTP công khai, dùng token lấy từ luồng đăng nhập thật.

Các kịch bản:

1. **Vòng đời đơn hàng thành công** — Đăng ký → kích hoạt email → đăng nhập → duyệt catalog → lưu địa chỉ → báo giá → tạo đơn (gọng + tròng + đơn thuốc) → thanh toán mô phỏng SUCCESS → xem lại đơn `CONFIRMED`. Kiểm tra trừ tồn kho và khớp số tiền báo giá với tiền đơn thật.
2. **Thanh toán thất bại** — Đơn bị `CANCELLED` và tồn kho được hoàn lại.
3. **Vượt tồn kho** — Từ chối đặt đơn với `OUT_OF_STOCK`, tồn kho không bị trừ.
4. **Hủy đơn đã thanh toán → hoàn tiền** — Khách hủy đơn đã trả tiền, manager thấy đơn trong danh sách "đã hủy nhưng đã thanh toán", tạo lô hoàn tiền, xác nhận hoàn tiền → đơn chuyển `REFUNDED` + `UNPAID`.
5. **Phân quyền theo vai trò** — Khách bị chặn (403) ở route quản trị; admin/manager truy cập được.
6. **Thiếu token** — Route yêu cầu đăng nhập trả 401.

## Ghi chú

- Test chạy tuần tự (`fileParallelism: false`) vì dùng chung một database in-memory.
- Email và Google OAuth được mock ở `tests/setup.js`, không gọi ra dịch vụ ngoài.
- File upload trong test được dọn tự động ở `afterAll` (chỉ xóa file do test tạo, giữ nguyên file có sẵn trong `uploads/`).
- Các dòng chưa phủ còn lại chủ yếu là nhánh `catch (error) { next(error) }` và fallback cấu hình môi trường (ví dụ VNPay thiếu cấu hình) cần ép lỗi nội bộ mới chạm tới.
