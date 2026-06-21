import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error_code: 'UNAUTHORIZED',
      message: 'Không tìm thấy token xác thực',
      request_id: crypto.randomUUID()
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error_code: 'TOKEN_INVALID',
      message: 'Token không hợp lệ hoặc đã hết hạn',
      request_id: crypto.randomUUID()
    });
  }
};

export const checkRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error_code: 'FORBIDDEN',
      message: 'Bạn không có quyền thực hiện thao tác này',
      request_id: crypto.randomUUID()
    });
  }
  next();
};
