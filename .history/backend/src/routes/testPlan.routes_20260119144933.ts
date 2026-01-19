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
  addTestCases,
  getTestPlanCases,
  createTestCycle,
  getTestCycles,
} from '../controllers/testPlan.controller';

const router = express.Router();

router.get('/projects/:projectId', protect, getTestPlans);
router.post('/projects/:projectId', protect, authorize('ADMIN', 'TEST_MANAGER'), createTestPlan);

router.get('/:testPlanId/builds', protect, getBuilds);
router.post('/:testPlanId/builds', protect, authorize('ADMIN', 'TEST_MANAGER'), createBuild);

router.get('/:testPlanId/cycles', protect, getTestCycles);
router.post('/:testPlanId/cycles', protect, authorize('ADMIN', 'TEST_MANAGER'), createTestCycle);

router.get('/:id/test-cases', protect, getTestPlanCases);
router.post('/:id/test-cases', protect, authorize('ADMIN', 'TEST_MANAGER', 'TESTER'), addTestCases);

router.get('/:id', protect, getTestPlan);
router.put('/:id', protect, authorize('ADMIN', 'TEST_MANAGER'), updateTestPlan);
router.delete('/:id', protect, authorize('ADMIN'), deleteTestPlan);

export default router;

