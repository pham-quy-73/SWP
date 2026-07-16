import express from 'express';
import productRoutes from './product.routes.js';
import userRoutes from './user.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import refundRoutes from './refund.routes.js';
import addressRoutes from './address.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is healthy' });
});

router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/management/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/refund', refundRoutes);
router.use('/addresses', addressRoutes);

export default router;

