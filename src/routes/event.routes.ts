
import { Router } from "express";

import {
  getUpcomingEvents,
  getRecentEvents,
  getEventById,
} from "../services/event.service.js";

/**
 * Event Routes
 *
 * GET /api/events
 * GET /api/events/recent
 * GET /api/events/:id
 *
 * These are public, read-only routes.
 */

const router = Router();

/**
 * GET /api/events
 *
 * Return all upcoming community events.
 */
router.get("/", async (_req, res) => {
  try {
    const events = await getUpcomingEvents();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

/**
 * GET /api/events/recent
 *
 * Return up to six latest upcoming events.
 *
 * IMPORTANT:
 * Keep this route BEFORE /:id.
 */
router.get("/recent", async (_req, res) => {
  try {
    const events = await getRecentEvents();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Failed to fetch recent events:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch recent events",
    });
  }
});

/**
 * GET /api/events/:id
 *
 * Return one event by MongoDB ObjectId.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
      return;
    }

    const event = await getEventById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
});

export default router;
