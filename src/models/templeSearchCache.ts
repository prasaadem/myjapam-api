// src/models/templeSearchCache.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITempleSearchCache extends Document {
  geohash: string;       // precision-5 geohash key (~5km × 5km cell)
  templeIds: mongoose.Types.ObjectId[];
  cachedAt: Date;
  expiresAt: Date;       // cachedAt + 30 days
}

const templeSearchCacheSchema = new Schema<ITempleSearchCache>({
  geohash: { type: String, required: true, unique: true },
  templeIds: [{ type: Schema.Types.ObjectId, ref: "Temple" }],
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// MongoDB TTL index: auto-delete expired cache documents
templeSearchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
templeSearchCacheSchema.index({ geohash: 1 }, { unique: true });

const TempleSearchCache = mongoose.model<ITempleSearchCache>(
  "TempleSearchCache",
  templeSearchCacheSchema
);
export default TempleSearchCache;
