import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', (req, res) => {
  res.json({ message: 'Create test case' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get all test cases' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get test case ${req.params.id}` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update test case ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete test case ${req.params.id}` });
});

router.post('/:id/steps', (req, res) => {
  res.json({ message: 'Add test steps' });
});

export default router;
