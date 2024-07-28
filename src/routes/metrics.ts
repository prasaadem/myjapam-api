import { Router } from "express";
import { getMetrics } from "../controllers/metrics";

const router = Router();

router.post("/overview", getMetrics);
export default router;
