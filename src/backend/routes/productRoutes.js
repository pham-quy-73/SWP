import express from 'express';
import multer from 'multer';
import { verifyToken, checkRole, optionalAuth } from '../middlewares/authMiddleware.js';
import { httpError } from '../middlewares/errorMiddleware.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Định dạng ảnh không hợp lệ. Chỉ chấp nhận jpg, png, webp'), { status: 415 }));
    }
  }
});

const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return next(httpError(400, 'FILE_TOO_LARGE', 'Ảnh không được vượt quá 5MB'));
  }
  if (err && err.status === 415) {
    return next(httpError(415, 'UNSUPPORTED_MEDIA_TYPE', err.message));
  }
  next(err);
};

// Public routes — optionalAuth: ẩn danh xem được, nhưng SALE/ADMIN (JWT hợp lệ) thấy thêm tồn kho thật
router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin-only routes
// TODO: TẠM TẮT PHÂN QUYỀN ĐỂ TEST — nhớ mở lại verifyToken + checkRole('ADMIN') trước khi commit/deploy
// router.post('/', verifyToken, checkRole('ADMIN'), upload.single('image'), handleMulterError, createProduct);
// router.put('/:id', verifyToken, checkRole('ADMIN'), upload.single('image'), handleMulterError, updateProduct);
// router.delete('/:id', verifyToken, checkRole('ADMIN'), deleteProduct);
router.post('/', upload.single('image'), handleMulterError, createProduct);
router.put('/:id', upload.single('image'), handleMulterError, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
