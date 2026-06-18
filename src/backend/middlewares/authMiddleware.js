import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // EARS [Unwanted]: WHERE Token gửi lên không hợp lệ/hết hạn
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dùng .select('-password') để không bao giờ lộ mật khẩu đã hash vào req.user
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({ 
        success: false, 
        message: 'Người dùng thuộc về token này không còn tồn tại.' 
      });
    }

    // Gán user vào request để các hàm sau sử dụng
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn.' 
    });
  }
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // EARS [Unwanted]: WHERE user.role (VD: 'CUSTOMER') không nằm trong allowedRoles (VD: ['ADMIN', 'SALE'])
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này.' 
      });
    }
    next();
  };
};