# CLAUDE.md

### Architecture Decisions (ADR)

#### ADR-001: Chọn JWT + Google OAuth2 thay vì Session

- **Lý do:** Hệ thống cần stateless API để có thể mở rộng và hỗ trợ cả cơ chế đăng nhập truyền thống lẫn đăng nhập qua các bên thứ ba tiện lợi.
- **Triển khai:** JWT access token, gửi qua header `Authorization: Bearer <token>`.

#### ADR-002: Chọn Mongoose ODM thay vì MongoDB Native Driver

- **Lý do:** Mongoose cung cấp schema verification (hợp thức hóa dữ liệu), middleware hooks (pre-save, post-save), và tự động ép kiểu dữ liệu giúp tránh các lỗi logic thao tác DB.
- **Triển khai:** Cấu hình db.js và các model tương thích chặt chẽ với MongoDB.

#### ADR-003: Nhúng dữ liệu Payment vào Order thay vì tách collection riêng

- **Lý do:** Mỗi hóa đơn chỉ được kích hoạt thanh toán trực tiếp một lần duy nhất qua cổng trực tuyến VNPay. Việc nhúng đối tượng thanh toán giúp tối ưu tốc độ kết xuất dữ liệu hóa đơn.
- **Triển khai:** Cập nhật thông tin giao dịch (`transaction_id`) và thời gian đóng giao dịch ngay trên trường thuộc tính của `Order`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
