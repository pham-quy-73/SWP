import express from 'express';
import multer from 'multer';
import path from 'path';
import ProductController from '../controllers/ProductController.js';
import ProductVariantController from '../controllers/ProductVariantController.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middlewares/authMiddleware.js';

// Chỉ nhận ảnh phổ thông, tối đa 10MB/file, giữ extension để static route trả đúng Content-Type
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error('Chỉ chấp nhận ảnh PNG, JPG, JPEG hoặc WEBP');
    error.statusCode = 400;
    error.errorCode = 'INVALID_FILE_TYPE';
    cb(error);
  },
});

const router = express.Router();

// Route lấy danh sách sản phẩm (hỗ trợ lọc qua query parameters)
// optionalAuthenticate: có token MANAGER/ADMIN thì thấy INACTIVE + LENS, khách chỉ thấy ACTIVE
router.get('/', optionalAuthenticate, ProductController.getProducts);

// Route lấy chi tiết 1 sản phẩm (khách bị chặn sản phẩm INACTIVE)
router.get('/:id', optionalAuthenticate, ProductController.getProductById);

// Route thêm sản phẩm mới (cho manager/admin)
router.post('/', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductController.createProduct);

// Route cập nhật thông tin sản phẩm (cho manager/admin)
router.put('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductController.updateProduct);

// Route xóa sản phẩm (cho manager/admin) — cascade xóa variants + dọn file ảnh
router.delete('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductController.deleteProduct);

// --- CÁC ROUTE CHO BIẾN THỂ SẢN PHẨM (PRODUCT VARIANTS) ---
// Lấy danh sách biến thể
router.get('/:productId/variants', ProductVariantController.getVariants);

// Thêm mới biến thể
router.post('/:productId/variants', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductVariantController.createVariant);

// Cập nhật biến thể
router.put('/:productId/variants/:variantId', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductVariantController.updateVariant);

// Xóa biến thể
router.delete('/:productId/variants/:variantId', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductVariantController.deleteVariant);

export default router;
