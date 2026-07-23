import express from 'express';
import {
  getLenses,
  getLensById,
  createLens,
  updateLens,
  deleteLens
} from '../controllers/LensController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Đọc công khai (khách chọn tròng khi mua gọng); ghi chỉ dành cho quản lý —
// đồng bộ mô hình phân quyền với product.routes.js.
router.get('/', getLenses);
router.get('/:id', getLensById);
router.post('/', authenticate, requireRole(['MANAGER', 'ADMIN']), createLens);
router.put('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), updateLens);
router.delete('/:id', authenticate, requireRole(['MANAGER', 'ADMIN']), deleteLens);

export default router;
