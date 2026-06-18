# CONTEXT.md - Profile & RBAC
# Tech Stack: Node.js + Express + MongoDB (Mongoose) + React (Vite)
# Người lập: @Doan-Bao-Long | Ngày: 2026-06-14

## 1. PROBLEM STATEMENT
Hệ thống hiện tại chưa phân tách được quyền hạn giữa Khách hàng (Customer) và Quản trị viên (Admin), dẫn đến rủi ro bảo mật nếu người dùng truy cập trái phép. Khách hàng cũng chưa có nơi để quản lý thông tin cá nhân.

## 2. DOMAIN KNOWLEDGE
- **RBAC:** Phân quyền dựa trên vai trò.
- **Privilege Escalation:** Rủi ro attacker can thiệp payload HTTP chèn `{"role": "admin"}` để chiếm quyền.

## 3. STAKEHOLDERS
- **Khách hàng (Customer):** Cần trải nghiệm mượt mà, thông tin cá nhân được bảo mật.
- **Quản trị viên (Admin):** Cần đảm bảo không ai khác lọt được vào Dashboard quản trị.
- **Security Team:** Yêu cầu chặn mọi lỗ hổng leo thang đặc quyền từ phía API.

## 4. CONSTRAINTS (Ràng buộc không thể thay đổi)
- **Tech:** Tận dụng JWT hiện tại, không dùng thêm thư viện Auth mới.
- **UI/UX:** Tuân thủ 100% style Luxury/Minimalist (Glassmorphism, Tone kẽm).

## 5. ASSUMPTIONS (Giả định)
- Hệ thống Frontend hiện đang sử dụng Single Page Application (React) và có rủi ro mất state (State Stale) khi user bấm F5.
- Chưa tích hợp xác thực qua bên thứ 3 (OAuth/Social Login) trong phase này.