// src/models/log.ts
import mongoose, { Schema, Document } from "mongoose";

interface ITerms extends Document {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  version: string;
}

const logSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  version: {
    type: String,
  },
});

const Terms = mongoose.model<ITerms>("Terms", logSchema);

export default Terms;
