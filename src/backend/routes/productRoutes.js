import express from 'express';
import * as ProductController from '../controllers/ProductController.js';

const router = express.Router();

/* LƯU Ý QUAN TRỌNG VỀ PHÂN QUYỀN (Module 1 sẽ làm phần này):
  Hiện tại người phụ trách Module 1 (Auth) có thể chưa làm xong các middleware xác thực. 
  Vì vậy, tôi tạm thời comment lại các dòng kiểm tra quyền (protect, restrictTo) để bạn có thể test API.
  Sau khi ghép code, bạn chỉ cần mở comment ra là hệ thống sẽ bảo mật tuyệt đối!
*/
// import { protect, restrictTo } from '../middlewares/auth.js';

// ==========================================
// 🔓 PUBLIC ROUTES (Ai cũng xem được: CUSTOMER, SALE, ADMIN)
// ==========================================
// API: GET /api/v1/products
router.get('/', ProductController.getAllProducts);

// API: GET /api/v1/products/:id
router.get('/:id', ProductController.getProductById);

// ==========================================
// 🔒 ADMIN ROUTES (Chỉ ADMIN mới có quyền thêm/sửa/xóa)
// ==========================================
// Bật chốt chặn xác thực token và kiểm tra role ADMIN (hiện đang ẩn để test)
// router.use(protect);
// router.use(restrictTo('ADMIN'));

// API: POST /api/v1/products
router.post('/', ProductController.createProduct);

// API: PUT /api/v1/products/:id
router.put('/:id', ProductController.updateProduct);

// API: DELETE /api/v1/products/:id
router.delete('/:id', ProductController.deleteProduct);

export default router;