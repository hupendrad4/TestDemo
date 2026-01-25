import { Router } from 'express';
import {
  getEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  createDefaultEnvironments,
} from '../controllers/environment.controller';
import { protect } from '../middleware/auth.middleware';
import { requireProjectRole } from '../middleware/projectAuth.middleware';

const router = Router();

// Project-specific routes
router
  .route('/projects/:projectId/environments')
  .get(protect, requireProjectRole('ANY'), getEnvironments)
  .post(protect, requireProjectRole(['PROJECT_ADMIN', 'QA_MANAGER']), createEnvironment);

router
  .route('/projects/:projectId/environments/defaults')
  .post(protect, requireProjectRole(['PROJECT_ADMIN', 'QA_MANAGER']), createDefaultEnvironments);

// Environment CRUD routes
router
  .route('/environments/:id')
  .get(protect, getEnvironment)
  .put(protect, requireProjectRole(['PROJECT_ADMIN', 'QA_MANAGER']), updateEnvironment)
  .delete(protect, requireProjectRole(['PROJECT_ADMIN', 'QA_MANAGER']), deleteEnvironment);

export default router;
