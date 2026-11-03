
import type { ObjectId } from "mongodb";

/**
 * Volunteer Registration Types
 *
 * PURPOSE:
 * Define how volunteer registrations are
 * stored in MongoDB and returned through API.
 */

export interface EventRegistrationDocument {
  _id?: ObjectId;

  // Registered event ObjectId in string format.
  eventId: string;

  // Verified Better Auth user ID.
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
