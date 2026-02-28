// src/controllers/logController.ts
import { Request, Response } from "express";
import Log from "../models/log";
import mongoose from "mongoose";
import Subscription from "../models/subscription";
import { IBadgeInfo, determineBadges } from "./badge";
import Badge from "../models/badge";
const AWS = require("aws-sdk");

export async function createLog(req: Request, res: Response): Promise<void> {
  const { eventId, userId, subscriptionId } = req.body;

  try {
    // If subscriptionId is provided (mala events), look up that specific subscription.
    // Otherwise fall back to finding by (user, event) — existing japam behavior.
    let existingSubscription;
    if (subscriptionId) {
      existingSubscription = await Subscription.findById(subscriptionId);
    } else {
      existingSubscription = await Subscription.findOne({
        user: userId,
        event: eventId,
      });
    }

    if (!existingSubscription) {
      res.status(400).json({
        message: "You are not subscribed to this event.",
      });
      return;
    }

    const newLog = new Log({
      event: eventId,
      user: userId,
    });
    await newLog.save();

    // For mala (subscriptionId given): increment that subscription's sum by 1.
    // For japam: use the cumulative log sum (existing behavior).
    const newSum = subscriptionId
      ? (existingSubscription.sum as number) + 1
      : newLog.sum;

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      existingSubscription._id,
      { sum: newSum },
      { new: true }
    );

    const badges: IBadgeInfo[] = determineBadges(newSum);

    const badgeReqs = badges.map((b: IBadgeInfo) =>
      Badge.findOneAndUpdate(
        {
          userId,
          subscriptionId: existingSubscription!._id,
          eventId,
          badgeType: b.type,
        },
        {
          $setOnInsert: {
            userId,
            subscriptionId: existingSubscription!._id,
            eventId,
          },
          $set: {
            badgeName: b.name,
            badgeType: b.type,
          },
        },
        {
          new: true,
          upsert: true,
        }
      )
    );

    await Promise.all(badgeReqs);

    if (!updatedSubscription) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    res.status(201).json({ ...newLog.toObject(), sum: newSum });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getAllLogs(req: Request, res: Response): Promise<void> {
  const { eventId, userId } = req.body;
  const aggregationPipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: { event: "$event", user: "$user" },
        count: { $sum: 1 },
        logs: { $push: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "_id.event",
        foreignField: "_id",
        as: "events",
      },
    },
    {
      $addFields: {
        event: { $arrayElemAt: ["$events", 0] },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.user",
        foreignField: "_id",
        as: "users",
      },
    },
    {
      $lookup: {
        from: "badges",
        localField: "_id.event",
        foreignField: "eventId",
        as: "badges",
      },
    },
    {
      $addFields: {
        user: { $arrayElemAt: ["$users", 0] },
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
