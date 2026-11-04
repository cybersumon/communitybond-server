
import express from "express";
import cors from "cors";
import path from "node:path";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import eventRoutes from "./routes/event.routes.js";
import subscriberRoutes from "./routes/subscriber.routes.js";
import authTestRoutes from "./routes/auth-test.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

/**
 * CommunityBond Express Application
 *
 * PURPOSE:
 * Configure middleware and register API routes.
 */

const app = express();

// Allow requests from the configured frontend.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Read JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Health check.
app.use("/api/health", healthRoutes);

// Community event routes.
app.use("/api/events", eventRoutes);

// Public newsletter subscription routes.
app.use("/api/subscribers", subscriberRoutes);

// Protected authentication test.
app.use("/api/auth-test", authTestRoutes);

// Public event images.
app.use(
  "/uploads",
  express.static(
    path.resolve(
      process.env.UPLOAD_DIR || "uploads"
    ),
    {
      index: false,
      dotfiles: "deny",
      fallthrough: false,
      setHeaders(res) {
        res.setHeader(
          "X-Content-Type-Options",
          "nosniff"
        );

        res.setHeader(
          "Cache-Control",
          "public, max-age=86400"
        );
      },
    }
  )
);

// Protected image upload route.
app.use("/api/uploads", uploadRoutes);

// Unknown API endpoint.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
