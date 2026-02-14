// src/controllers/feedback.ts
import { Response } from "express";
import { Feedback } from "../models/feedback";
import User from "../models/user";

export async function submitFeedback(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { type, subject, message } = req.body;

    // Validate required fields
    if (!type || !subject || !message) {
      res.status(400).json({
        message:
          "Missing required fields: type, subject, and message are required",
      });
      return;
    }

    // Validate feedback type
    const validTypes = [
      "bug",
      "feature_request",
      "general",
      "complaint",
      "compliment",
      "other",
    ];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        message: `Invalid feedback type. Must be one of: ${validTypes.join(", ")}`,
      });
      return;
    }

    // Get user details for email
    const user = await User.findById(userId);
    const userEmail = user?.username; // Assuming username might be email
    const userName = user
      ? `${user.first_name} ${user.last_name}`.trim()
      : undefined;

    // Create feedback document
    const feedback = new Feedback({
      user: userId,
      type,
      subject: subject.trim(),
      message: message.trim(),
      userEmail,
      status: "pending",
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedbackId: feedback._id,
    });
  } catch (error: any) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
}

export async function getFeedbackHistory(
  req: any,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const feedbacks = await Feedback.find({ user: userId })
      .sort({ timestamp: -1 })
      .select("type subject message status timestamp");

    res.status(200).json(feedbacks);
  } catch (error: any) {
    console.error("Get feedback history error:", error);
    res.status(500).json({ message: "Failed to retrieve feedback history" });
  }
}

export async function getAllFeedback(
  req: any,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || !user.is_admin) {
      res.status(403).json({ message: "Access denied. Admin privileges required." });
      return;
    }

    const feedbacks = await Feedback.find()
      .populate("user", "username first_name last_name")
      .sort({ timestamp: -1 })
      .select("user type subject message status timestamp");

    res.status(200).json(feedbacks);
  } catch (error: any) {
    console.error("Get all feedback error:", error);
    res.status(500).json({ message: "Failed to retrieve feedback" });
  }
}
