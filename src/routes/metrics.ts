import { Router } from "express";
import {
  generateMetrics,
  getMetrics,
  getUserMetrics,
  userLogs,
} from "../controllers/metrics";

const router = Router();

router.post("/overview", getMetrics);
router.post("/overview/users", getUserMetrics);
router.post("/generate-metrics", generateMetrics);
router.post("/logs", userLogs);

export default router;
