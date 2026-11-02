
import { ObjectId } from "mongodb";

import { getDatabase } from "../config/database.js";

import type {
  EventDocument,
  EventResponse,
} from "../types/event.types.js";

/**
 * Event Service
 *
 * PURPOSE:
 * Keep MongoDB queries separate from API routes.
 *
 * WHY:
 * Routes handle HTTP.
 * Services handle database operations.
 */

/**
 * Access the events collection.
 */
function getEventsCollection() {
  return getDatabase().collection<EventDocument>("events");
}

/**
 * Convert MongoDB document into frontend-friendly data.
 */
function toEventResponse(
  event: EventDocument
): EventResponse {
  if (!event._id) {
    throw new Error("Event document is missing _id");
  }

  return {
    id: event._id.toHexString(),
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    thumbnailUrl: event.thumbnailUrl,
    location: event.location,
    eventDate: event.eventDate.toISOString(),
    createdAt: event.createdAt.toISOString(),
    organizer: event.organizer,
  };
}

/**
 * GET ALL UPCOMING EVENTS
 *
 * Only events scheduled for now or the future.
 * Sort by nearest event date first.
 */
export async function getUpcomingEvents(): Promise<
  EventResponse[]
> {
  const now = new Date();

  const events = await getEventsCollection()
    .find({
      eventDate: { $gte: now },
    })
    .sort({
      eventDate: 1,
      _id: 1,
    })
    .toArray();

  return events.map(toEventResponse);
}

/**
 * GET LATEST SIX UPCOMING EVENTS
 *
 * Sort by creation date (newest first),
 * then limit MongoDB query to 6 records.
 */
export async function getRecentEvents(): Promise<
  EventResponse[]
> {
  const now = new Date();

  const events = await getEventsCollection()
    .find({
      eventDate: { $gte: now },
    })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .limit(6)
    .toArray();

  return events.map(toEventResponse);
}

/**
 * GET A SINGLE EVENT
 *
 * Accept a MongoDB ObjectId as a string.
 *
 * Returns null when the ID is invalid
 * or the event does not exist.
 */
export async function getEventById(
  id: string
): Promise<EventResponse | null> {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return null;
  }

  const event = await getEventsCollection().findOne({
    _id: new ObjectId(id),
  });

  return event ? toEventResponse(event) : null;
}
