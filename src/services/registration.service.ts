
import { MongoServerError, ObjectId } from "mongodb";

import { getDatabase } from "../config/database.js";

import type { EventDocument } from "../types/event.types.js";

import type {
  EventRegistrationDocument,
  EventRegistrationResponse,
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

// ---------------------------------------------
// MongoDB Collections
// ---------------------------------------------

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

// ---------------------------------------------
// MongoDB Document to API Response
// ---------------------------------------------

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

// ---------------------------------------------
// Unique Registration Index
// ---------------------------------------------

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

// ---------------------------------------------
// Join Event
// ---------------------------------------------

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

// ---------------------------------------------
// My Registration Status
// ---------------------------------------------

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
