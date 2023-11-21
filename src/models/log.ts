// src/models/log.ts
import mongoose, { Schema, Document } from 'mongoose';

interface ILog extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  timestamp: Date;
  sum: number;
}

const logSchema = new Schema({
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sum: {
    type: Number,
    default: 0,
  },
});

logSchema.pre<ILog>('save', async function (next) {
  const log = this;

  // Compute the sum when a new log event is created
  const sumOfLogs = await Log.aggregate([
    {
      $match: {
        event: log.event,
        user: log.user,
      },
    },
    {
      $sort: {
        timestamp: -1,
      },
    },
  ]);

  // Update the sum field
  log.sum = sumOfLogs.length > 0 ? sumOfLogs[0].sum + 1 : 1;

  next();
});

const Log = mongoose.model<ILog>('Log', logSchema);

export default Log;
