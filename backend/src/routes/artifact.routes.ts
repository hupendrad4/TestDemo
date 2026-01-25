import { Router } from 'express';
import {
  uploadArtifact,
  getArtifacts,
  getArtifact,
  downloadArtifact,
  deleteArtifact,
  bulkUploadArtifacts,
  upload,
} from '../controllers/artifact.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Upload routes
router.post('/upload', protect, upload.single('file'), uploadArtifact);
router.post('/bulk-upload', protect, upload.array('files', 10), bulkUploadArtifacts);

// CRUD routes
router.route('/').get(protect, getArtifacts);

router
  .route('/:id')
  .get(protect, getArtifact)
  .delete(protect, deleteArtifact);

router.get('/:id/download', protect, downloadArtifact);

export default router;
