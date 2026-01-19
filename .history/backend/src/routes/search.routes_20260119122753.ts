import { Router } from 'express';
import SearchController from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/search/global:
 *   get:
 *     summary: Global search across multiple entities
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/global', SearchController.globalSearch);

/**
 * @swagger
 * /api/search/test-cases:
 *   get:
 *     summary: Search test cases with advanced filters
 *     tags: [Search]
 */
router.get('/test-cases', SearchController.searchTestCases);

/**
 * @swagger
 * /api/search/quick:
 *   get:
 *     summary: Quick search for autocomplete
 *     tags: [Search]
 */
router.get('/quick', SearchController.quickSearch);

export default router;
