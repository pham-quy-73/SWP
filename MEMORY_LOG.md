# MEMORY_LOG.md — Auto-generated Memory Log

**Khởi tạo:** 2026-06-15  
**Mục đích:** Ghi lại các quyết định, thay đổi, bài học trong quá trình phát triển.  
**Quy tắc:** Claude Code (và các AI Agent khác) sẽ tự động thêm entry vào cuối file này.

---

## 2026-06-15

- Khởi tạo project structure, tech stack: Node.js + Express, MongoDB + Mongoose, React + JavaScript.
- Áp dụng JWT, bcrypt, Jest.
- Tách verification và refund thành collection riêng.
- Thống nhất snake_case cho JSON và DB fields.
- Luồng đơn hàng: PENDING → AWAITING_VERIFICATION → CONFIRMED → COMPLETED; hủy: CANCELLED, REFUNDED.
- Tạo bộ tài liệu .sdd/ gồm Constitution, Shared Context, AGENTS, CLAUDE, MEMORY_LOG.
