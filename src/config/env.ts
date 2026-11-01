
import "dotenv/config";

/**
 * Environment configuration.
 *
 * PURPOSE:
 * Read and validate required environment variables.
 *
 * WHY:
 * Centralized configuration prevents repeating
 * process.env throughout the application.
 */

// Read a required environment variable safely.
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

/**
 * Export validated configuration.
 *
 * These values are available to server-side code.
 */
export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: requireEnv("CLIENT_URL"),
  DB_NAME: requireEnv("DB_NAME"),
  MONGODB_URI: requireEnv("MONGODB_URI"),
};

// Reject an invalid port before starting the server.
if (
  !Number.isInteger(env.PORT) ||
  env.PORT < 1 ||
  env.PORT > 65535
) {
  throw new Error("PORT must be a valid TCP port.");
}
