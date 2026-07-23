# PLAN.md — Implementation Plan: Đánh giá Sản phẩm (Feedback / Reviews)

**Status:** Done (đã hoàn thành code backend và tích hợp upload ảnh)
**Author:** AI Agent
**Date:** 2026-07-23
**Spec ref:** `feedback.spec.md`
**Risk Level:** Low (CRUD nghiệp vụ cơ bản)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể
- **Secure Ownership & IDOR Protection:** Khi tạo/sửa/xóa đánh giá, hệ thống kiểm tra sự tồn tại của đơn hàng và đối chiếu `order.user_id` với `req.user._id` để chắc chắn khách hàng thực sự sở hữu đơn hàng đó.
- **Atomic Upsert:** Sử dụng cơ chế tìm kiếm trước khi lưu: `{ user_id, order_id, product_id }`. Nếu tìm thấy -> tiến hành update rating, comment và append danh sách ảnh mới. Nếu không -> tạo mới. Bảo đảm tính duy nhất bằng compound index trong MongoDB.
- **Dual-format Parsing:** Controller hỗ trợ tự động parse trường `feedback` nếu client gửi dạng JSON string (tiện khi dùng FormData để upload file cùng một lúc).
- **Public Reading, Protected Writing:** Route đọc (lấy đánh giá của sản phẩm) được mở công khai; các route thêm/sửa/xóa bắt buộc phải qua middleware `authenticate`.

### Pattern
| Pattern | Lý do |
| :--- | :--- |
| MongoDB Compound Index | `{ user_id: 1, order_id: 1, product_id: 1 }` đảm bảo tính toàn vẹn ở mức DB, tăng tốc độ truy vấn đối soát. |
| Multer Upload Array | Xử lý upload tối đa 5 file ảnh lên thư mục `/uploads/`. |

---

## 2. COMPONENTS

### Backend (đã có)
| Tên | Trách nhiệm | Interface |
| :--- | :--- | :--- |
| `feedback.routes.js` ✅ | Khai báo route + cấu hình upload ảnh | POST `/`, GET `/me`, GET `/product/:productId`, GET `/order/:orderId`, GET `/:feedbackId`, PUT `/:feedbackId`, DELETE `/:feedbackId` |
| `FeedbackController` ✅ | Logic CRUD, upsert, upload ảnh | 7 methods |
| `Feedback` model ✅ | Schema dữ liệu | rating enum, comment, images array, compound index |

---

## 3. DATA FLOW

```
[Gửi Đánh Giá Mới / Cập nhật]
  Customer upload ảnh + text → POST /api/feedbacks (Multipart FormData)
  → authenticate (gán req.user)
  → upload.array('images', 5) → lưu ảnh vào /uploads/
  → FeedbackController.createFeedback:
      ├─ Parse req.body.feedback nếu là JSON string
      ├─ Check order có thuộc user không → if not -> 404 (chặn enumerate)
      ├─ FindOne({ user_id: req.user._id, order_id, product_id })
      ├─ Nếu tìm thấy (Đã đánh giá trước đó):
      │    ├─ Cập nhật comment, rating, append images mới vào mảng
      │    └─ Save -> 200 "Cập nhật đánh giá thành công"
      └─ Nếu chưa tìm thấy:
           └─ Create new Feedback -> 201 "Gửi đánh giá thành công"
```

---

## 4. DEPENDENCIES

### Thứ tự implement
1. **(đã xong)** Thiết lập schema model `Feedback` kèm compound index.
2. **(đã xong)** Tích hợp `multer` middleware để xử lý file upload.
3. **(đã xong)** `FeedbackController` với các method CRUD bảo vệ ownership.
4. **(đã xong)** Đăng ký routes và kiểm thử.

### External dependencies
- `multer` (cho upload file ảnh).

---

## 5. RISKS & MITIGATIONS

| # | Rủi ro | Xác suất | Impact | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Spam upload file dung lượng lớn** | Med | Med | Multer cấu hình giới hạn dung lượng file hoặc sử dụng kiểm tra MIME type (chỉ nhận ảnh). |
| 2 | **Lộ thông tin đơn hàng người khác qua IDOR** | Med | **High** | Khi đơn hàng không thuộc về user, trả về lỗi chung 404 `ORDER_NOT_FOUND` giống hệt như đơn hàng không tồn tại để chặn dò ID đơn hàng. |
| 3 | **Ghi đè mất ảnh cũ khi cập nhật** | Low | Med | Khi cập nhật đánh giá, mảng ảnh mới được push nối tiếp vào ảnh cũ thay vì gán đè. |

---

## 6. QUESTIONS FOR HUMAN
- **Q1:** Có giới hạn dung lượng file ảnh upload tối đa là bao nhiêu không? *(Đề xuất: 5MB mỗi ảnh là phù hợp để tránh đầy đĩa cứng server.)*
