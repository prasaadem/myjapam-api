// src/routes/eventRoutes.ts
import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventById,
} from '../controllers/event';

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = Router();

router.post('/', upload.single('file'), createEvent);
router.get('/', getAllEvents);
router.put('/:id', upload.single('file'), updateEventById);
router.get('/:id', getEventById);

export default router;
