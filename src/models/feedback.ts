// src/models/feedback.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  type:
    | "bug"
    | "feature_request"
    | "general"
    | "complaint"
    | "compliment"
    | "other";
  subject: string;
  message: string;
  userEmail?: string;
  status: "pending" | "reviewed" | "resolved";
  timestamp: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "bug",
      "feature_request",
      "general",
      "complaint",
      "compliment",
      "other",
    ],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  userEmail: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);
