import { Router } from "express";
import {
  generateMetrics,
  getMetrics,
  getUserMetrics,
} from "../controllers/metrics";

const router = Router();

router.post("/overview", getMetrics);
router.post("/overview/users", getUserMetrics);
router.post("/generate-metrics", generateMetrics);

export default router;
