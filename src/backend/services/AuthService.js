import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import mailService from './MailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({
      $or: [{ email: userData.email.toLowerCase() }, { username: userData.username.toLowerCase() }]
    });

    if (existingUser) {
      const error = new Error('Tên đăng nhập hoặc địa chỉ email đã tồn tại');
      error.statusCode = 409;
      throw error;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = new User({
      ...userData,
      is_email_verified: false,
      verify_token: token,
      verify_token_expires: tokenExpires
    });

    await newUser.save();

    // Xử lý gửi email độc lập
    try {
      await mailService.sendActivationEmail(newUser.email, token);
    } catch (mailError) {
      console.log('LỖI GỬI EMAIL KÍCH HOẠT:', mailError.message);
    }

    const userObject = newUser.toObject();
    delete userObject.password;
    delete userObject.verify_token;
    delete userObject.verify_token_expires;
    delete userObject.google_id;

    return userObject;
  }

  // Chức năng gửi lại Email kích hoạt
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const error = new Error('Không tìm thấy tài khoản với email này');
      error.statusCode = 404;
      throw error;
    }

    if (user.is_email_verified) {
      const error = new Error('Tài khoản này đã được kích hoạt từ trước');
      error.statusCode = 400;
      throw error;
    }

    if (user.deleted_at !== null) {
      const error = new Error('Tài khoản của bạn đang bị khóa');
      error.statusCode = 403;
      throw error;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verify_token = token;
    user.verify_token_expires = tokenExpires;
    await user.save();

    await mailService.sendActivationEmail(user.email, token);
    return true;
  }

  async verifyEmail(token) {
    const user = await User.findOne({
      verify_token: token,
      verify_token_expires: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('Đường dẫn xác thực không hợp lệ hoặc đã hết hạn');
      error.statusCode = 400;
      throw error;
    }

    user.is_email_verified = true;
    user.verify_token = null;
    user.verify_token_expires = null;

    await user.save();
    return true;
  }

  async login(username, password) {
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
      error.statusCode = 401;
      throw error;
    }

    if (user.deleted_at !== null) {
      const error = new Error('Tài khoản của bạn đã bị khóa');
      error.statusCode = 403;
      throw error;
    }

    if (!user.is_email_verified) {
      const error = new Error('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra hộp thư điện tử');
      error.statusCode = 403;
      throw error;
    }

    return this.generateAuthResponse(user);
  }

  async googleLogin(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, given_name, family_name, picture } = payload;

      let user = await User.findOne({ $or: [{ google_id: googleId }, { email: email.toLowerCase() }] });

      if (user) {
        if (user.deleted_at !== null) {
          const error = new Error('Tài khoản của bạn đã bị khóa');
          error.statusCode = 403;
          throw error;
        }

        if (!user.google_id) {
          user.google_id = googleId;
          user.is_email_verified = true;
          await user.save();
        }
      } else {
        const randomHex = crypto.randomBytes(4).toString('hex');
        user = new User({
          username: `user_${randomHex}`,
          email: email.toLowerCase(),
          first_name: given_name || 'Khách',
          last_name: family_name || 'Hàng',
          avatar_url: picture || null,
          google_id: googleId,
          is_email_verified: true,
          role: 'CUSTOMER'
        });
        await user.save();
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      if (!error.statusCode) {
        error.message = 'Xác thực Google thất bại. Token không hợp lệ hoặc đã hết hạn.';
        error.statusCode = 401;
      }
      throw error;
    }
  }

  generateAuthResponse(user) {
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.verify_token;
    delete userObject.verify_token_expires;
    delete userObject.google_id;

    return { token, user: userObject };
  }
}

export default new AuthService();