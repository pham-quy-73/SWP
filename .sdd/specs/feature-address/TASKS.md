# TASKS.md — Danh sách task: Sổ Địa chỉ Giao hàng (Address Book)

**Spec ref:** `address.spec.md` · **Plan ref:** `PLAN.md`
**Quy ước:** ✅ Done/Verified, ⚠️ Có nhưng lệch spec, ⬜ Todo

| ID       | Tên task                              | File(s)                                                            | Time | Deps | EARS Spec ref    | Done Criteria                                                                                         |
| :------- | :------------------------------------ | :----------------------------------------------------------------- | :--- | :--- | :--------------- | :---------------------------------------------------------------------------------------------------- |
| **A001** | ✅ Thiết lập `Address` model          | `src/backend/models/Address.js`                                    | 0.5h | —    | U-3, U-4         | Schema đúng; chứa các trường bắt buộc; composite index `{ user_id, is_default, updatedAt }`.          |
| **A002** | ✅ Phân quyền route bảo mật           | `src/backend/routes/address.routes.js`                             | 0.5h | —    | U-1, U-2         | Mount middleware authenticate cho tất cả các route trong phân hệ địa chỉ.                             |
| **A003** | ✅ API Lấy danh sách địa chỉ          | `src/backend/controllers/AddressController.js` (getAddresses)      | 1.0h | A001 | E-1              | Trả về danh sách địa chỉ của user đăng nhập, sort mặc định lên đầu, kế tiếp là cập nhật mới nhất.     |
| **A004** | ✅ API Tạo địa chỉ mới                | `src/backend/controllers/AddressController.js` (createAddress)     | 1.0h | A001 | E-2 -> E-4, S-1  | Validate dữ liệu đầu vào. Tự động set mặc định cho địa chỉ đầu tiên hoặc khi được yêu cầu.            |
| **A005** | ✅ API Cập nhật địa chỉ               | `src/backend/controllers/AddressController.js` (updateAddress)     | 1.0h | A001 | E-5, E-6         | Cho phép cập nhật thông tin địa chỉ, xử lý chuyển đổi cờ mặc định nếu được yêu cầu.                   |
| **A006** | ✅ API Đặt mặc định nhanh             | `src/backend/controllers/AddressController.js` (setDefaultAddress) | 0.5h | A001 | E-7, E-8         | API riêng để gán nhanh một địa chỉ làm mặc định và tắt cờ các địa chỉ khác.                           |
| **A007** | ✅ API Xóa địa chỉ & fallback default | `src/backend/controllers/AddressController.js` (deleteAddress)     | 1.0h | A001 | E-9 -> E-11, S-2 | Xóa địa chỉ sở hữu. Tự động gán mặc định cho địa chỉ còn lại mới nhất nếu địa chỉ bị xóa là mặc định. |
