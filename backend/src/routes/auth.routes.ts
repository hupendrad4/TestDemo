import express from 'express';
import {
  register,
  login,
  adminLogin,
  getMe,
  updatePassword,
  logout,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

export default router;
