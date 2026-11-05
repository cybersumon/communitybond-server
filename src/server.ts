
import app from "./app.js";
import { env } from "./config/env.js";

import {
  connectDatabase,
  closeDatabase,
} from "./config/database.js";

import {
  ensureSubscriberIndexes,
} from "./services/subscriber.service.js";

async function startServer() {
  try {
    await connectDatabase();
    await ensureSubscriberIndexes();

    const server = app.listen(env.PORT, () => {
      console.log(
        `CommunityBond API running at http://localhost:${env.PORT}`
      );
    });

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


void startServer();
