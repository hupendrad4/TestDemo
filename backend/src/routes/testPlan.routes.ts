import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getTestPlans,
  getTestPlan,
  createTestPlan,
  updateTestPlan,
  deleteTestPlan,
  createBuild,
  getBuilds,
} from '../controllers/testPlan.controller';

const router = express.Router();

router.get('/projects/:projectId', protect, getTestPlans);
router.post('/projects/:projectId', protect, authorize('ADMIN', 'TEST_MANAGER'), createTestPlan);
router.get('/:testPlanId/builds', protect, getBuilds);
router.post('/:testPlanId/builds', protect, authorize('ADMIN', 'TEST_MANAGER'), createBuild);
router.get('/:id', protect, getTestPlan);
router.put('/:id', protect, authorize('ADMIN', 'TEST_MANAGER'), updateTestPlan);
router.delete('/:id', protect, authorize('ADMIN'), deleteTestPlan);

export default router;
