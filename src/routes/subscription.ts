import { Router } from 'express';
import {
  createSubscription,
  getAllSubscriptions,
} from '../controllers/subscription';

const router: Router = Router();

router.post('/', createSubscription);
router.get('/', getAllSubscriptions);

export default router;
