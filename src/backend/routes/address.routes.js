import express from 'express';
import AddressController from '../controllers/AddressController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Toàn bộ endpoint đều yêu cầu đăng nhập (địa chỉ cá nhân, chỉ chủ sở hữu được truy cập)
router.use(authenticate);

router.get('/', AddressController.listMyAddresses);
router.post('/', AddressController.createAddress);
router.put('/:id', AddressController.updateAddress);
router.put('/:id/default', AddressController.setDefault);
router.delete('/:id', AddressController.deleteAddress);

export default router;
