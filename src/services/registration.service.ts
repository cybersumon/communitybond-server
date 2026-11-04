
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

/**
 * Volunteer Registration Service
 *
 * PURPOSE:
 * - Join an upcoming community event.
 * - Prevent duplicate registrations.
 * - Prevent organizers from joining their own events.
 * - Check the logged-in user's registration status.
 *
 * SECURITY:
 * User ID must come from the verified JWT.
 */


// MongoDB Collections


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


// MongoDB Document to API Response


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


// Unique Registration Index


let registrationIndexPromise:
  Promise<string | undefined> | undefined;

/**
 * A unique compound index prevents the same
 * user from joining the same event twice.
 */
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

// Join Event

/**
 * Register the authenticated user for an event.
 *
 * @param eventId MongoDB Event ID
 * @param authenticatedUserId Verified JWT user ID
 */
export async function joinEvent(
  eventId: string,
  authenticatedUserId: string
): Promise<EventRegistrationResponse> {
  // Validate the Event ID.
  if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
    throw new Error("INVALID_EVENT_ID");
  }

  const normalizedEventId = eventId.toLowerCase();

  // Find the event.
  const event = await getEventsCollection().findOne({
    _id: new ObjectId(normalizedEventId),
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  // Registration closes when the event starts.
  if (event.eventDate.getTime() <= Date.now()) {
    throw new Error("EVENT_ALREADY_STARTED");
  }

  // Organizer cannot join their own event.
  if (event.organizer.id === authenticatedUserId) {
    throw new Error("ORGANIZER_CANNOT_JOIN");
  }

  // Enforce database-level duplicate protection.
  await ensureRegistrationIndexes();

  const newRegistration: EventRegistrationDocument = {
    eventId: normalizedEventId,
    userId: authenticatedUserId,
    status: "joined",
    joinedAt: new Date(),
  };

  try {
    // Save the volunteer registration.
    const result =
      await getRegistrationsCollection().insertOne(
        newRegistration
      );

    return toRegistrationResponse({
      ...newRegistration,
      _id: result.insertedId,
    });
  } catch (error) {
    // MongoDB duplicate key error.
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      throw new Error("ALREADY_JOINED");
    }

    throw error;
  }
}

// Registration Status

/**
 * Check if the logged-in user already joined
 * a particular event.
 *
 * Returns null if no registration exists.
 */
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

/**
 * Convert an event document into
 * the existing public API response structure.
 *
 * This follows the same shape as event.service.ts.
 */
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

/**
 * GET MY JOINED EVENTS
 *
 * PURPOSE:
 * Retrieve all events joined by the
 * authenticated volunteer.
 *
 * SECURITY:
 * User ID comes from verified JWT.
 */
export async function getMyJoinedEvents(
  authenticatedUserId: string
): Promise<JoinedEventResponse[]> {
  // Find only this user's registrations.
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

  // Collect MongoDB event IDs.
  const eventIds = registrations
    .filter((item) =>
      /^[a-fA-F0-9]{24}$/.test(item.eventId)
    )
    .map((item) => new ObjectId(item.eventId));

  if (eventIds.length === 0) {
    return [];
  }

  // Fetch all relevant event documents.
  const events = await getEventsCollection()
    .find({
      _id: { $in: eventIds },
    })
    .toArray();

  // Create a lookup for efficient matching.
  const eventMap = new Map(
    events.map((event) => [
      event._id!.toHexString(),
      event,
    ])
  );

  // Combine each registration with its event.
  // Missing/deleted events are excluded.
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

/**
 * LEAVE EVENT
 *
 * PURPOSE:
 * Remove the authenticated user's
 * registration from an event.
 *
 * SECURITY:
 * Only the registration belonging to
 * the current JWT user can be deleted.
 *
 * NOTE:
 * The event itself is never deleted.
 */
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

/**
 * GET EVENT PARTICIPANTS
 *
 * PURPOSE:
 * Allow organizers to view registered
 * volunteers for their own event.
 *
 * SECURITY:
 * - Event must exist.
 * - Only its organizer may access the list.
 * - Return limited user profile information.
 */
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

  // Verify that the logged-in user is organizer.
  if (
    event.organizer.id !== authenticatedUserId
  ) {
    throw new Error("FORBIDDEN");
  }

  // Fetch registrations for this event.
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

  // Only use valid Better Auth MongoDB user IDs.
  const userIds = registrations
    .filter((registration) =>
      /^[a-fA-F0-9]{24}$/.test(registration.userId)
    )
    .map(
      (registration) =>
        new ObjectId(registration.userId)
    );

  // Fetch minimal public profile fields.
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

  // Build safe participant responses.
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
