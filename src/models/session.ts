import mongoose, { Schema, Document } from "mongoose";

interface ISession extends Document {
  userId: string;
  token: string;
  createdAt: Date;
}

const sessionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model<ISession>("Session", sessionSchema);
export default Session;
