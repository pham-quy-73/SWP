import express from 'express';
import productRoutes from './productRoutes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is healthy' });
});
router.use('/products', productRoutes);
export default router;
