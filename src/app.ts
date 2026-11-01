
import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";

/**
 * Express Application
 *
 * PURPOSE:
 * Configure middleware and register API routes.
 *
 * WHY:
 * Separating app configuration from server startup
 * makes the backend easier to test and maintain.
 */

const app = express();

/**
 * Allow our Next.js frontend to call the API.
 *
 * Only the configured frontend origin is allowed
 * to read browser responses.
 */
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Parse incoming JSON request bodies.
app.use(express.json({ limit: "1mb" }));

/**
 * Register the health routes.
 *
 * GET /api/health
 * GET /api/health/database
 */
app.use("/api/health", healthRoutes);

/**
 * Handle API endpoints that do not exist.
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
