import express from 'express';
import multer from 'multer';
import FeedbackController from '../controllers/FeedbackController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Public route: Lấy đánh giá sản phẩm cho trang Chi tiết sản phẩm
router.get('/product/:productId', FeedbackController.getProductFeedbacks);

// Authenticated routes: Khách hàng quản lý đánh giá của mình
router.get('/me', authenticate, FeedbackController.getMyFeedbacks);
router.get('/order/:orderId', authenticate, FeedbackController.getFeedbackByOrder);
router.get('/:feedbackId', authenticate, FeedbackController.getFeedbackDetail);

router.post('/', authenticate, upload.array('images', 5), FeedbackController.createFeedback);
router.put('/:feedbackId', authenticate, upload.array('images', 5), FeedbackController.updateFeedback);
router.delete('/:feedbackId', authenticate, FeedbackController.deleteFeedback);

export default router;
