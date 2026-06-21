import Joi from 'joi';
import User from '../models/User.js';

const updateProfileSchema = Joi.object({
  first_name: Joi.string().trim().required().messages({ 'any.required': 'Họ không được để trống' }),
  last_name: Joi.string().trim().required().messages({ 'any.required': 'Tên không được để trống' }),
  phone: Joi.string().trim().allow(null, '').optional(),
  dob: Joi.date().allow(null, '').optional(),
});

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select(
        '-password -verify_token -verify_token_expires -google_id'
      );
      if (!user || user.deleted_at !== null) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch {
      return res.status(500).json({ success: false, error_code: 'SERVER_ERROR', message: 'Lỗi máy chủ' });
    }
  }

  async updateProfile(req, res) {
    const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: error.details.map((d) => d.message).join('; '),
      });
    }

    try {
      const user = await User.findOneAndUpdate(
        { _id: req.user.id, deleted_at: null },
        { first_name: value.first_name, last_name: value.last_name, phone: value.phone ?? null, dob: value.dob ?? null },
        { new: true, runValidators: true }
      ).select('-password -verify_token -verify_token_expires -google_id');

      if (!user) {
        return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch {
      return res.status(500).json({ success: false, error_code: 'SERVER_ERROR', message: 'Lỗi khi cập nhật thông tin' });
    }
  }
}

export default new UserController();
