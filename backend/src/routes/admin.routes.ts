import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { getAdminMetrics } from '../controllers/admin.controller';

const router = express.Router();

router.get('/metrics', protect, authorize('ADMIN'), getAdminMetrics);

export default router;
