// src/controllers/subscriptionController.ts
import { Request, Response } from 'express';
import Subscription from '../models/subscription';
import Event from '../models/event';
import mongoose from 'mongoose';

export async function createSubscription(
  req: Request,
  res: Response
): Promise<void> {
  const { eventId, userId } = req.body;

  try {
    // Check if the event exists
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Check if the subscription already exists for the given event and user
    const existingSubscription = await Subscription.findOne({
      event: eventId,
      user: userId,
    });
    if (existingSubscription) {
      res.status(400).json({
        message: 'Subscription already exists for this event and user',
      });
      return;
    }

    // Check if the event has reached its maximum subscriber count
    const existingSubscriptions = await Subscription.find({ event: eventId });
    if (existingSubscriptions.length >= event.maxSubscriberCount) {
      res
        .status(400)
        .json({ message: 'Event has reached the maximum subscriber count' });
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
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId, eventId } = req.body;

    const query: any = {};
    if (userId) {
      query['user'] = new mongoose.Types.ObjectId(userId as string);
    }
    const subscriptions = await Subscription.find(query)
      .populate('event')
      .populate('user');
    res.status(200).json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
