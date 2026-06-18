import Joi from 'joi';
import User from '../models/User.js';

// Khai báo chuẩn các trường ĐƯỢC PHÉP cập nhật
const updateProfileSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phone: Joi.string().allow(null, '').optional(),
  dob: Joi.date().allow(null, '').optional(),
  avatar_url: Joi.string().uri().allow(null, '').optional()
});

class UserController {
  
  // Lấy thông tin cá nhân (Phục vụ quá trình F5 của Frontend)
  async getMe(req, res, next) {
    try {
      // req.user đã được bóc tách và xác thực từ middleware `protect`
      return res.status(200).json({
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật thông tin Profile
  async updateProfile(req, res, next) {
    try {
      // Xác thực và BÓC TÁCH dữ liệu
      // stripUnknown: true sẽ tự động vứt bỏ các trường không có trong schema (chống leo thang đặc quyền)
      const { error, value } = updateProfileSchema.validate(req.body, { 
        stripUnknown: true 
      });

      if (error) {
        return res.status(400).json({ 
          error_code: 'VALIDATION_ERROR', 
          message: error.details[0].message 
        });
      }

      // Cập nhật vào Database
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        value,
        { new: true, runValidators: true }
      ).select('-password -verify_token');

      return res.status(200).json({
        message: 'Cập nhật thông tin thành công.',
        user: updatedUser
      });

    } catch (error) {
      // Có thể in log ra terminal giống như cách bạn làm ở AuthController nếu muốn
      console.log("\n======================================");
      console.log("🚨 LỖI TẠI USER CONTROLLER (UPDATE PROFILE):");
      console.log(error);
      console.log("======================================\n");

      next(error);
    }
  }
}

export default new UserController();