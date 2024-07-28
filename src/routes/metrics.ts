import { Router } from "express";
import { getMetrics, getUserMetrics } from "../controllers/metrics";

const router = Router();

router.post("/overview", getMetrics);
router.post("/overview/users", getUserMetrics);
export default router;
