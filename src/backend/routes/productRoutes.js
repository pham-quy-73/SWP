import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';
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

const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error_code: 'FILE_TOO_LARGE',
      message: 'Ảnh không được vượt quá 5MB',
      request_id: crypto.randomUUID()
    });
  }
  if (err && err.status === 415) {
    return res.status(415).json({
      success: false,
      error_code: 'UNSUPPORTED_MEDIA_TYPE',
      message: err.message,
      request_id: crypto.randomUUID()
    });
  }
  next(err);
};

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only routes
router.post('/', verifyToken, checkRole('ADMIN'), upload.single('image'), handleMulterError, createProduct);
router.put('/:id', verifyToken, checkRole('ADMIN'), upload.single('image'), handleMulterError, updateProduct);
router.delete('/:id', verifyToken, checkRole('ADMIN'), deleteProduct);

export default router;
