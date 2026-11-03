import { createEvent } from "../services/event.service.js";
import {
  createEventValidation,
} from "../validators/create-event.validation.js";
import { requireAuth } from "../middleware/require-auth.js";
import { Router } from "express";

import { getMyEvents } from "../services/event.service.js";


import {
  getUpcomingEvents,
  getRecentEvents,
  getEventById,
} from "../services/event.service.js";

import { deleteEvent } from "../services/event.service.js";


import {
  joinEvent,
  getMyRegistrationStatus,
} from "../services/registration.service.js";

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
 const validation = createEventValidation.safeParse(req.body);

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




/**
 * DELETE /api/events/:id
 *
 * PURPOSE:
 * Delete an event owned by the logged-in user.
 *
 * SECURITY:
 * - Better Auth JWT is required.
 * - Organizer ownership is checked by the service.
 */
router.delete(
  "/:id",
  requireAuth,
  async (req, res) => {
    const eventId = req.params.id;

    const userId = res.locals.authUserId as
      | string
      | undefined;

    // Authentication is required.
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Validate the event ID format.
    if (
      typeof eventId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(eventId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
      return;
    }

    try {
      await deleteEvent(eventId, userId);

      res.status(200).json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "FORBIDDEN") {
          res.status(403).json({
            success: false,
            message:
              "You are not allowed to delete this event",
          });
          return;
        }

        if (error.message === "EVENT_NOT_FOUND") {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }
      }

      console.error("Delete event failed:", error);

      res.status(500).json({
        success: false,
        message: "Unable to delete event",
      });
    }
  }
);



/**
 * POST /api/events/:id/join
 *
 * PURPOSE:
 * Register the authenticated user as a volunteer.
 *
 * SECURITY:
 * - JWT required.
 * - User ID comes from verified JWT.
 * - Duplicate registration is rejected.
 * - Organizer cannot join own event.
 */
router.post(
  "/:id/join",
  requireAuth,
  async (req, res) => {
    const eventId = req.params.id;

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

    if (
      typeof eventId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(eventId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
      return;
    }

    try {
      const registration = await joinEvent(
        eventId,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Successfully joined the event",
        data: registration,
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCodes: Record<string, number> = {
          INVALID_EVENT_ID: 400,
          EVENT_NOT_FOUND: 404,
          EVENT_ALREADY_STARTED: 409,
          ORGANIZER_CANNOT_JOIN: 403,
          ALREADY_JOINED: 409,
        };

        const errorMessages: Record<string, string> = {
          INVALID_EVENT_ID: "Invalid event ID",
          EVENT_NOT_FOUND: "Event not found",
          EVENT_ALREADY_STARTED:
            "Registration is closed for this event",
          ORGANIZER_CANNOT_JOIN:
            "You cannot join your own event",
          ALREADY_JOINED:
            "You have already joined this event",
        };

        const status = statusCodes[error.message];

        if (status) {
          res.status(status).json({
            success: false,
            message: errorMessages[error.message],
          });
          return;
        }
      }

      console.error("Join event failed:", error);

      res.status(500).json({
        success: false,
        message: "Unable to join event",
      });
    }
  }
);

/**
 * GET /api/events/:id/my-registration
 *
 * PURPOSE:
 * Check if the current user has joined an event.
 *
 * RESPONSE:
 * joined: true  -> user is registered
 * joined: false -> user is not registered
 */
router.get(
  "/:id/my-registration",
  requireAuth,
  async (req, res) => {
    const eventId = req.params.id;

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

    if (
      typeof eventId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(eventId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
      return;
    }

    try {
      const registration =
        await getMyRegistrationStatus(
          eventId,
          userId
        );

      res.status(200).json({
        success: true,
        joined: registration !== null,
        data: registration,
      });
    } catch (error) {
      console.error(
        "Registration status check failed:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to check registration status",
      });
    }
  }
);



export default router;
