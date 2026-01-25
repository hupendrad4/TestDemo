import express from 'express';
import {
  generatePublicReportLink,
  getPublicReport,
  getPublicLinks,
  deactivatePublicLink
} from '../controllers/publicReport.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Public route (no auth required)
router.get('/report/:token', getPublicReport);

// Protected routes
router.post('/generate', protect, generatePublicReportLink);
router.get('/links/:testRunId', protect, getPublicLinks);
router.delete('/links/:linkId', protect, deactivatePublicLink);

export default router;
