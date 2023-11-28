// src/controllers/logController.ts
import { Request, Response } from 'express';
import Log from '../models/log';
import mongoose from 'mongoose';
import Subscription from '../models/subscription';

export async function createLog(req: Request, res: Response): Promise<void> {
  const { eventId, userId } = req.body;

  try {
    // Check if a subscription exists for the specified userId and eventId
    const existingSubscription = await Subscription.findOne({
      user: userId,
      event: eventId,
    });

    if (!existingSubscription) {
      res.status(400).json({
        message: 'You are not subscribed to this eveny.',
      });
      return;
    }

    const newLog = new Log({
      event: eventId,
      user: userId,
    });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getAllLogs(req: Request, res: Response): Promise<void> {
  const { eventId, userId } = req.query;

  const aggregationPipeline = [
    {
      $match: {
        event: eventId
          ? new mongoose.Types.ObjectId(eventId as string)
          : { $exists: true },
        user: userId
          ? new mongoose.Types.ObjectId(userId as string)
          : { $exists: true },
      },
    },
    {
      $group: {
        _id: { event: '$event', user: '$user' },
        count: { $sum: 1 },
        logs: { $push: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id.event',
        foreignField: '_id',
        as: 'events',
      },
    },
    {
      $addFields: {
        event: { $arrayElemAt: ['$events', 0] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.user',
        foreignField: '_id',
        as: 'users',
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ['$users', 0] },
      },
    },
  ];

  try {
    const logs = await Log.aggregate(aggregationPipeline);
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
