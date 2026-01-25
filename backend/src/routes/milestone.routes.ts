import { Router } from 'express';
import * as MilestoneController from '../controllers/milestone.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Project milestones
router.get('/projects/:projectId', MilestoneController.getProjectMilestones);
router.post('/projects/:projectId', MilestoneController.createMilestone);

// Single milestone
router.get('/:id', MilestoneController.getMilestone);
router.put('/:id', MilestoneController.updateMilestone);
router.delete('/:id', MilestoneController.deleteMilestone);

export default router;
