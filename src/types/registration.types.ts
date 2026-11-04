
import type { ObjectId } from "mongodb";
import type { EventResponse } from "./event.types.js";

/**
 * Volunteer Registration Types
 *
 * PURPOSE:
 * Define MongoDB registration documents and
 * the API response types used by the frontend.
 */

export interface EventRegistrationDocument {
  _id?: ObjectId;

  eventId: string;
  userId: string;

  status: "joined";
  joinedAt: Date;
}

export interface EventRegistrationResponse {
  id: string;

  eventId: string;
  userId: string;

  status: "joined";
  joinedAt: string;
}

/**
 * Event information with the current
 * volunteer's registration.
 */
export interface JoinedEventResponse {
  registration: EventRegistrationResponse;
  event: EventResponse;
}

/**
 * Public volunteer information.
 *
 * SECURITY:
 * Do not return session tokens,
 * password hashes, or authentication data.
 */
export interface EventParticipantResponse {
  registrationId: string;
  userId: string;
  name: string;
  image: string | null;
  joinedAt: string;
}
