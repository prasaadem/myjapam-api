// src/routes/logRoutes.ts
import { Router } from 'express';
import { createLog, getAllLogs } from '../controllers/log';

const router: Router = Router();

router.post('/', createLog);
router.get('/', getAllLogs);

export default router;
