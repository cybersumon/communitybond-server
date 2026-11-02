
import type { ObjectId } from "mongodb";

/**
 * Event Types
 *
 * PURPOSE:
 * Define the shape of community events.
 *
 * DB:
 * MongoDB stores _id as an ObjectId.
 *
 * API:
 * Frontend receives id as a string.
 */

export const EVENT_TYPES = [
  "Cleanup",
  "Tree Plantation",
  "Donation",
  "Awareness",
  "Education",
  "Health",
  "Other",
] as const;

export type EventType = string;

export interface EventOrganizer {
  id: string;
  name: string;
  photoURL?: string;
}

/**
 * MongoDB document structure.
 */
export interface EventDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  eventType: EventType;
  thumbnailUrl: string;
  location: string;
  eventDate: Date;
  createdAt: Date;
  organizer: EventOrganizer;
}

/**
 * Public API response structure.
 *
 * Matches the existing frontend event fields.
 */
export interface EventResponse {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  thumbnailUrl: string;
  location: string;
  eventDate: string;
  createdAt: string;
  organizer: EventOrganizer;
}
