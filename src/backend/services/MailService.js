import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();

class MailService {
  constructor() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️ CẢNH BÁO: Chưa tìm thấy SMTP_USER hoặc SMTP_PASS trong file .env!");
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendActivationEmail(toEmail, activationToken) {
    const activationUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${activationToken}`;

    const mailOptions = {
      from: `"OpticStore" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: '🎯 Kích hoạt tài khoản OpticStore của bạn',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #18181b; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 2px;">OPTICSTORE</h1>
          </div>
          <div style="padding: 40px 32px; background-color: #ffffff;">
            <h2 style="color: #18181b; margin-top: 0;">Chào mừng bạn đến với OpticStore!</h2>
            <p style="color: #71717a; line-height: 1.6; font-size: 15px;">
              Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quy trình xác thực và bắt đầu trải nghiệm dịch vụ của chúng tôi, vui lòng bấm vào nút kích hoạt bên dưới:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${activationUrl}" style="background-color: #18181b; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
                KÍCH HOẠT TÀI KHOẢN
              </a>
            </div>
            <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
              Nếu nút bấm trên không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt:<br/>
              <a href="${activationUrl}" style="color: #2563eb;">${activationUrl}</a>
            </p>
          </div>
        </div>
      `,
    };

    // 3. Gửi mail và trả về kết quả
    return await this.transporter.sendMail(mailOptions);
  }
}

export default new MailService();