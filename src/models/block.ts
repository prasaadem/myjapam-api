// src/models/event.ts
import mongoose, { Schema, Document } from "mongoose";

interface IBlock extends Document {
  timestamp: Date;
  blocker_id: mongoose.Types.ObjectId;
  blocked_id: mongoose.Types.ObjectId;
}

const blockSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  blocker_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  blocked_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Event = mongoose.model<IBlock>("Event", blockSchema);

export default Event;
