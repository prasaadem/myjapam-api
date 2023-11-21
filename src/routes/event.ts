// src/routes/eventRoutes.ts
import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventById,
} from '../controllers/event';

const router: Router = Router();

router.post('/', createEvent);
router.get('/', getAllEvents);
router.put('/:id', updateEventById);
router.get('/:id', getEventById);

export default router;
