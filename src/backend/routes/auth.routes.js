import express from 'express';
import authController from '../controllers/AuthController.js'; 

const router = express.Router();

router.post('/register', authController.register.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/google', authController.googleLogin.bind(authController));
router.post('/resend-verify-email', authController.resendVerificationEmail.bind(authController));

export default router;