import mongoose, { Schema, Document, model, Types } from "mongoose";

interface IBadge extends Document {
  userId: Types.ObjectId; // Reference to a User document
  subscriptionId: Types.ObjectId; // Reference to a Subscription document
  eventId: Types.ObjectId; // Reference to an Event document
  badgeName: string; // Name of the badge
  badgeType: string; // Type of the badge, e.g., "Milestone", "Achievement"
  createdDate: Date;
}

const badgeSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  badgeName: { type: String, required: true },
  badgeType: { type: String, required: true },
  createdDate: { type: Date, required: true, default: Date.now },
});

const Badge = model<IBadge>("Badge", badgeSchema);

export default Badge;
