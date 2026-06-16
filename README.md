# 1. Link tạo App Password để cấu hình gửi Email
https://myaccount.google.com/apppasswords

# 2. Cấu hình gửi Email kích hoạt (Nodemailer)
SMTP_USER=email_cua_ban@gmail.com
# Mật khẩu ứng dụng (App Password) - KHÔNG PHẢI mật khẩu đăng nhập Gmail
SMTP_PASS=xxxxxxxxxxxxxxxx (các kí tự viết liền, không cách)

# 3. Tải các thư viện sau khi chạy code 
- Backend: npm install express mongoose dotenv joi bcrypt jsonwebtoken google-auth-library nodemailer
- Frontend