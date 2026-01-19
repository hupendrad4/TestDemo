import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  addTestSteps,
  getTestCasesByProject,
} from '../controllers/testCase.controller';

const router = Router();

router.use(protect);

// Project-scoped routes
router.get('/projects/:projectId', getTestCasesByProject);
router.post('/projects/:projectId', createTestCase);

// Individual test case routes
router.get('/:id', getTestCase);
router.put('/:id', updateTestCase);
router.delete('/:id', deleteTestCase);

// Test steps
router.post('/:id/steps', addTestSteps);

// Legacy route for query param based filtering
router.get('/', getTestCases);
router.post('/', createTestCase);

export default router;
