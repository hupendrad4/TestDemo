import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/{projectId}:
 *   get:
 *     summary: Get workspace dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/:projectId', DashboardController.getWorkspaceDashboard);

/**
 * @swagger
 * /api/dashboard/{projectId}/test-cases-summary:
 *   get:
 *     summary: Get test cases summary
 *     tags: [Dashboard]
 */
router.get('/:projectId/test-cases-summary', DashboardController.getTestCasesSummary);

/**
 * @swagger
 * /api/dashboard/{projectId}/execution-summary:
 *   get:
 *     summary: Get execution summary
 *     tags: [Dashboard]
 */
router.get('/:projectId/execution-summary', DashboardController.getExecutionSummary);

/**
 * @swagger
 * /api/dashboard/{projectId}/requirement-coverage:
 *   get:
 *     summary: Get requirement coverage
 *     tags: [Dashboard]
 */
router.get('/:projectId/requirement-coverage', DashboardController.getRequirementCoverage);

/**
 * @swagger
 * /api/dashboard/{projectId}/recent-test-runs:
 *   get:
 *     summary: Get recent test runs
 *     tags: [Dashboard]
 */
router.get('/:projectId/recent-test-runs', DashboardController.getRecentTestRuns);

/**
 * @swagger
 * /api/dashboard/{projectId}/execution-trends:
 *   get:
 *     summary: Get execution trends
 *     tags: [Dashboard]
 */
router.get('/:projectId/execution-trends', DashboardController.getExecutionTrends);

/**
 * @swagger
 * /api/dashboard/{projectId}/risk-metrics:
 *   get:
 *     summary: Get risk metrics
 *     tags: [Dashboard]
 */
router.get('/:projectId/risk-metrics', DashboardController.getRiskMetrics);

export default router;
