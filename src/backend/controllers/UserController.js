import User from '../models/User.js';

class UserController {
  /**
   * Lấy danh sách toàn bộ người dùng (cho Admin)
   */
  async getAllUsers(req, res, next) {
    try {
      const { role, search } = req.query;
      const query = {};

      if (role) {
        query.role = role.toUpperCase();
      }

      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { first_name: { $regex: search, $options: 'i' } },
          { last_name: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query).select('-password');
      return res.status(200).json({
        code: 0,
        result: users
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xem thông tin chi tiết một tài khoản
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ error_code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
      }
      return res.status(200).json({
        code: 0,
        result: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Thay đổi vai trò (Role) của người dùng
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.body.role || req.query.role;

      if (!role) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu thông tin vai trò mới' });
      }

      const allowedRoles = ['CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN'];
      if (!allowedRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Vai trò không hợp lệ' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error_code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
      }

      user.role = role.toUpperCase();
      await user.save();

      const userRes = user.toObject();
      delete userRes.password;

      return res.status(200).json({
        code: 0,
        message: 'Cập nhật vai trò người dùng thành công',
        result: userRes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật trạng thái người dùng (Khóa/Mở khóa thông qua deleted_at)
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body; // status = 'ACTIVE' hoặc 'INACTIVE'

      if (!status) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu trạng thái' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error_code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
      }

      // Khóa tài khoản bằng cách xét deleted_at = Date.now()
      if (status === 'INACTIVE') {
        user.deleted_at = new Date();
      } else {
        user.deleted_at = null;
      }

      await user.save();

      const userRes = user.toObject();
      delete userRes.password;

      return res.status(200).json({
        code: 0,
        message: status === 'INACTIVE' ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công',
        result: userRes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa tài khoản vĩnh viễn (cho Admin)
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ error_code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
      }
      return res.status(200).json({
        code: 0,
        message: 'Tài khoản người dùng đã được xóa vĩnh viễn khỏi hệ thống'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin cá nhân của người dùng đang đăng nhập
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      return res.status(200).json({
        code: 0,
        result: user
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();


