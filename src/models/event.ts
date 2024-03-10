// src/models/event.ts
import mongoose, { Schema, Document } from "mongoose";

interface IEventReport {
  reportedBy: mongoose.Types.ObjectId;
  message: string;
  reportedOn: Date;
  status: string;
}

interface IEvent extends Document {
  title: string;
  subtitle: string;
  maxSubscriberCount: number;
  eventCode: string;
  eventCount: number;
  value: number;
  visibility: string;
  timestamp: Date;
  url: string;
  user_id: mongoose.Types.ObjectId;
  reports: IEventReport[];
}

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  maxSubscriberCount: {
    type: Number,
    min: 0,
    max: 50,
    required: true,
  },
  eventCode: {
    type: String,
    unique: true,
    required: true,
    default: () => Math.floor(100000 + Math.random() * 900000).toString(), // Generates a 6-digit unique code
  },
  value: {
    type: Number,
    min: 1,
    required: true,
  },
  visibility: {
    type: String,
    required: true,
    enum: ["public", "private", "group"],
    default: "public",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  url: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reports: [
    {
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      message: {
        type: String,
        required: true,
      },
      reportedOn: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["submitted", "in_progress", "resolved"],
        default: "submitted",
      },
    },
  ],
});

const Event = mongoose.model<IEvent>("Event", eventSchema);

export default Event;
