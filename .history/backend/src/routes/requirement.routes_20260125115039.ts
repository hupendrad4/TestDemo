import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  linkTestCase,
  createRequirementSpec,
  getRequirementSpecs,
  getRequirementsCoverage,
} from '../controllers/requirement.controller';

const router = express.Router();

router.get('/coverage', protect, getRequirementsCoverage);
router.get('/projects/:projectId/specs', protect, getRequirementSpecs);
router.post('/projects/:projectId/specs', protect, authorize('ADMIN', 'TEST_MANAGER'), createRequirementSpec);
router.get('/projects/:projectId', protect, getRequirements);
router.post('/projects/:projectId', protect, authorize('ADMIN', 'TEST_MANAGER'), createRequirement);
router.get('/:id', protect, getRequirement);
router.put('/:id', protect, authorize('ADMIN', 'TEST_MANAGER'), updateRequirement);
router.delete('/:id', protect, authorize('ADMIN'), deleteRequirement);
router.post('/:id/test-cases', protect, authorize('ADMIN', 'TEST_MANAGER', 'TESTER'), linkTestCase);

export default router;
