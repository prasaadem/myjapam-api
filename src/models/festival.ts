// src/models/festival.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFestival extends Document {
  name: string;
  date: Date;
  endDate?: Date;
  category: "major" | "minor" | "ekadashi" | "purnima" | "amavasya";
  description: string;
  deity?: string;
  isMultiDay: boolean;
  year: number;
}

const festivalSchema = new Schema<IFestival>({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  category: {
    type: String,
    required: true,
    enum: ["major", "minor", "ekadashi", "purnima", "amavasya"],
  },
  description: { type: String, default: "" },
  deity: { type: String },
  isMultiDay: { type: Boolean, default: false },
  year: { type: Number, required: true },
});

festivalSchema.index({ date: 1 });
festivalSchema.index({ year: 1, category: 1 });

const Festival = mongoose.model<IFestival>("Festival", festivalSchema);
export default Festival;
