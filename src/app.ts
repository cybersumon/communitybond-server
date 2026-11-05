
import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import eventRoutes from "./routes/event.routes.js";
import subscriberRoutes from "./routes/subscriber.routes.js";
import authTestRoutes from "./routes/auth-test.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/api/health", healthRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/auth-test", authTestRoutes);
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
app.use("/api/uploads", uploadRoutes);
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

export default app;
