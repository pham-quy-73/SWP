import express from 'express';
import DashboardController from '../controllers/DashboardController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate, requireRole(['ADMIN', 'MANAGER']));

router.get('/revenue', DashboardController.getDashboardStats);

export default router;
