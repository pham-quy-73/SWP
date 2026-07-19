import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Vui lòng cung cấp token xác thực hợp lệ' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Người dùng không tồn tại hoặc đã bị xóa' });
    }

    if (user.deleted_at !== null) {
      return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Tài khoản của bạn đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Token token không hợp lệ hoặc đã hết hạn' });
  }
};

// Xác thực "mềm" cho các route đọc công khai: có token hợp lệ thì gán req.user
// để controller phân biệt Khách/Staff, không có (hoặc token hỏng) thì vẫn cho qua.
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (user && user.deleted_at === null) {
      req.user = user;
    }
  } catch (error) {
    // Token không hợp lệ → coi như khách vãng lai
  }
  next();
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Yêu cầu xác thực trước' });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ error_code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện hành động này' });
    }

    next();
  };
};
