// src/models/subscription.ts
import mongoose, { Schema, Document } from "mongoose";

interface ISubscription extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  subscription_date: Date;
  sum: Number;
}

const subscriptionSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription_date: {
    type: Date,
    default: Date.now,
  },
  sum: { type: Number, default: 0 },
});

// Compound index for query performance (non-unique — mala events allow multiple subscriptions per user)
subscriptionSchema.index({ event: 1, user: 1 });

const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);

export default Subscription;
