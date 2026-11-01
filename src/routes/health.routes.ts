
import { Router } from "express";
import { getDatabase } from "../config/database.js";

/**
 * Health Routes
 *
 * PURPOSE:
 * Check whether the API and database are available.
 *
 * ENDPOINTS:
 * GET /api/health
 * GET /api/health/database
 */

const router = Router();

/**
 * Basic API health check.
 *
 * Does not require database access.
 */
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CommunityBond API is running",
  });
});

/**
 * Database health check.
 *
 * Uses ping to verify that MongoDB responds.
 */
router.get("/database", async (_req, res) => {
  try {
    const db = getDatabase();

    await db.command({ ping: 1 });

    res.status(200).json({
      success: true,
      message: "MongoDB is connected",
    });
  } catch {
    // Avoid exposing internal database errors publicly.
    res.status(503).json({
      success: false,
      message: "Database is unavailable",
    });
  }
});

export default router;
