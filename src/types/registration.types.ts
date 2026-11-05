
import type { ObjectId } from "mongodb";
import type { EventResponse } from "./event.types.js";
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

export interface JoinedEventResponse {
  registration: EventRegistrationResponse;
  event: EventResponse;
}

export interface EventParticipantResponse {
  registrationId: string;
  userId: string;
  name: string;
  image: string | null;
  joinedAt: string;
}
