
import type { ObjectId } from "mongodb";

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
