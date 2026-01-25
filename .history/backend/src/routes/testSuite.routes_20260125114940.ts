import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getTestSuites,
  getTestSuite,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
} from '../controllers/testSuite.controller';

const router = Router();

router.use(protect);

// Project-scoped routes
router.get('/projects/:projectId', getTestSuites);
router.post('/projects/:projectId', createTestSuite);

// Individual test suite routes
router.get('/:id', getTestSuite);
router.put('/:id', updateTestSuite);
router.delete('/:id', deleteTestSuite);

export default router;
