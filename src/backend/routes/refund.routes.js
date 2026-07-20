import express from 'express';
import RefundController from '../controllers/RefundController.js';
import OrderController from '../controllers/OrderController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware áp dụng chung cho tất cả các route trong phân hệ hoàn tiền: Yêu cầu đăng nhập tối thiểu là MANAGER hoặc ADMIN
router.use(authenticate);
router.use(requireRole(['MANAGER', 'ADMIN']));

router.patch('/variant/:variantId/in-activate', RefundController.inActivateVariant);
router.get('/affected-orders/:variantId', RefundController.getAffectedOrders);
router.post('/create-batch', RefundController.createBatch);
router.get('/ready', RefundController.getReadyRefunds);
router.post('/:refundId/refund-checkout', RefundController.checkoutRefund);
router.put('/reject-cancel/:orderId', OrderController.rejectCancellation);

export default router;
