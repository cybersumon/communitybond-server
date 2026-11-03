
import express from "express";
import path from "node:path";
import uploadRoutes from "./routes/upload.routes.js";
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


// Publicly serve uploaded event images.
app.use(
  "/uploads",
  express.static(
    path.resolve(process.env.UPLOAD_DIR || "uploads"),
    {
      index: false,
      dotfiles: "deny",
      fallthrough: false,
      setHeaders(res) {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader(
          "Cache-Control",
          "public, max-age=86400"
        );
      },
    }
  )
);

// Protected image upload endpoint.
app.use("/api/uploads", uploadRoutes);



// Handle unknown endpoints.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
