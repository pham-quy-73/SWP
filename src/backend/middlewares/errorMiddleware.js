export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.errorCode = 'NOT_FOUND';
  next(error);
};

// Helper tạo lỗi nghiệp vụ có mã chuẩn để ném vào next()
export const httpError = (statusCode, errorCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  return error;
};

// Format lỗi chuẩn toàn hệ thống: { error_code, message } (CONSTITUTION Điều 5)
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let errorCode = err.errorCode;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
  }

  if (!errorCode) {
    errorCode = statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';
  }

  res.status(statusCode).json({
    error_code: errorCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
