import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { requireProjectRole } from '../middleware/projectAuth.middleware';
import {
  getDashboard,
  getCoverageReport,
  getExecutionReport,
  getUserActivityReport,
} from '../controllers/report.controller';

const router = express.Router();

// Allow members/viewers to see dashboard and coverage; require QA_MANAGER/ADMIN for user-activity (kept as admin/test-manager globally as well)
router.get('/projects/:projectId/dashboard', protect, requireProjectRole('ANY'), getDashboard);
router.get('/projects/:projectId/coverage', protect, requireProjectRole('ANY'), getCoverageReport);
router.get('/projects/:projectId/user-activity', protect, authorize('ADMIN', 'TEST_MANAGER'), getUserActivityReport);
router.get('/cycles/:cycleId/execution', protect, getExecutionReport);

export default router;
