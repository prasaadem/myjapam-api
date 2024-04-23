import { Router } from "express";
import {
  createBlock,
  getBlocksByUser,
  deleteBlock,
} from "../controllers/block";

const router = Router();

router.post("/blocks", createBlock);
router.get("/blocks/:userId", getBlocksByUser);
router.delete("/blocks/:blockId", deleteBlock);

export default router;
