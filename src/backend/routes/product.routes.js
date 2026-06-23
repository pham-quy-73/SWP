import express from 'express';
import multer from 'multer';
import ProductController from '../controllers/ProductController.js';
import ProductVariantController from '../controllers/ProductVariantController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Route lấy danh sách sản phẩm (hỗ trợ lọc qua query parameters)
router.get('/', ProductController.getProducts);

// Route lấy chi tiết 1 sản phẩm
router.get('/:id', ProductController.getProductById);

// Route thêm sản phẩm mới (cho manager/admin)
router.post('/', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductController.createProduct);

// Route cập nhật thông tin sản phẩm (cho manager/admin)
router.put('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), upload.array('files'), ProductController.updateProduct);

// Route xóa sản phẩm (cho manager/admin)
router.delete('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductController.deleteProduct);

// --- CÁC ROUTE CHO BIẾN THỂ SẢN PHẨM (PRODUCT VARIANTS) ---
// Lấy danh sách biến thể
router.get('/:productId/variants', ProductVariantController.getVariants);

// Thêm mới biến thể
router.post('/:productId/variants', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductVariantController.createVariant);

// Cập nhật biến thể
router.put('/:productId/variants/:variantId', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductVariantController.updateVariant);

// Xóa biến thể
router.delete('/:productId/variants/:variantId', authenticate, requireRole(['MANAGER', 'ADMIN']), ProductVariantController.deleteVariant);

export default router;

