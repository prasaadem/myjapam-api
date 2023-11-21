// src/controllers/eventController.ts
import { Request, Response } from 'express';
import Event from '../models/event';

export async function createEvent(req: Request, res: Response): Promise<void> {
  const { title, subtitle, maxSubscriberCount } = req.body;

  const newEvent = new Event({
    title,
    subtitle,
    maxSubscriberCount,
    value: 1, // Assuming the initial count is 1
    visibility: 'public',
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
    const events = await Event.find();
    res.status(200).json(events);
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
