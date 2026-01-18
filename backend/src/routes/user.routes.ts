import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  setActiveStatus,
  deleteUser,
  bootstrapAdmin,
  updateUserProjects,
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/', authorize('ADMIN', 'TEST_MANAGER'), getUsers);
router.get('/:id', authorize('ADMIN', 'TEST_MANAGER'), getUser);
router.post('/', authorize('ADMIN', 'TEST_MANAGER'), createUser);
router.put('/:id', authorize('ADMIN', 'TEST_MANAGER'), updateUser);
router.patch('/:id/role', authorize('ADMIN'), updateUserRole);
router.patch('/:id/status', authorize('ADMIN'), setActiveStatus);
router.patch('/:id/projects', authorize('ADMIN', 'TEST_MANAGER'), updateUserProjects);
router.delete('/:id', authorize('ADMIN'), deleteUser);
// Bootstrap admin (only when no admin exists)
router.post('/bootstrap-admin', bootstrapAdmin);

export default router;
