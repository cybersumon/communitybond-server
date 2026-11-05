
import { MongoServerError, ObjectId } from "mongodb";

import { getDatabase } from "../config/database.js";




import type {
  EventDocument,
  EventResponse,
} from "../types/event.types.js";

import type {
  EventRegistrationDocument,
  EventRegistrationResponse,
} from "../types/registration.types.js";

import type {
  JoinedEventResponse,
  EventParticipantResponse,
} from "../types/registration.types.js";

function getRegistrationsCollection() {
  return getDatabase().collection<EventRegistrationDocument>(
    "event_registrations"
  );
}

function getEventsCollection() {
  return getDatabase().collection<EventDocument>(
    "events"
  );
}

function toRegistrationResponse(
  registration: EventRegistrationDocument
): EventRegistrationResponse {
  if (!registration._id) {
    throw new Error("REGISTRATION_ID_MISSING");
  }

  return {
    id: registration._id.toHexString(),
    eventId: registration.eventId,
    userId: registration.userId,
    status: registration.status,
    joinedAt: registration.joinedAt.toISOString(),
  };
}

let registrationIndexPromise:
  Promise<string | undefined> | undefined;


export function ensureRegistrationIndexes() {
  if (!registrationIndexPromise) {
    registrationIndexPromise =
      getRegistrationsCollection()
        .createIndex(
          {
            eventId: 1,
            userId: 1,
          },
          {
            unique: true,
            name: "unique_event_volunteer",
          }
        )
        .catch((error: unknown) => {
          // Allow a later request to retry index creation.
          registrationIndexPromise = undefined;
          throw error;
        });
  }

  return registrationIndexPromise;
}


export async function joinEvent(
  eventId: string,
  authenticatedUserId: string
): Promise<EventRegistrationResponse> {

  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const normalizedEventId = eventId.toLowerCase();


  const event = await getEventsCollection().findOne({
    _id: new ObjectId(normalizedEventId),
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }


  if (event.eventDate.getTime() <= Date.now()) {
    throw new Error("EVENT_ALREADY_STARTED");
  }

  if (event.organizer.id === authenticatedUserId) {
    throw new Error("ORGANIZER_CANNOT_JOIN");
  }

  await ensureRegistrationIndexes();

  const newRegistration: EventRegistrationDocument = {
    eventId: normalizedEventId,
    userId: authenticatedUserId,
    status: "joined",
    joinedAt: new Date(),
  };

  try {
    const result =
      await getRegistrationsCollection().insertOne(
        newRegistration
      );

    return toRegistrationResponse({
      ...newRegistration,
      _id: result.insertedId,
    });
  } catch (error) {
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      throw new Error("ALREADY_JOINED");
    }

    throw error;
  }
}


export async function getMyRegistrationStatus(
  eventId: string,
  authenticatedUserId: string
): Promise<EventRegistrationResponse | null> {
  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const registration =
    await getRegistrationsCollection().findOne({
      eventId: eventId.toLowerCase(),
      userId: authenticatedUserId,
    });

  if (!registration) {
    return null;
  }

  return toRegistrationResponse(registration);
}

function toPublicEvent(
  event: EventDocument
): EventResponse {
  if (!event._id) {
    throw new Error("EVENT_ID_MISSING");
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


export async function getMyJoinedEvents(
  authenticatedUserId: string
): Promise<JoinedEventResponse[]> {
  const registrations =
    await getRegistrationsCollection()
      .find({
        userId: authenticatedUserId,
        status: "joined",
      })
      .sort({ joinedAt: -1 })
      .toArray();

  if (registrations.length === 0) {
    return [];
  }

  const eventIds = registrations
    .filter((item) =>
      /^[a-fA-F0-9]{24}$/.test(item.eventId)
    )
    .map((item) => new ObjectId(item.eventId));

  if (eventIds.length === 0) {
    return [];
  }

  const events = await getEventsCollection()
    .find({
      _id: { $in: eventIds },
    })
    .toArray();

  const eventMap = new Map(
    events.map((event) => [
      event._id!.toHexString(),
      event,
    ])
  );
  const joinedEvents: JoinedEventResponse[] = [];

  for (const registration of registrations) {
    const event = eventMap.get(
      registration.eventId.toLowerCase()
    );

    if (!event) continue;

    joinedEvents.push({
      registration:
        toRegistrationResponse(registration),
      event: toPublicEvent(event),
    });
  }

  return joinedEvents;
}

export async function leaveEvent(
  eventId: string,
  authenticatedUserId: string
): Promise<void> {
  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const result =
    await getRegistrationsCollection().deleteOne({
      eventId: eventId.toLowerCase(),
      userId: authenticatedUserId,
      status: "joined",
    });

  if (result.deletedCount !== 1) {
    throw new Error("REGISTRATION_NOT_FOUND");
  }
}

export async function getEventParticipants(
  eventId: string,
  authenticatedUserId: string
): Promise<EventParticipantResponse[]> {
  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const event = await getEventsCollection().findOne({
    _id: new ObjectId(eventId),
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  if (
    event.organizer.id !== authenticatedUserId
  ) {
    throw new Error("FORBIDDEN");
  }

  const registrations =
    await getRegistrationsCollection()
      .find({
        eventId: eventId.toLowerCase(),
        status: "joined",
      })
      .sort({ joinedAt: -1 })
      .toArray();

  if (registrations.length === 0) {
    return [];
  }

  const userIds = registrations
    .filter((registration) =>
      /^[a-fA-F0-9]{24}$/.test(registration.userId)
    )
    .map(
      (registration) =>
        new ObjectId(registration.userId)
    );

  const users = await getDatabase()
    .collection<{
      _id: ObjectId;
      name: string;
      image?: string | null;
    }>("user")
    .find(
      {
        _id: { $in: userIds },
      },
      {
        projection: {
          name: 1,
          image: 1,
        },
      }
    )
    .toArray();

  const userMap = new Map(
    users.map((user) => [
      user._id.toHexString(),
      user,
    ])
  );

  return registrations
    .filter((registration) =>
      Boolean(
        userMap.get(registration.userId)
      )
    )
    .map((registration) => {
      const user = userMap.get(
        registration.userId
      )!;

      return {
        registrationId:
          registration._id!.toHexString(),
        userId: registration.userId,
        name: user.name,
        image: user.image ?? null,
        joinedAt:
          registration.joinedAt.toISOString(),
      };
    });
}
