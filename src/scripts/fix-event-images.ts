
import {
  connectDatabase,
  getDatabase,
  closeDatabase,
} from "../config/database.js";
async function fixEventImages() {
  try {
    await connectDatabase();

    const collection = getDatabase().collection<{
      thumbnailUrl: string;
    }>("events");
    const cursor = collection.find({
      thumbnailUrl: /^\[https?:\/\//,
    });

    let fixedCount = 0;

    for await (const event of cursor) {
      const original = event.thumbnailUrl;
      const match = original.match(
        /^\[(https?:\/\/[^\]\s]+)\]\(/
      );

      if (!match) {
        console.log("Skipped unknown format:", event._id);
        continue;
      }
      const cleanUrl = match[1].replace(/\\&/g, "&");
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
