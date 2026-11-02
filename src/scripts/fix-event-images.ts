
import {
  connectDatabase,
  getDatabase,
  closeDatabase,
} from "../config/database.js";

/**
 * Fix Event Image URLs
 *
 * PURPOSE:
 * Convert accidentally imported Markdown image
 * links into plain HTTPS image URLs.
 *
 * EXAMPLE:
 * Before: [https://example.com/a.jpg](https://example.com/a.jpg)
 * After:  https://example.com/a.jpg
 *
 * SAFETY:
 * - Updates only malformed thumbnailUrl fields.
 * - Does not delete documents.
 * - Leaves already valid URLs unchanged.
 */

async function fixEventImages() {
  try {
    // Connect to MongoDB Atlas.
    await connectDatabase();

    const collection = getDatabase().collection<{
      thumbnailUrl: string;
    }>("events");

    // Find only image URLs that start with Markdown syntax.
    const cursor = collection.find({
      thumbnailUrl: /^\[https?:\/\//,
    });

    let fixedCount = 0;

    for await (const event of cursor) {
      const original = event.thumbnailUrl;

      // Extract the URL inside the Markdown square brackets.
      const match = original.match(
        /^\[(https?:\/\/[^\]\s]+)\]\(/
      );

      if (!match) {
        console.log("Skipped unknown format:", event._id);
        continue;
      }

      // Remove Markdown escaping if present.
      const cleanUrl = match[1].replace(/\\&/g, "&");

      // Check that the result is a valid Unsplash HTTPS URL.
      try {
        const parsed = new URL(cleanUrl);

        if (
          parsed.protocol !== "https:" ||
          parsed.hostname !== "images.unsplash.com"
        ) {
          console.log("Skipped unexpected URL:", event._id);
          continue;
        }
      } catch {
        console.log("Skipped invalid URL:", event._id);
        continue;
      }

      // Update only this event's thumbnail URL.
      const result = await collection.updateOne(
        {
          _id: event._id,
          thumbnailUrl: original,
        },
        {
          $set: {
            thumbnailUrl: cleanUrl,
          },
        }
      );

      fixedCount += result.modifiedCount;
    }

    console.log(`Fixed image URLs: ${fixedCount}`);
    console.log("Image URL cleanup completed.");
  } catch (error) {
    console.error("Failed to fix image URLs:", error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

void fixEventImages();
