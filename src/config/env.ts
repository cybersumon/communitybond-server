
import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: requireEnv("CLIENT_URL"),
  DB_NAME: requireEnv("DB_NAME"),
  MONGODB_URI: requireEnv("MONGODB_URI"),
  AUTH_BASE_URL: requireEnv("AUTH_BASE_URL"),
};


if (
  !Number.isInteger(env.PORT) ||
  env.PORT < 1 ||
  env.PORT > 65535
) {
  throw new Error("PORT must be a valid TCP port.");
}
