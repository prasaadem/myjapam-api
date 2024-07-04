import { Router } from "express";
import {
  createSubscription,
  downloadSubscription,
  getAllSubscriptions,
  updateAllSubscriptions,
} from "../controllers/subscription";

const router: Router = Router();

router.post("/", createSubscription);
router.post("/list", getAllSubscriptions);
router.post("/update", updateAllSubscriptions);
router.post("/download/:id", downloadSubscription);

export default router;
