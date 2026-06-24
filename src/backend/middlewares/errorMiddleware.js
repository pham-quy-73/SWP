import crypto from 'crypto';

// Gắn request_id cho mỗi request ngay đầu pipeline để đưa vào response và log truy vết.
export const attachRequestId = (req, res, next) => {
  req.request_id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.request_id);
  next();
};

// Helper tạo lỗi "operational" (lỗi nghiệp vụ có chủ đích) để controller/middleware forward qua next().
// Lỗi có error_code được coi là an toàn để lộ message ra client; lỗi không có error_code coi là
// lỗi hệ thống bất ngờ → ẩn chi tiết ở production.
export const httpError = (status, error_code, message) =>
  Object.assign(new Error(message), { status, error_code });

export const notFound = (req, res, next) => {
  next(httpError(404, 'NOT_FOUND', `Không tìm thấy tài nguyên - ${req.originalUrl}`));
};

// Middleware xử lý lỗi tập trung: mọi lỗi từ các module đi qua đây và được chuẩn hóa về
// { success, error_code, message, request_id }. Ẩn stack trace ở production.
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  const request_id = req.request_id || crypto.randomUUID();
  const isOperational = Boolean(err.error_code);

  // Log kèm request_id để trace; stack chỉ ghi ở log server, không trả về client.
  console.error(`[${request_id}] ${req.method} ${req.originalUrl} -> ${statusCode}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Lỗi hệ thống bất ngờ ở production → trả message chung, tránh lộ chi tiết kỹ thuật nội bộ.
  const exposeMessage = isOperational || process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error_code: err.error_code || 'SERVER_ERROR',
    message: exposeMessage ? err.message : 'Đã xảy ra lỗi máy chủ',
    request_id
  });
};
