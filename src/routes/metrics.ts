import { Router } from "express";
import {
  generateMetrics,
  getEventMetrics,
  getLogMetrics,
  getMetrics,
  getSessionMetrics,
  getSubscriptionMetrics,
  getUserMetrics,
  userLogs,
} from "../controllers/metrics";

const router = Router();

router.post("/overview", getMetrics);
router.post("/overview/users", getUserMetrics);
router.post("/overview/sessions", getSessionMetrics);
router.post("/overview/events", getEventMetrics);
router.post("/overview/subscriptions", getSubscriptionMetrics);
router.post("/overview/logs", getLogMetrics);
router.post("/generate-metrics", generateMetrics);
router.post("/logs", userLogs);

export default router;
