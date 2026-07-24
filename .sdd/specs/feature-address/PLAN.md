# PLAN.md — Implementation Plan: Sổ Địa chỉ Giao hàng (Address Book)

**Status:** Done (đã hoàn thành CRUD + fallback default logic)
**Author:** AI Agent
**Date:** 2026-07-15
**Spec ref:** `address.spec.md`
**Risk Level:** Low (CRUD thông tin cá nhân)

---

## 1. ARCHITECTURAL APPROACH

### Cách tiếp cận tổng thể

- **Secure IDOR Guard:** Mọi API thao tác địa chỉ đều kiểm tra `user_id` sở hữu. Ví dụ, khi sửa/xóa, dùng `findOne` kèm theo điều kiện `{ _id: id, user_id: req.user._id }` để chặn truy cập trái phép.
- **Smart Default Mechanism:**
  - Khi tạo địa chỉ đầu tiên (count = 0), tự động chuyển `is_default = true`.
  - Khi đặt một địa chỉ làm mặc định, thực hiện `updateMany` tắt cờ `is_default` của tất cả địa chỉ khác cùng user, sau đó kích hoạt cờ của địa chỉ mục tiêu.
  - Khi xóa địa chỉ mặc định, tự động tìm địa chỉ còn lại được cập nhật gần nhất (`sort({ updatedAt: -1 })`) để gán lại cờ mặc định.
- **Composite Indexing:** Sử dụng index `{ user_id: 1, is_default: -1, updatedAt: -1 }` để tối ưu hóa tốc độ load danh sách địa chỉ (luôn xếp mặc định lên đầu, tiếp theo là địa chỉ mới nhất).

### Pattern

| Pattern               | Lý do                                                                    |
| :-------------------- | :----------------------------------------------------------------------- |
| Ownership Filtering   | Chống dò tìm hoặc thay đổi dữ liệu của người dùng khác (IDOR).           |
| Auto-fallback Default | Giữ trải nghiệm checkout liền mạch, không lo lỗi thiếu địa chỉ mặc định. |

---

## 2. COMPONENTS

### Backend (đã có)

| Tên                    | Trách nhiệm                               | Interface                                                                  |
| :--------------------- | :---------------------------------------- | :------------------------------------------------------------------------- |
| `address.routes.js` ✅ | Khai báo API sổ địa chỉ                   | GET `/`, POST `/`, PUT `/:id`, PUT `/:id/default`, DELETE `/:id`           |
| `AddressController` ✅ | Logic CRUD, gán default, fallback default | 5 methods                                                                  |
| `Address` model ✅     | Schema dữ liệu địa chỉ                    | user_id, label, recipient_name, phone_number, delivery_address, is_default |

---

## 3. DATA FLOW

```
[Xóa địa chỉ mặc định]
  Customer bấm Xóa địa chỉ mặc định → DELETE /api/addresses/:id
  → authenticate
  → AddressController.deleteAddress:
      ├─ Tìm và xóa: findOneAndDelete({ _id: id, user_id: req.user._id })
      ├─ Nếu địa chỉ bị xóa là mặc định (is_default === true):
      │    ├─ Tìm địa chỉ còn lại mới nhất: findOne({ user_id }).sort({ updatedAt: -1 })
      │    ├─ Nếu có: gán address.is_default = true và lưu lại
      │    └─ Nếu không: bỏ qua (danh sách rỗng)
      └─ Trả về 200 "Đã xóa địa chỉ"
```

---

## 4. DEPENDENCIES

### Thứ tự implement

1. **(đã xong)** Model `Address` với index và validator.
2. **(đã xong)** `AddressController` hoàn chỉnh logic.
3. **(đã xong)** Tích hợp API trong file route bảo mật.

### External dependencies

- Không có. Tận dụng `mongoose`, `express`.

---

## 5. RISKS & MITIGATIONS

| #   | Rủi ro                               | Xác suất | Impact | Mitigation                                                                                                        |
| :-- | :----------------------------------- | :------- | :----- | :---------------------------------------------------------------------------------------------------------------- |
| 1   | **IDOR sửa đổi địa chỉ người khác**  | Low      | High   | Bắt buộc đối chiếu `user_id` trong mọi truy vấn ghi/đọc chi tiết. Đã thực hiện.                                   |
| 2   | **Nhiều địa chỉ cùng mặc định**      | Low      | Med    | Sử dụng `updateMany` reset cờ mặc định của các địa chỉ khác trước khi gán mặc định cho địa chỉ mới. Đã thực hiện. |
| 3   | **Mất địa chỉ mặc định sau khi xóa** | Med      | Med    | Thực hiện cơ chế fallback tự động chuyển đổi mặc định sang bản ghi còn lại mới nhất. Đã thực hiện.                |

---

## 6. QUESTIONS FOR HUMAN

- **Q1:** Có cần validate định dạng số điện thoại giao hàng theo chuẩn nhà mạng Việt Nam không? _(Đề xuất: Có, nên validate để tránh shipper không liên lạc được.)_
