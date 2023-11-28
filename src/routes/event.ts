// src/routes/eventRoutes.ts
import { Router } from 'express';
import {
  createEvent,
  deleteEventById,
  getAllEvents,
  getEventById,
  updateEventById,
} from '../controllers/event';

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = Router();

router.post('/', upload.single('file'), createEvent);
router.post('/list', getAllEvents);
router.put('/:id', upload.single('file'), updateEventById);
router.get('/:id', getEventById);

router.delete('/:id', deleteEventById);

export default router;
