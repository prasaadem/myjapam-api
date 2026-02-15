// src/routes/feedback.ts
import express from "express";
import { submitFeedback, getFeedbackHistory, getAllFeedback, updateFeedbackStatus } from "../controllers/feedback";

const router = express.Router();

// Submit feedback
router.post("/submit", submitFeedback);

// Get user's feedback history
router.get("/history", getFeedbackHistory);

// Get all feedback (admin only)
router.get("/all", getAllFeedback);

// Update feedback status (admin only)
router.patch("/:id/status", updateFeedbackStatus);

export default router;
