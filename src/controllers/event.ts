// src/controllers/eventController.ts
import { Request, Response } from "express";
import Event from "../models/event";
import Subscription from "../models/subscription";
import uploadToS3 from "../helpers/s3Uploader";
import mongoose from "mongoose";

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
      value, // Assuming the initial count is 1
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

export async function getAllEvents(req: Request, res: Response): Promise<void> {
  try {
    let { user_id, visibility } = req.body || {};
    visibility =
      (visibility || []).length > 0
        ? visibility
        : ["public", "private", "group"];

    let query: any = [
      {
        $match: {
          _id: { $exists: true },
        },
      },
    ];

    if (user_id || visibility.length) {
      query = [
        {
          $match: {
            $and: [
              {
                user_id: user_id
                  ? new mongoose.Types.ObjectId(user_id)
                  : { $exists: true },
              },
              {
                visibility: {
                  $in: visibility,
                },
              },
            ],
          },
        },
      ];
    }

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
  res: Response
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
  const eventId = req.params.id;
  const { title, subtitle, maxSubscriberCount, value, visibility } = req.body;

  try {
    const file = req.file;
    let url: string = "";

    let data: any = { title, subtitle, maxSubscriberCount, value, visibility };

    if (file) {
      url = await uploadToS3(file);
      data = { ...data, url: url };
    }
    const updatedEvent = await Event.findByIdAndUpdate(eventId, data, {
      new: true,
      runValidators: true,
    });

    if (updatedEvent) {
      res.status(200).json(updatedEvent);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteEventById(req: any, res: Response) {
  const eventId = req.params.id;

  try {
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (deletedEvent) {
      res.json({ message: "Event deleted successfully" });
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
