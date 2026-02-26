// src/models/templeVisit.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITempleVisit extends Document {
  userId: mongoose.Types.ObjectId;
  templeId: mongoose.Types.ObjectId;
  placeId: string;       // denormalized for fast lookup without join
  visitedAt: Date;
  notes?: string;
}

const templeVisitSchema = new Schema<ITempleVisit>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  templeId: { type: Schema.Types.ObjectId, ref: "Temple", required: true },
  placeId: { type: String, required: true },
  visitedAt: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 500 },
});

// No uniqueness constraint — one user can visit the same temple many times
templeVisitSchema.index({ userId: 1, visitedAt: -1 });
templeVisitSchema.index({ userId: 1, placeId: 1 });

const TempleVisit = mongoose.model<ITempleVisit>("TempleVisit", templeVisitSchema);
export default TempleVisit;
