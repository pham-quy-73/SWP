import User from '../models/User.js';

class UserController {
  /**
   * Lấy danh sách toàn bộ người dùng (cho Admin)
   * Hỗ trợ phân trang qua query `page` (1-based) và `limit`.
   * Response giữ field `result` là mảng user (backward-compatible) và bổ sung
   * `pagination` ở top-level để frontend render UI phân trang (spec §3 AC1, §4.1).
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

      // Phân trang: mặc định trang 1, 20 bản ghi/trang
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 20, 1);
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(query).select('-password').skip(skip).limit(limit),
        User.countDocuments(query)
      ]);

      return res.status(200).json({
        code: 0,
        result: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
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
   * - Chỉ nhận role từ body (spec §4.2), không nhận từ query để tránh CSRF qua URL.
   * - Chặn Admin tự đổi role chính mình (tránh tự hạ quyền gây kẹt hệ thống).
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Thiếu thông tin vai trò mới' });
      }

      // Chỉ nhận role từ body, không nhận từ query (G3 — tránh lỗ hổng CSRF qua URL)
      const allowedRoles = ['CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN'];
      if (!allowedRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Vai trò không hợp lệ' });
      }

      // G2: Chặn Admin thao tác lên chính mình
      if (req.user._id.toString() === id) {
        return res.status(403).json({
          error_code: 'SELF_ACTION_FORBIDDEN',
          message: 'Bạn không thể thay đổi vai trò của chính mình'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error_code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
      }

      user.role = role.toUpperCase();
      await user.save();

      // G5: Spec §4.2 chỉ trả về { _id, role }
      return res.status(200).json({
        code: 0,
        message: 'Cập nhật quyền thành công',
        result: { _id: user._id, role: user.role }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật trạng thái người dùng (Khóa/Mở khóa thông qua deleted_at)
   * - Chặn Admin tự khóa/mở chính mình (G2) để tránh tự khóa bản thân.
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body; // status = 'ACTIVE' hoặc 'INACTIVE'

      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Trạng thái không hợp lệ (giá trị hợp lệ: ACTIVE | INACTIVE)' });
      }

      // G2: Chặn Admin thao tác lên chính mình
      if (req.user._id.toString() === id) {
        return res.status(403).json({
          error_code: 'SELF_ACTION_FORBIDDEN',
          message: 'Bạn không thể thay đổi trạng thái của chính mình'
        });
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

      // G4 + G5: Spec §4.3 — message đúng chữ, không trả result
      return res.status(200).json({
        code: 0,
        message: 'Cập nhật trạng thái thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa tài khoản vĩnh viễn (cho Admin)
   * - Chặn Admin tự xóa chính mình (G2) để tránh xóa admin cuối cùng.
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // G2: Chặn Admin tự xóa chính mình
      if (req.user._id.toString() === id) {
        return res.status(403).json({
          error_code: 'SELF_ACTION_FORBIDDEN',
          message: 'Bạn không thể xóa tài khoản của chính mình'
        });
      }

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


