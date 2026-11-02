
import express from "express";
import cors from "cors";
import authTestRoutes from "./routes/auth-test.routes.js";
import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import eventRoutes from "./routes/event.routes.js";


// Configure middleware and register API routes.
 

const app = express();

// Allow the configured Next.js frontend origin.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Read JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Health check routes.
app.use("/api/health", healthRoutes);

// Public event reading routes.
app.use("/api/events", eventRoutes);

// Protected authentication test endpoint.
app.use("/api/auth-test", authTestRoutes);

// Handle unknown endpoints.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
