// src/routes/eventRoutes.ts
import { Router } from "express";
import {
  createEvent,
  deleteEventById,
  getAllPublicEvents,
  getEventByCode,
  getEventById,
  getMyEvents,
  reportEventByCode,
  updateEventById,
} from "../controllers/event";

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = Router();

router.post("/", upload.single("file"), createEvent);
router.post("/public", getAllPublicEvents);
router.post("/my", getMyEvents);
router.put("/:code", upload.single("file"), updateEventById);
router.get("/:id", getEventById);
router.get("/byCode/:eventCode", getEventByCode);

router.put("/report/:code", reportEventByCode);

router.delete("/:id", deleteEventById);

export default router;
