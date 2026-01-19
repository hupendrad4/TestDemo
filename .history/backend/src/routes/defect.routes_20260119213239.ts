import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getDefects,
  getDefect,
  createDefect,
  updateDefect,
  deleteDefect,
  addComment,
  getDefectStats,
  bulkDeleteDefects
} from '../controllers/defect.controller';

const router = Router();

router.use(protect);

// Defect CRUD
router.route('/projects/:projectId')
  .get(getDefects)
  .post(createDefect);

router.route('/projects/:projectId/stats')
  .get(getDefectStats);

router.route('/projects/:projectId/bulk-delete')
  .post(bulkDeleteDefects);

router.route('/:id')
  .get(getDefect)
  .put(updateDefect)
  .delete(deleteDefect);

router.route('/:id/comments')
  .post(addComment);

export default router;
