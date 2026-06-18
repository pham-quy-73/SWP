# PLAN.md - Implementation Strategy
# Generated from: SPEC v1.0.0

## 1. ARCHITECTURAL APPROACH
- **Backend:** Layered Architecture (Router -> Middleware -> Controller). Sử dụng Middleware pattern để chặn request không đủ thẩm quyền ngay từ vòng ngoài.
- **Frontend:** Higher-Order Component (HOC) Pattern. Tạo `<ProtectedRoute>` bọc ngoài các Route cần bảo vệ.

## 2. COMPONENTS TO BUILD/MODIFY
- `authMiddleware.js`: Verify JWT & Check Role (Backend).
- `userController.js`: Logic xử lý `getMe` và `updateProfile` (Backend).
- `AuthContext.jsx`: Quản lý state `user` toàn cục và hiệu ứng F5 (Frontend).
- `ProtectedRoute.jsx`: React Router Wrapper (Frontend).
- `ProfilePage.jsx`: UI Form (Frontend).

## 3. DATA FLOW
1. **Update Profile Flow:** UI Form -> `axios.patch` -> `authMiddleware.protect` -> `userController.updateProfile` (Strip 'role' field) -> MongoDB -> 200 OK -> UI show Success.
2. **Page Load Flow (F5):** App init -> `AuthContext` calls `GET /me` -> `isAuthLoading=false` -> `<ProtectedRoute>` evaluates role -> Render Component / Redirect.

## 4. DEPENDENCIES (Thứ tự implement)
1. Cập nhật Model Schema (Backend).
2. Middleware và API Controllers (Backend) -> Phải xong trước để FE có API test.
3. `AuthContext` và `ProtectedRoute` (Frontend).
4. `ProfilePage` UI (Frontend).

## 5. RISKS & MITIGATIONS
- **Rủi ro:** F5 liên tục làm nghẽn server do gọi API `GET /me`.
  - **Khả năng:** Low | **Impact:** Med | **Mitigation:** Ở Phase này chấp nhận gọi API. Phase sau dùng Cache.
- **Rủi ro:** Lộ `role` qua response API.
  - **Khả năng:** Low | **Impact:** High | **Mitigation:** Trả về `role` nhưng Backend tuyệt đối không tin tưởng (Trust no client), mọi hành động thay đổi data đều check lại từ Token/DB.
