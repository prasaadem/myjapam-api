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

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      Feedback.find({ user: userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select("type subject message status timestamp"),
      Feedback.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      feedbacks,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    });
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

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      Feedback.find()
        .populate("user", "username first_name last_name")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select("user type subject message status timestamp"),
      Feedback.countDocuments(),
    ]);

    res.status(200).json({
      feedbacks,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Get all feedback error:", error);
    res.status(500).json({ message: "Failed to retrieve feedback" });
  }
}

export async function updateFeedbackStatus(
  req: any,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.is_admin) {
      res.status(403).json({ message: "Access denied. Admin privileges required." });
      return;
    }

    const { status } = req.body;
    const validStatuses = ["pending", "reviewed", "resolved"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const feedbackId = req.params.id;
    const updated = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status },
      { new: true },
    );

    if (!updated) {
      res.status(404).json({ message: "Feedback not found" });
      return;
    }

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Update feedback status error:", error);
    res.status(500).json({ message: "Failed to update feedback status" });
  }
}
