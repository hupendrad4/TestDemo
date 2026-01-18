import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN', 'TEST_MANAGER'));

router.post('/jira', (req, res) => {
  res.json({ message: 'Setup Jira integration' });
});

router.post('/azure-devops', (req, res) => {
  res.json({ message: 'Setup Azure DevOps integration' });
});

router.get('/:projectId', (req, res) => {
  res.json({ message: `Get integrations for project ${req.params.projectId}` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update integration ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete integration ${req.params.id}` });
});

router.post('/:id/sync', (req, res) => {
  res.json({ message: `Sync integration ${req.params.id}` });
});

export default router;
