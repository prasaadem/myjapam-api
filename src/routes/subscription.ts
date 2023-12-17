import { Router } from "express";
import {
  createSubscription,
  getAllSubscriptions,
  updateAllSubscriptions,
} from "../controllers/subscription";

const router: Router = Router();

router.post("/", createSubscription);
router.post("/list", getAllSubscriptions);
router.post("/update", updateAllSubscriptions);

export default router;
