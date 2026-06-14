```markdown
# PROJECT CONSTITUTION — Optics Management (Optics Management)

**Phiên bản:** 1.1.0  
**Trạng thái:** LOCKED (Chỉ thay đổi qua quy trình RFC và được Lead Agent phê duyệt)  
**Áp dụng cho:** Mọi AI Agent, mọi Developer, mọi Pull Request

---

## LAYER 1: HARD RULES (KHÔNG BAO GIỜ VI PHẠM)

| Mã          | Quy tắc                                                                                                                                                                                                              | Mức độ      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **SEC‑01**  | **Bảo mật mật khẩu:** Bắt buộc hash password bằng `bcrypt` với cost factor ≥ 10. Không lưu password dạng plaintext trong database, log, hay bất kỳ đâu.                                                              | NGHIÊM NGẶT |
| **SEC‑02**  | **Lưu trữ secret:** Tuyệt đối không hardcode API keys (VNPay, Cloudinary, JWT secret) trong source code. Chỉ dùng biến môi trường (`.env`) và không commit file `.env` vào Git.                                      | NGHIÊM NGẶT |
| **SEC‑03**  | **Xác thực endpoint:** Mọi endpoint thay đổi dữ liệu (POST, PUT, DELETE) đều phải có JWT Bearer token hợp lệ (trừ endpoint callback của VNPay). Kiểm tra quyền (role) trên từng API.                                 | NGHIÊM NGẶT |
| **SEC‑04**  | **Input validation:** Mọi dữ liệu từ client (body, query, params) phải được validate và sanitize. Cấm nối chuỗi để tạo MongoDB query – dùng Mongoose hoặc thư viện chính thức.                                       | NGHIÊM NGẶT |
| **SEC‑05**  | **VNPay callback:** Phải kiểm tra checksum (`vnp_SecureHash`) trước khi cập nhật trạng thái thanh toán. Không tin tưởng tuyệt đối vào tham số URL.                                                                   | NGHIÊM NGẶT |
| **DATA‑01** | **Soft‑delete:** Sử dụng trường `deleted_at` (kiểu `Date` hoặc `null`) cho các thực thể quan trọng (Product, User). Các truy vấn mặc định phải lọc `deleted_at: null`. Chỉ xóa vĩnh viễn logs hoặc dữ liệu tạm thời. | BẮT BUỘC    |

---

## LAYER 2: ARCHITECTURAL CONSTRAINTS (RÀNG BUỘC KIẾN TRÚC)

| Mã          | Quy tắc                                                                                                                                                                                        | Lý do                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **ARCH‑01** | **API First / Tài liệu:** Mỗi endpoint phải được mô tả trong file `API.md` (hoặc Swagger) TRƯỚC KHI viết code controller. Khi sửa API, cập nhật tài liệu trong cùng PR.                        | Đồng bộ giữa Frontend và Backend. |
| **ARCH‑02** | **Clean Architecture (rút gọn):** Tuân thủ luồng `Controller → Service → Model (Mongoose)`. **Service không được gọi trực tiếp Model của Service khác** – phải qua Service trung gian.         | Dễ bảo trì, test.                 |
| **ARCH‑03** | **Xử lý lỗi tập trung:** Dùng middleware `errorHandler` để bắt lỗi. Response luôn có định dạng `{ error_code, message, request_id }`. Không trả stack trace cho client (chỉ log nội bộ).       | Bảo mật, dễ debug.                |
| **ARCH‑04** | **Database indexing:** Tạo index cho các trường dùng trong `$lookup`, filter, sort (ví dụ `user_id`, `order_id`, `status`). Index được định nghĩa trong code model, không thêm thủ công ngoài. | Tránh N+1 query, tăng tốc độ.     |
| **ARCH‑05** | **Upload file:** Dùng middleware `multer` để kiểm tra kích thước (≤ 10MB) và loại file (JPEG, PNG, PDF). Upload lên Cloudinary (hoặc lưu local khi dev).                                       | An toàn, ổn định.                 |
| **ARCH‑06** | **Logging:** Dùng `winston` (Node.js) hoặc `logback` (Spring Boot). Các mức log: `error`, `warn`, `info`, `debug`. Cấm `console.log` ở môi trường production.                                  | Giám sát, debugging.              |
| **ARCH‑07** | **Cấm log thông tin nhạy cảm:** Tuyệt đối không log password, JWT token, secret keys, thông tin thẻ thanh toán, hoặc dữ liệu cá nhân nhạy cảm.                                                 | Bảo mật, tuân thủ GDPR.           |

---

## LAYER 2b: FRONTEND ARCHITECTURE CONSTRAINTS

| Mã        | Quy tắc                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FE‑01** | Tuân thủ luồng `Pages → Hooks → Services (API) → Axios`. **Cấm gọi `fetch`/`axios` trực tiếp trong component** (component chỉ gọi hook/service).                   |
| **FE‑02** | Trạng thái toàn cục (global state) chỉ dùng Context + `useReducer` (hoặc Zustand). Không dùng Redux trừ khi được Lead Agent phê duyệt.                             |
| **FE‑03** | Component được chia làm hai loại: `presentational` (dumb – chỉ nhận props, không gọi API, không chứa logic) và `container` (smart – chứa logic, gọi hook/service). |

---

## LAYER 3: ENGINEERING STANDARDS (TIÊU CHUẨN KỸ THUẬT)

| Mã         | Quy tắc                                                                                                                                                              | Ngưỡng chấp nhận                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **ENG‑01** | **Kiểm thử đơn vị (Unit test):** Các service chứa logic nghiệp vụ quan trọng (Order, Verification, Payment) phải có unit test.                                       | Độ bao phủ **≥ 80%** cho các service cốt lõi; toàn bộ backend **≥ 60%**. |
| **ENG‑02** | **Kiểm thử tích hợp (Integration test):** Mỗi endpoint quan trọng (tạo đơn, thanh toán callback, duyệt đơn) phải có ít nhất một integration test.                    | Bắt buộc cho các endpoint thuộc luồng chính.                             |
| **ENG‑03** | **Commit message:** Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/) với các type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. | Mọi commit đều phải đúng format.                                         |
| **ENG‑04** | **Code review:** Mỗi Pull Request phải có ít nhất một thành viên khác trong team review (không tự merge).                                                            | Bắt buộc, trừ khi được Lead Agent đặc cách.                              |
| **ENG‑05** | **Linting & Formatting:** Dùng ESLint (Node.js) và Prettier. Không commit code có lỗi lint.                                                                          | Chạy `npm run lint` trước mỗi commit.                                    |
| **ENG‑06** | **Database Migration:** Mọi thay đổi schema (thêm/xóa/sửa trường, index) phải có script riêng trong thư mục `/scripts/migrations` và được chạy thử trước khi commit. | Bắt buộc.                                                                |
| **ENG‑07** | **CI/CD (nếu có):** Pull Request không được merge nếu: lint fail, unit test fail, build fail. (Khuyến khích thiết lập GitHub Actions / GitLab CI).                   | Áp dụng khi CI pipeline được triển khai.                                 |

---

## AI AGENT SELF-CHECK PROTOCOL

**Trước khi submit code hoặc trả lời yêu cầu liên quan đến code, AI Agent phải tự kiểm tra theo checklist sau:**

1. [ ] **Đã đọc Layer 1 (HARD RULES) chưa?** Nếu chưa, đọc lại ngay.
2. [ ] **Có vi phạm bảo mật (SEC-01 → SEC-05) không?**
   - Kiểm tra password có được hash không?
   - Secret có bị hardcode không?
   - Endpoint có JWT không (trừ VNPay callback)?
   - Input đã được validate chưa?
   - VNPay callback có kiểm tra checksum không?  
     → Nếu vi phạm: **FIX ngay lập tức trước khi trả kết quả**.
3. [ ] **Có tuân thủ ARCH-01 (tài liệu API) không?**
   - Nếu thêm/sửa API, đã cập nhật `API.md` hoặc `SHARED_CONTEXT.md` chưa?
4. [ ] **Có vi phạm ARCH-02 (controller → service → model) không?**
   - Service có gọi trực tiếp model của service khác không?
5. [ ] **Có che chắn stack trace (ARCH-03) và log đúng mức (ARCH-06, ARCH-07) không?**
   - Ở môi trường production, không được lộ lỗi chi tiết.
   - Không log thông tin nhạy cảm.
6. [ ] **Nếu viết frontend, có tuân thủ FE-01 → FE-03 không?**
   - Có gọi API trực tiếp trong component không?
7. [ ] **Test coverage có đạt yêu cầu (ENG-01) không?**
   - Nếu thêm logic mới, phải viết test hoặc cập nhật test cũ.
8. [ ] **Commit message có đúng Conventional Commits không (nếu chuẩn bị commit)?**
9. [ ] **Nếu thay đổi database schema, đã tạo migration script (ENG-06) chưa?**

**Nếu tất cả đều ✅, có thể submit. Nếu có bất kỳ ❌, phải sửa ngay.**

---

## BẢNG TÓM TẮT TRÁCH NHIỆM

| Vai trò                | Trách nhiệm chính liên quan đến Constitution                                            |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Backend Developer**  | Đảm bảo SEC‑01→05, ARCH‑02, ARCH‑04, ARCH‑06, ARCH‑07, ENG‑01, ENG‑02, ENG‑06           |
| **Frontend Developer** | Đảm bảo gọi API đúng contract (ARCH‑01), tuân thủ FE‑01→FE‑03, xử lý token JWT (SEC‑03) |
| **Lead Agent**         | Giám sát tuân thủ, phê duyệt thay đổi Constitution, giải quyết xung đột.                |
| **Tất cả**             | Tuân thủ ENG‑03 (commit message), ENG‑04 (code review), ENG‑07 (CI/CD).                 |

---

## HIỆU LỰC VÀ SỬA ĐỔI

- **Hiệu lực:** Ngay sau khi được Lead Agent ký số và commit vào nhánh `main`.
- **Sửa đổi:** Chỉ thực hiện qua quy trình **RFC** (Request for Comments) – tạo issue, thảo luận, biểu quyết (cần 2/3 thành viên đồng ý), sau đó cập nhật phiên bản và ghi lại lý do thay đổi.

**Phiên bản 1.0.0** – phê duyệt ngày 2026-06-14 bởi Lead Agent.  
**Phiên bản 1.1.0** – cập nhật ngày 2026-06-14: bổ sung frontend rules, logging, migration, soft-delete chi tiết, coverage nâng cao, CI/CD rule.  
**Cam kết:** Mọi hành vi vi phạm đều có thể bị rollback ngay lập tức mà không cần báo trước.

---

_Tệp này là tài liệu bất biến, được quản lý phiên bản cùng mã nguồn trong thư mục `.sdd/`._
```
