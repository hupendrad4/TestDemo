import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', (req, res) => {
  res.json({ message: 'Create test suite' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get all test suites' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get test suite ${req.params.id}` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update test suite ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete test suite ${req.params.id}` });
});

export default router;
