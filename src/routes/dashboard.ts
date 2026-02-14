import { Router } from "express";
import { getDashboard } from "../controllers/dashboard";

const router: Router = Router();

router.post("/", getDashboard);

export default router;
