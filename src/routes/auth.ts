import { Router } from "express";
import {
  deleteUser,
  getTerms,
  loginUser,
  registerUser,
  updateTerms,
  updateUser,
} from "../controllers/auth";

const router = Router();

// User authentication routes
router.post("/login", loginUser);
router.post("/register", registerUser);

router.put("/:id", updateUser);

router.get("/:id/terms", getTerms);
router.post("/:id/terms", updateTerms);

router.delete("/delete", deleteUser);

export default router;
