import express from 'express';
import UserController from '../controllers/UserController.js';
import { authenticate, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy thông tin cá nhân của người dùng hiện tại
router.get('/me', authenticate, UserController.getMe);

// Tất cả các tuyến đường phía dưới đều yêu cầu đăng nhập với vai trò ADMIN
router.use(authenticate, requireRole(['ADMIN']));

router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id/role', UserController.updateUserRole);
router.put('/:id/status', UserController.updateUserStatus);
router.delete('/:id', UserController.deleteUser);
router.put('/:id/reset-password', UserController.resetPassword);


export default router;
