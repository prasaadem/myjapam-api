// src/controllers/eventController.ts
import { Request, Response } from 'express';
import Event from '../models/event';
import Subscription from '../models/subscription';

export async function createEvent(req: Request, res: Response): Promise<void> {
  const { title, subtitle, maxSubscriberCount, value, visibility } = req.body;

  const newEvent = new Event({
    title,
    subtitle,
    maxSubscriberCount,
    value, // Assuming the initial count is 1
    visibility,
  });

  try {
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getAllEvents(req: Request, res: Response): Promise<void> {
  try {
    const { visibility } = req.query;
    const query = visibility ? { visibility } : {};

    const events = await Event.find(query);
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Count the number of subscriptions for the event
    const subscriptionCount = await Subscription.countDocuments({
      event: eventId,
    });

    // Include the subscription count in the response
    const eventDetails = {
      _id: event._id,
      title: event.title,
      subtitle: event.subtitle,
      maxSubscriberCount: event.maxSubscriberCount,
      eventCode: event.eventCode,
      value: event.value,
      visibility: event.visibility,
      subscription_count: subscriptionCount,
    };

    res.status(200).json(eventDetails);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateEventById(
  req: Request,
  res: Response
): Promise<void> {
  const eventId = req.params.id;
  const { title, subtitle, maxSubscriberCount, value, visibility } = req.body;

  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { title, subtitle, maxSubscriberCount, value, visibility },
      { new: true, runValidators: true }
    );

    if (updatedEvent) {
      res.status(200).json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
