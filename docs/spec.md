# Hướng Dẫn Viết Spec Chuẩn & Chuyên Nghiệp

Để xây dựng một bản đặc tả yêu cầu (Specification - Spec) đầy đủ, rõ ràng và giúp AI (hoặc thành viên phát triển) hiểu chính xác mà không tự "đoán" hoặc tự ý thêm bớt tính năng, hãy áp dụng cấu trúc dưới đây.

---

## 1. Cấu Trúc 8 Thành Phần Cốt Lõi

Một bản Spec tiêu chuẩn cần bao gồm đầy đủ 8 thành phần sau:

1. **Context & Goal (Bối cảnh & Mục tiêu)**
   - Giải thích lý do tính năng này tồn tại và vấn đề/nỗi đau (pain point) nó giải quyết cho người dùng hoặc hệ thống.

2. **Actors & Roles (Tác nhân & Vai trò)**
   - Xác định rõ những ai hoặc hệ thống nào sẽ tương tác với tính năng này, đi kèm với phân quyền cụ thể của từng đối tượng.

3. **Functional Requirements (Yêu cầu chức năng)**
   - Định nghĩa hành vi cụ thể của hệ thống. 
   - *Khuyến nghị:* Viết dưới dạng ngôn ngữ EARS để loại bỏ sự mơ hồ.

4. **Non-functional Requirements (Yêu cầu phi chức năng)**
   - Các chỉ số về hiệu năng, bảo mật, khả năng mở rộng.
   - **Lưu ý:** Các chỉ số phải đo lường được bằng số liệu cụ thể (ví dụ: thời gian phản ứng `< 200ms`, hỗ trợ tối thiểu `10,000` người dùng đồng thời).

5. **Data Model (Mô hình dữ liệu)**
   - Thiết kế cấu trúc dữ liệu, mối quan hệ giữa các thực thể, kiểu dữ liệu, các ràng buộc (constraints).

6. **Error Handling (Xử lý lỗi)**
   - Liệt kê toàn bộ các trường hợp lỗi có thể xảy ra (edge cases / unwanted events) và cách hệ thống phản hồi tương ứng.

7. **Acceptance Criteria (Tiêu chí nghiệm thu)**
   - Checklist để xác định tính năng đã hoàn thiện hay chưa.
   - Thường được viết theo kịch bản hành vi: **Given - When - Then**.

8. **Out of Scope (Phạm vi ngoài)**
   - **Cực kỳ quan trọng đối với AI:** Ghi rõ những gì hệ thống **KHÔNG** thực hiện ở giai đoạn này để ngăn AI tự ý phát sinh các tính năng dư thừa.

---

## 2. Ngôn Ngữ EARS Notation (Cách Viết Chống Mơ Hồ)

EARS (Easy Approach to Requirements Syntax) là tập hợp các mẫu câu giúp chuyển đổi yêu cầu từ ngôn ngữ tự nhiên sang dạng chuẩn hóa nhằm tránh hiểu lầm:

> [!IMPORTANT]
> Luôn sử dụng từ **SHALL (Sẽ/Phải)** cho các yêu cầu bắt buộc và giữ nguyên cấu trúc mẫu câu.

### 5 Mẫu Câu Chuẩn EARS

| Họa tiết (Pattern) | Cấu trúc cú pháp | Ví dụ cụ thể |
| :--- | :--- | :--- |
| **Ubiquitous**<br>*(Luôn luôn đúng)* | `THE [hệ thống] SHALL [hành động]` | **Hệ thống** luôn phải hiển thị tỷ giá ngoại tệ hiện tại trên thanh menu chính. |
| **Event-driven**<br>*(Kích hoạt bằng sự kiện)* | `WHEN [sự kiện], THE [hệ thống] SHALL [hành động]` | **Khi** người dùng bấm nút "Thanh toán", **hệ thống sẽ** chuyển hướng sang cổng thanh toán VNPay. |
| **State-driven**<br>*(Khi ở trạng thái)* | `WHILE [trạng thái], THE [hệ thống] SHALL [hành động]` | **Trong khi** người dùng chưa xác minh email, **hệ thống sẽ** giới hạn quyền truy cập các tính năng nâng cao. |
| **Optional**<br>*(Tùy chọn)* | `WHERE [tính năng được bật], THE [hệ thống] SHALL [hành động]` | **Ở những nơi** quốc gia hỗ trợ thanh toán qua Apple Pay, **hệ thống sẽ** hiển thị biểu tượng ví tương ứng. |
| **Unwanted**<br>*(Lỗi / Edge Case)* | `WHERE [điều không mong muốn xảy ra], THE [hệ thống] SHALL [phản ứng]` | **Trong trường hợp** số dư khả dụng không đủ, **hệ thống sẽ** từ chối giao dịch và hiển thị thông báo lỗi. |
