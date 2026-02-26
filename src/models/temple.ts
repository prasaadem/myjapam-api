// src/models/temple.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITemple extends Document {
  placeId: string;
  name: string;
  address: string;
  vicinity: string;
  lat: number;
  lng: number;
  geohash5: string;
  rating?: number;
  userRatingsTotal?: number;
  photoReference?: string;
  types: string[];
  cachedAt: Date;
}

const templeSchema = new Schema<ITemple>({
  placeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, default: "" },
  vicinity: { type: String, default: "" },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  geohash5: { type: String, required: true },
  rating: { type: Number },
  userRatingsTotal: { type: Number },
  photoReference: { type: String },
  types: [{ type: String }],
  cachedAt: { type: Date, default: Date.now },
});

templeSchema.index({ geohash5: 1 });
templeSchema.index({ placeId: 1 }, { unique: true });

const Temple = mongoose.model<ITemple>("Temple", templeSchema);
export default Temple;
