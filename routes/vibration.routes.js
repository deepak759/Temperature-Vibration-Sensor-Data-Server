import { Router } from 'express';
import { getLive, getHistory, manualRead } from '../controllers/vibration.controller.js';

const router = Router();

router.get('/live', getLive);
router.get('/history', getHistory);
router.post('/manual-read', manualRead);

export default router;