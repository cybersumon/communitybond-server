
import app from "./app.js";
import { env } from "./config/env.js";

import {
  connectDatabase,
  closeDatabase,
} from "./config/database.js";

import {
  ensureSubscriberIndexes,
} from "./services/subscriber.service.js";

/**
 * CommunityBond API Server
 *
 * STARTUP ORDER:
 * 1. Connect to MongoDB.
 * 2. Start Express.
 * 3. Listen for incoming API requests.
 *
 * WHY:
 * Avoid accepting normal API requests before
 * the database connection is established.
 */
async function startServer() {
  try {
    // Verify MongoDB before starting the API.
    await connectDatabase();
    await ensureSubscriberIndexes();

    const server = app.listen(env.PORT, () => {
      console.log(
        `CommunityBond API running at http://localhost:${env.PORT}`
      );
    });

    // Handle controlled application shutdown.
    async function shutdown() {
      console.log("Shutting down CommunityBond API...");

      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    }

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);

    await closeDatabase().catch(console.error);

    process.exitCode = 1;
  }
}

// Start the application.
void startServer();
