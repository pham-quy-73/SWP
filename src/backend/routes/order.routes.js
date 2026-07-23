import express from 'express';
import multer from 'multer';
import OrderController from '../controllers/OrderController.js';
import RefundController from '../controllers/RefundController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Tuyến đường cho khách hàng (Customer) - Đăng nhập là dùng được
router.post('/create', authenticate, upload.single('prescriptionImage'), OrderController.createOrder);
router.get('/me', authenticate, OrderController.myOrders);
router.put('/:id/cancel', authenticate, OrderController.cancelOrder);

// Tuyến đường xử lý cho Manager liên quan đơn hàng bị huỷ đã thanh toán
router.get('/cancelled/paid', authenticate, requireRole(['MANAGER', 'ADMIN']), RefundController.getCancelledPaidOrders);
router.put('/:id/reject-cancel', authenticate, requireRole(['MANAGER', 'ADMIN']), OrderController.rejectCancellation);

// Yêu cầu đăng nhập tối thiểu là MANAGER hoặc ADMIN
router.get('/', authenticate, requireRole(['MANAGER', 'ADMIN']), OrderController.getAllOrders);
router.get('/:id', authenticate, requireRole(['CUSTOMER', 'MANAGER', 'ADMIN']), OrderController.getOrderById);
router.put('/:id/status', authenticate, requireRole(['MANAGER', 'ADMIN']), OrderController.updateOrderStatus);

// KTV/Manager sửa đơn kính (prescription) của item khi đơn đang AWAITING_VERIFICATION
router.put('/:id/items/:itemId/prescription', authenticate, requireRole(['MANAGER', 'ADMIN']), OrderController.updateItemPrescription);


// Chỉ duy nhất ADMIN được xóa đơn hàng khỏi database
router.delete('/:id', authenticate, requireRole(['ADMIN']), OrderController.deleteOrder);

export default router;

