
import {
  createHash,
  randomBytes,
} from "node:crypto";

import {
  MongoServerError,
  type Collection,
  type ObjectId,
} from "mongodb";

import { getDatabase } from "../config/database.js";

interface SubscriberDocument {
  _id?: ObjectId;
  email: string;
  subscribedAt: Date;
  unsubscribeTokenHash: string;
}

function collection(): Collection<SubscriberDocument> {
  return getDatabase().collection<SubscriberDocument>(
    "cause_subscribers"
  );
}

function hashToken(value: string): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

export async function ensureSubscriberIndexes(): Promise<void> {
  await collection().createIndex(
    { email: 1 },
    {
      unique: true,
      name: "unique_subscriber_email",
    }
  );

  await collection().createIndex(
    { unsubscribeTokenHash: 1 },
    {
      unique: true,
      name: "unique_unsubscribe_token",
    }
  );
}

export type SubscribeResult =
  | {
      kind: "new";
      email: string;
      unsubscribeToken: string;
    }
  | {
      kind: "existing";
    };

export async function subscribeToCauses(
  email: string
): Promise<SubscribeResult> {
  const unsubscribeToken = randomBytes(32)
    .toString("hex");

  try {
    await collection().insertOne({
      email,
      subscribedAt: new Date(),
      unsubscribeTokenHash:
        hashToken(unsubscribeToken),
    });

    return {
      kind: "new",
      email,
      unsubscribeToken,
    };
  } catch (error) {
    if (
      error instanceof MongoServerError &&
      error.code === 11000
    ) {
      return { kind: "existing" };
    }

    throw error;
  }
}
export async function unsubscribeFromCauses(
  token: string
): Promise<boolean> {
  const result = await collection().deleteOne({
    unsubscribeTokenHash: hashToken(token),
  });

  return result.deletedCount > 0;
}
