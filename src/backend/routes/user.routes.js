import express from 'express';
import userController from '../controllers/UserController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/profile', verifyToken, userController.getProfile.bind(userController));
router.put('/profile', verifyToken, userController.updateProfile.bind(userController));

export default router;
