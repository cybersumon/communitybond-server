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


import {
  getMyJoinedEvents,
  leaveEvent,
  getEventParticipants,
} from "../services/registration.service.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {

 const validation = createEventValidation.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Invalid event information",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }
  const userId = res.locals.authUserId as string | undefined;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {

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

    console.error("Create event failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create event",
    });
  }
});

router.get(
  "/joined",
  requireAuth,
  async (_req, res) => {
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
      const joinedEvents =
        await getMyJoinedEvents(userId);

      res.status(200).json({
        success: true,
        count: joinedEvents.length,
        data: joinedEvents,
      });
    } catch (error) {
      console.error(
        "Get joined events failed:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to load joined events",
      });
    }
  }
);

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

router.delete(
  "/:id",
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



/**
 * GET /api/events/:id/participants
 *
 * PURPOSE:
 * Allow only the event organizer to view volunteers.
 * The service verifies ownership using the authenticated JWT user ID.
 */
router.get("/:id/participants", requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const userId = res.locals.authUserId as string | undefined;

  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  if (typeof eventId !== "string" || !/^[a-fA-F0-9]{24}$/.test(eventId)) {
    res.status(400).json({ success: false, message: "Invalid event ID" });
    return;
  }

  try {
    const participants = await getEventParticipants(eventId, userId);
    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      res.status(403).json({
        success: false,
        message: "Only the organizer can view participants",
      });
      return;
    }

    console.error("Get event participants failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load participants",
    });
  }
});

/**
 * DELETE /api/events/:id/join
 *
 * PURPOSE:
 * Allow a volunteer to leave an event.
 * The service only deletes a registration owned by this JWT user.
 */
router.delete("/:id/join", requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const userId = res.locals.authUserId as string | undefined;

  if (!userId) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  if (typeof eventId !== "string" || !/^[a-fA-F0-9]{24}$/.test(eventId)) {
    res.status(400).json({ success: false, message: "Invalid event ID" });
    return;
  }

  try {
    await leaveEvent(eventId, userId);
    res.status(200).json({ success: true, message: "You have left the event" });
  } catch (error) {
    if (error instanceof Error && error.message === "REGISTRATION_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "You are not registered for this event",
      });
      return;
    }

    console.error("Leave event failed:", error);
    res.status(500).json({ success: false, message: "Unable to leave event" });
  }
});

export default router;
