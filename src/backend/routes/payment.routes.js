import express from 'express';
import PaymentController from '../controllers/PaymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 1. Tính toán giá trị thanh toán & yêu cầu
router.post('/orders/requirement', authenticate, PaymentController.getPaymentRequirement);

// 2. Khởi tạo link thanh toán VNPay
router.post('/checkout', authenticate, PaymentController.checkout);

// 3. Callback công cộng từ VNPay (Sau khi thanh toán xong)
router.get('/vnpay-callback', PaymentController.vnpayCallback);

// 3b. IPN server-to-server từ VNPay — nguồn xác nhận thanh toán chính.
// (Cấu hình URL này trong merchant portal VNPay; response theo spec {RspCode, Message})
router.get('/vnpay-ipn', PaymentController.vnpayIpn);

// 4. Mô phỏng thanh toán VNPay (Cho môi trường local/test)
router.post('/mock-checkout', authenticate, PaymentController.mockCheckout);

export default router;
