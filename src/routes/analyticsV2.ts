import { Router } from "express";
import {
  getSubscriptionAnalytics,
  getOverviewAnalytics,
} from "../controllers/analyticsV2";

const router: Router = Router();

router.get("/subscription/:subscriptionId", getSubscriptionAnalytics);
router.get("/overview", getOverviewAnalytics);

export default router;
