import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', (req, res) => {
  res.json({ message: 'Create test execution' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get all executions' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get execution ${req.params.id}` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update execution ${req.params.id}` });
});

router.post('/:id/steps', (req, res) => {
  res.json({ message: 'Update step execution' });
});

export default router;
