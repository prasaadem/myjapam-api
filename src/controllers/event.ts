// src/controllers/eventController.ts
import { Request, Response } from "express";
import Event from "../models/event";
import Block from "../models/block";
import Subscription from "../models/subscription";
import uploadToS3 from "../helpers/s3Uploader";
import mongoose from "mongoose";
import mailer from "../helpers/sesMailer";
import dotenv from "dotenv";

dotenv.config();

export async function createEvent(req: any, res: Response): Promise<void> {
  const { title, subtitle, maxSubscriberCount, value, visibility, user_id } =
    req.body;

  try {
    const file = req.file;
    let url: string = "";

    if (file) {
      url = await uploadToS3(file);
    }

    const newEvent = new Event({
      title,
      subtitle,
      maxSubscriberCount,
      value,
      visibility,
      url,
      user_id,
    });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getMyEvents(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    let query: any = [
      {
        $match: { user_id: new mongoose.Types.ObjectId(userId as string) },
      },
      {
        $sort: {
          timestamp: -1,
        },
      },
    ];

    const events = await Event.aggregate(query);
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAllPublicEvents(
  req: any,
  res: Response,
): Promise<void> {
  try {
    const requesterId = req.user?.userId;

    const blockedUsers = await Block.find({ blocker_id: requesterId });

    const blockedUserIds = blockedUsers.map((block) => block.blocked_id) || [];

    let query: any = [
      {
        $match: {
          visibility: "public",
          user_id: { $nin: blockedUserIds },
        },
      },
      {
        $sort: {
          timestamp: 1,
        },
      },
    ];

    const events = await Event.aggregate(query);
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const eventId = req.params.id;

  try {
    const events = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(eventId as string) },
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          userDetails: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]);

    if (events.length === 0) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Count the number of subscriptions for the event
    const subscriptionCount = await Subscription.countDocuments({
      event: eventId,
    });

    const event = events[0];

    // Include the subscription count in the response
    const eventDetails = {
      ...event,
      subscription_count: subscriptionCount,
    };

    res.status(200).json(eventDetails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getEventByCode(
  req: Request,
  res: Response,
): Promise<void> {
  const eventCode = req.params.eventCode;

  try {
    const events = await Event.aggregate([
      {
        $match: { eventCode: eventCode },
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          userDetails: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $addFields: {
          reports: {
            $filter: {
              input: "$reports",
              as: "report",
              cond: {
                $or: [
                  { $eq: ["$$report.status", "submitted"] },
                  { $eq: ["$$report.status", "accepted"] },
                ],
              },
            },
          },
        },
      },
    ]);

    if (events.length === 0) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const event = events[0];

    // Count the number of subscriptions for the event
    const subscriptionCount = await Subscription.countDocuments({
      event: event._id,
    });

    // Include the subscription count in the response
    const eventDetails = {
      ...event,
      subscription_count: subscriptionCount,
    };

    res.status(200).json(eventDetails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateEventById(req: any, res: Response): Promise<void> {
  const code = req.params.code;
  const { title, subtitle, maxSubscriberCount, value, visibility } = req.body;

  try {
    const file = req.file;
    let url: string = "";

    let data: any = { title, subtitle, maxSubscriberCount, value, visibility };

    if (file) {
      url = await uploadToS3(file);
      data = { ...data, url: url };
    }
    const updatedEvent = await Event.findOneAndUpdate(
      {
        eventCode: code,
      },
      data,
      {
        upsert: true,
        runValidators: true,
      },
    );

    if (updatedEvent) {
      res.status(200).json(updatedEvent);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function reportEventByCode(
  req: any,
  res: Response,
): Promise<void> {
  const code = req.params.code;
  const { reportedBy, message, blockedId } = req.body;

  try {
    if (reportedBy !== blockedId) {
      const block = new Block({
        blocker_id: reportedBy,
        blocked_id: blockedId,
      });

      await block.save();
    } else {
      res.status(400).json({ message: "You cannot report on your own Japam." });
    }

    let reportData: any = {
      reportedBy,
      message,
      reportedOn: new Date().toISOString(),
      status: "submitted",
    };

    const updatedEvent = await Event.updateOne(
      {
        eventCode: code,
      },
      { $push: { reports: reportData } },
    );

    if (updatedEvent) {
      await mailer.adminEmailNotify(
        `New report: eventCode:${code}`,
        `${process.env.APP_URL}/search/${code}`,
      );
      res.status(200).json(updatedEvent);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateEventReports(
  req: any,
  res: Response,
): Promise<void> {
  const is_admin = req.user?.is_admin;

  if (is_admin) {
    const code = req.params.code;
    const { reports } = req.body;

    try {
      const updatedEvent = await Event.updateOne(
        {
          eventCode: code,
        },
        { reports },
      );

      if (updatedEvent) {
        res.status(200).json(updatedEvent);
      } else {
        res.status(404).json({ message: "Event not found" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res
      .status(401)
      .json({ message: "You are unauthorized to update event reports" });
  }
}

export async function deleteEventById(req: any, res: Response) {
  const eventId = req.params.id;

  // Count the number of subscriptions for the event
  const subscriptionCount = await Subscription.countDocuments({
    event: eventId,
  });

  try {
    if (subscriptionCount) {
      res
        .status(500)
        .json({ message: "Can not delete japam, there are subscribers." });
    } else {
      const deletedEvent = await Event.findByIdAndDelete(eventId);

      if (deletedEvent) {
        res.json({ message: "Event deleted successfully" });
      } else {
        res.status(404).json({ message: "Event not found" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function searchEvents(req: any, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(400).json({ message: "User not authenticated" });
      return;
    }

    const {
      query,
      scope = "public",
      subscriptionFilter = "all",
      sortBy = "oldest",
      page = 1,
      limit = 20,
    } = req.body;

    const userObjectId = new mongoose.Types.ObjectId(userId as string);
    const skip = (Math.max(1, page) - 1) * limit;
    const sortDirection = sortBy === "newest" ? -1 : 1;

    // Get blocked user IDs
    const blockedUsers = await Block.find({ blocker_id: userId });
    const blockedUserIds = blockedUsers.map((block) => block.blocked_id) || [];

    // Build base match
    const matchConditions: any = {};

    if (scope === "public") {
      matchConditions.visibility = "public";
      matchConditions.user_id = { $nin: blockedUserIds };
    } else {
      // "my" — user's own events
      matchConditions.user_id = userObjectId;
    }

    // Exclude events reported by this user (non-resolved reports)
    if (scope === "public") {
      matchConditions["reports"] = {
        $not: {
          $elemMatch: {
            reportedBy: userObjectId,
            status: { $ne: "resolved" },
          },
        },
      };
    }

    // Add text search if query provided
    if (query && query.trim()) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchConditions.$or = [
        { title: { $regex: escapedQuery, $options: "i" } },
        { subtitle: { $regex: escapedQuery, $options: "i" } },
        { eventCode: { $regex: escapedQuery, $options: "i" } },
      ];
    }

    // Build aggregation pipeline
    const basePipeline: any[] = [
      { $match: matchConditions },
      { $sort: { timestamp: sortDirection } },
      // Simple $lookup — gets all subscriptions for each event
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "event",
          as: "_subscriptions",
        },
      },
      // Filter to only the current user's subscription
      {
        $addFields: {
          _subscriptions: {
            $filter: {
              input: "$_subscriptions",
              as: "sub",
              cond: { $eq: ["$$sub.user", userObjectId] },
            },
          },
        },
      },
      // Map to clean subscription object or null
      {
        $addFields: {
          subscription: {
            $cond: {
              if: { $gt: [{ $size: "$_subscriptions" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$_subscriptions._id", 0] },
                sum: { $arrayElemAt: ["$_subscriptions.sum", 0] },
                subscription_date: {
                  $arrayElemAt: ["$_subscriptions.subscription_date", 0],
                },
              },
              else: null,
            },
          },
        },
      },
    ];

    // Apply subscription filter
    if (subscriptionFilter === "subscribed") {
      basePipeline.push({ $match: { subscription: { $ne: null } } });
    } else if (subscriptionFilter === "not_subscribed") {
      basePipeline.push({ $match: { subscription: null } });
    }

    // Get total count
    const countResult = await Event.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated results
    const results = await Event.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _subscriptions: 0,
          reports: 0,
        },
      },
    ]);

    res.status(200).json({
      results,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Search events error:", error);
    res.status(500).json({ message: "Failed to search events" });
  }
}
