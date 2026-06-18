import express from 'express';
import userController from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Bật khiên bảo vệ `protect` cho TẤT CẢ các route bên dưới dòng này
// Yêu cầu phải có Token hợp lệ mới được đi tiếp
router.use(protect);

// Route: GET /api/users/me
router.get('/me', userController.getMe);

// Route: PATCH /api/users/profile
router.patch('/profile', userController.updateProfile);

export default router;