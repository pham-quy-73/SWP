import Joi from 'joi';
import authService from '../services/AuthService.js';

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phone: Joi.string().allow(null, '').optional(),
  dob: Joi.date().allow(null, '').optional(),
  avatar_url: Joi.string().uri().allow(null, '').optional()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().required()
});

class AuthController {
  async register(req, res) {
    // Tôi đã bỏ chữ 'next' đi để không phụ thuộc vào hệ thống bắt lỗi chung nữa
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: error.details[0].message });
      }

      const user = await authService.register(value);
      return res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản.',
        user
      });
    } catch (error) {
      // 1. Ép hệ thống IN LỖI RA TERMINAL bằng mọi giá
      console.log("\n======================================");
      console.log("🚨 LỖI TẠI AUTH CONTROLLER (REGISTER):");
      console.log(error);
      console.log("======================================\n");

      // 2. Trả thẳng câu thông báo thật sự về cho giao diện (Frontend)
      return res.status(500).json({
        message: error.message || 'Lỗi hệ thống máy chủ, không thể đăng ký!'
      });
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu mã kích hoạt' });
      }

      await authService.verifyEmail(token);
      return res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
    } catch (error) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=verify_failed`);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: error.details[0].message });
      }

      const result = await authService.login(value.username, value.password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const { error, value } = googleLoginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: error.details[0].message });
      }

      const result = await authService.googleLogin(value.idToken);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();