// src/models/appSettings.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettings extends Document {
  key: string; // always "singleton"
  sacredTabEnabled: boolean;
  templesEnabled: boolean;
  festivalsEnabled: boolean;
  adminOverride: boolean; // when true, admins bypass all flags and see everything enabled
  updatedBy?: string;
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettings>(
  {
    key: { type: String, default: "singleton", unique: true },
    sacredTabEnabled: { type: Boolean, default: true },
    templesEnabled: { type: Boolean, default: true },
    festivalsEnabled: { type: Boolean, default: true },
    adminOverride: { type: Boolean, default: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAppSettings>("AppSettings", appSettingsSchema);
