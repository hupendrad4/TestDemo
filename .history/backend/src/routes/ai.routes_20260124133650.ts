import express from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkProjectAccess } from '../middleware/projectAuth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/generate-tests
 * @desc    Generate test cases from requirements
 * @access  Private
 */
router.post('/generate-tests', aiController.generateTests);

/**
 * @route   POST /api/ai/suggest-improvements
 * @desc    Suggest improvements for existing test case
 * @access  Private
 */
router.post('/suggest-improvements', aiController.suggestImprovements);

/**
 * @route   GET /api/ai/detect-duplicates/:projectId
 * @desc    Detect duplicate test cases in a project
 * @access  Private
 */
router.get(
  '/detect-duplicates/:projectId',
  checkProjectAccess,
  aiController.detectDuplicates
);

/**
 * @route   POST /api/ai/detect-flaky
 * @desc    Detect if a test is flaky
 * @access  Private
 */
router.post('/detect-flaky', aiController.detectFlaky);

/**
 * @route   POST /api/ai/generate-report
 * @desc    Generate AI-assisted report
 * @access  Private
 */
router.post('/generate-report', aiController.generateReport);

/**
 * @route   GET /api/ai/coverage-gaps/:projectId
 * @desc    Calculate automation coverage gaps
 * @access  Private
 */
router.get(
  '/coverage-gaps/:projectId',
  checkProjectAccess,
  aiController.getCoverageGaps
);

/**
 * @route   GET /api/ai/suggestions/:projectId
 * @desc    Get AI suggestions for a project
 * @access  Private
 */
router.get(
  '/suggestions/:projectId',
  checkProjectAccess,
  aiController.getSuggestions
);

/**
 * @route   POST /api/ai/suggestions/:id/accept
 * @desc    Accept an AI suggestion
 * @access  Private
 */
router.post('/suggestions/:id/accept', aiController.acceptSuggestion);

/**
 * @route   POST /api/ai/suggestions/:id/reject
 * @desc    Reject an AI suggestion
 * @access  Private
 */
router.post('/suggestions/:id/reject', aiController.rejectSuggestion);

export default router;
