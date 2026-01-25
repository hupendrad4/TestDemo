import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  setupJiraIntegration,
  getJiraIntegration,
  toggleJiraIntegration,
  getJiraProjects,
  mapJiraProject,
  searchJiraIssues,
  linkEntityToJira,
  unlinkEntityFromJira,
  getEntityJiraLinks,
  syncEntityToJiraHandler,
  syncFromJiraHandler,
  handleJiraWebhook,
  getJiraIssueTypes,
} from '../controllers/jira.controller';

const router = Router();

// Webhook endpoint (no auth - validated by signature)
router.post('/webhook/:testProjectId', handleJiraWebhook);

// Protected routes
router.use(protect);

// Integration setup
router.post('/integration/:testProjectId', authorize(['ADMIN', 'TEST_MANAGER']), setupJiraIntegration);
router.get('/integration/:testProjectId', getJiraIntegration);
router.patch('/integration/:testProjectId/toggle', authorize(['ADMIN', 'TEST_MANAGER']), toggleJiraIntegration);

// Jira projects
router.get('/projects/:testProjectId', getJiraProjects);
router.post('/projects/:testProjectId/map', authorize(['ADMIN', 'TEST_MANAGER']), mapJiraProject);
router.get('/projects/:testProjectId/:projectKey/issue-types', getJiraIssueTypes);

// Search
router.get('/search/:testProjectId', searchJiraIssues);

// Entity linking
router.post('/link/:testProjectId', linkEntityToJira);
router.post('/unlink', unlinkEntityFromJira);
router.get('/links/:entityType/:entityId', getEntityJiraLinks);

// Sync
router.post('/sync/to-jira', syncEntityToJiraHandler);
router.post('/sync/from-jira', syncFromJiraHandler);

export default router;
