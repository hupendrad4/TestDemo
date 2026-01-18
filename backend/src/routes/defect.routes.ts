import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', (req, res) => {
  res.json({ message: 'Create defect' });
});

router.get('/', (req, res) => {
  res.json({ message: 'Get all defects' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get defect ${req.params.id}` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update defect ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete defect ${req.params.id}` });
});

router.post('/:id/comments', (req, res) => {
  res.json({ message: 'Add comment to defect' });
});

export default router;
