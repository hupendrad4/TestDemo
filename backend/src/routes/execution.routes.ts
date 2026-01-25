import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as ExecutionController from '../controllers/execution.controller';

const router = Router();

router.use(protect);

// Get executions for a project
router.get('/projects/:projectId', ExecutionController.getProjectExecutions);
router.get('/projects/:projectId/my-executions', ExecutionController.getMyExecutions);

// Bulk assign executions
router.post('/bulk-assign', ExecutionController.bulkAssignExecutions);

// Single execution operations
router.get('/:id', ExecutionController.getExecutionById);
router.put('/:id/assign', ExecutionController.assignExecution);
router.put('/executions/:id', ExecutionController.updateExecution);

export default router;
