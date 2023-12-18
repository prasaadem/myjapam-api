import { Router } from "express";
import { deleteUser } from "../controllers/auth";

const router = Router();

router.delete("/delete", deleteUser);

export default router;
