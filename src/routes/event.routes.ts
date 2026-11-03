import { createEvent } from "../services/event.service.js";
import { createEventSchema } from "../validators/create-event.validation.js";
import { requireAuth } from "../middleware/require-auth.js";
import { Router } from "express";

import { getMyEvents } from "../services/event.service.js";


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

/**
 * POST /api/events
 *
 * PURPOSE:
 * Create an event for an authenticated user.
 *
 * SECURITY:
 * 1. Verify Better Auth JWT.
 * 2. Validate request body.
 * 3. Read organizer identity from verified JWT.
 * 4. Insert the event into MongoDB.
 */
router.post("/", requireAuth, async (req, res) => {
  // Validate event input before accessing the database.
  const validation = createEventSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid event information",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  // Identity is supplied by our JWT middleware.
  const userId = res.locals.authUserId as string | undefined;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    // Create an event owned by the authenticated user.
    const event = await createEvent(
      validation.data,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "AUTH_USER_NOT_FOUND" ||
        error.message === "INVALID_AUTH_USER")
    ) {
      res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
      return;
    }

    // Log server errors without exposing details publicly.
    console.error("Create event failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create event",
    });
  }
});

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


/**
 * GET /api/events/my
 *
 * PURPOSE:
 * Return all events owned by the authenticated user.
 *
 * SECURITY:
 * - Requires a valid Better Auth JWT.
 * - Uses the verified user ID.
 * - Never accepts organizer ID from the browser.
 */
router.get("/my", requireAuth, async (_req, res) => {
  const userId = res.locals.authUserId as
    | string
    | undefined;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const events = await getMyEvents(userId);

    res.status(200).json({
      success: true,
      message: "My events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Get my events failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve your events",
    });
  }
});



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
