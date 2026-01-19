import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  listProjectMembers,
  getMyProjects,
  updateProjectMemberRole,
  getPlatforms,
  createPlatform,
  getMilestones,
  createMilestone,
} from '../controllers/project.controller';

const router = express.Router();

router.get('/', protect, getProjects);
router.get('/my-projects', protect, getMyProjects);

router.get('/:projectId/platforms', protect, getPlatforms);
router.post('/:projectId/platforms', protect, authorize('ADMIN', 'TEST_MANAGER'), createPlatform);

router.get('/:projectId/milestones', protect, getMilestones);
router.post('/:projectId/milestones', protect, authorize('ADMIN', 'TEST_MANAGER'), createMilestone);

router.get('/:id', protect, getProject);
router.post('/', protect, authorize('ADMIN', 'TEST_MANAGER'), createProject);
router.put('/:id', protect, authorize('ADMIN', 'TEST_MANAGER'), updateProject);
router.delete('/:id', protect, authorize('ADMIN'), deleteProject);
router.get('/:id/members', protect, listProjectMembers);
router.post('/:id/members', protect, authorize('ADMIN', 'TEST_MANAGER'), addProjectMember);
router.patch('/:id/members/:userId', protect, authorize('ADMIN', 'TEST_MANAGER'), updateProjectMemberRole);
router.delete('/:id/members/:userId', protect, authorize('ADMIN', 'TEST_MANAGER'), removeProjectMember);

export default router;

