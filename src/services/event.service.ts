
import { ObjectId } from "mongodb";

import { getDatabase } from "../config/database.js";

import type {
  EventDocument,
  EventResponse,
} from "../types/event.types.js";

import type {
  CreateEventInput,
} from "../validators/create-event.validation.js";

function getEventsCollection() {
  return getDatabase().collection<EventDocument>("events");
}

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

export async function createEvent(
  input: CreateEventInput,
  authenticatedUserId: string
): Promise<EventResponse> {
  const db = getDatabase();

  if (!/^[a-fA-F0-9]{24}$/.test(authenticatedUserId)) {
    throw new Error("INVALID_AUTH_USER");
  }

  const usersCollection = db.collection<{
    name: string;
    email: string;
    image?: string | null;
  }>("user");

  const user = await usersCollection.findOne({
    _id: new ObjectId(authenticatedUserId),
  });

  if (!user) {
    throw new Error("AUTH_USER_NOT_FOUND");
  }

  const newEvent: EventDocument = {
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    thumbnailUrl: input.thumbnailUrl,
    location: input.location,
    eventDate: new Date(input.eventDate),
    createdAt: new Date(),

    organizer: {
      id: authenticatedUserId,
      name: user.name,
      ...(user.image ? { photoURL: user.image } : {}),
    },
  };

  const result = await getEventsCollection().insertOne(
    newEvent
  );

  return toEventResponse({
    ...newEvent,
    _id: result.insertedId,
  });
}

export async function getMyEvents(
  authenticatedUserId: string
): Promise<EventResponse[]> {
  const collection = getEventsCollection();

  const events = await collection
    .find({
      "organizer.id": authenticatedUserId,
    })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .toArray();

  return events.map(toEventResponse);
}

export async function deleteEvent(
  eventId: string,
  authenticatedUserId: string
): Promise<void> {

  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const collection = getEventsCollection();
  const objectId = new ObjectId(eventId);

  const existingEvent = await collection.findOne({
    _id: objectId,
  });

  if (!existingEvent) {
    throw new Error("EVENT_NOT_FOUND");
  }

  if (
    existingEvent.organizer.id !==
    authenticatedUserId
  ) {
    throw new Error("FORBIDDEN");
  }

  const result = await collection.deleteOne({
    _id: objectId,
    "organizer.id": authenticatedUserId,
  });

  if (result.deletedCount !== 1) {
    throw new Error("EVENT_NOT_FOUND");
  }
}
