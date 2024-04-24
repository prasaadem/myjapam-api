// src/controllers/subscriptionController.ts
import { Request, Response } from "express";
import Subscription from "../models/subscription";
import Event from "../models/event";
import mongoose from "mongoose";
import Log from "../models/log";

export async function createSubscription(
  req: Request,
  res: Response
): Promise<void> {
  const { eventId, userId } = req.body;

  try {
    // Check if the event exists
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Check if the subscription already exists for the given event and user
    const existingSubscription = await Subscription.findOne({
      event: eventId,
      user: userId,
    });
    if (existingSubscription) {
      res.status(400).json({
        message: "Subscription already exists for this event and user",
      });
      return;
    }

    // Check if the event has reached its maximum subscriber count
    const existingSubscriptions = await Subscription.find({ event: eventId });
    if (existingSubscriptions.length >= event.maxSubscriberCount) {
      res
        .status(400)
        .json({ message: "Event has reached the maximum subscriber count" });
      return;
    }

    // Create a new subscription
    const newSubscription = new Subscription({
      event: eventId,
      user: userId,
    });

    await newSubscription.save();
    res.status(201).json(newSubscription);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAllSubscriptions(
  req: any,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;

    const query: any = {};
    if (userId) {
      const subscriptions = await Subscription.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId as string),
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "events",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "users",
          },
        },
        {
          $lookup: {
            from: "badges",
            localField: "_id",
            foreignField: "subscriptionId",
            as: "badges",
          },
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$users", 0] },
          },
        },
        {
          $addFields: {
            event: { $arrayElemAt: ["$events", 0] },
          },
        },
      ]);
      res.status(200).json(subscriptions);
    } else {
      res.status(200).json([]);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateAllSubscriptions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Find the log with the highest sum for each user and event
    const highestSumLogs = await Log.aggregate([
      {
        $group: {
          _id: { userId: "$user", eventId: "$event" },
          maxSum: { $max: "$sum" },
        },
      },
    ]);

    // Update subscriptions based on the highest sum logs
    const updatePromises = highestSumLogs.map(async (log) => {
      const { _id, maxSum } = log;
      const { userId, eventId } = _id;

      const updatedSubscription = await Subscription.findOneAndUpdate(
        { user: userId, event: eventId },
        { sum: maxSum },
        { new: true }
      );

      return updatedSubscription;
    });

    const updatedSubscriptions = await Promise.all(updatePromises);

    res.json(updatedSubscriptions);
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
