
import { Router } from "express";

import {
  subscribeValidation,
  unsubscribeValidation,
} from "../validators/subscriber.validation.js";

import {
  subscribeToCauses,
  unsubscribeFromCauses,
} from "../services/subscriber.service.js";

import {
  sendSubscriptionWelcomeEmail,
} from "../services/subscriber-mail.service.js";

/**
 * Public newsletter subscription routes.
 */
const router = Router();

/**
 * Basic development-only rate limiting.
 *
 * Production should use a proper shared
 * rate limiter to prevent abuse.
 */
const requests = new Map<
  string,
  { count: number; resetAt: number }
>();

router.use((req, res, next) => {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const previous = requests.get(ip);

  const current =
    !previous || previous.resetAt <= now
      ? { count: 0, resetAt: now + 60_000 }
      : previous;

  current.count += 1;
  requests.set(ip, current);

  if (current.count > 10) {
    res.status(429).json({
      success: false,
      message: "Too many attempts. Try again shortly.",
    });
    return;
  }

  next();
});

/**
 * POST /api/subscribers
 *
 * Save newsletter subscribers to MongoDB.
 */
router.post("/", async (req, res) => {
  const parsed = subscribeValidation.safeParse(
    req.body
  );

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Enter a valid email address.",
    });
    return;
  }

  try {
    const result = await subscribeToCauses(
      parsed.data.email
    );

    if (result.kind === "new") {
      try {
        await sendSubscriptionWelcomeEmail(
          result.email,
          result.unsubscribeToken
        );
      } catch (error) {
        console.error(
          "Welcome email failed:",
          error
        );
      }
    }

    // Do not disclose whether an email exists.
    res.status(200).json({
      success: true,
      message:
        "Subscription request received. You'll receive cause updates when available.",
    });
  } catch (error) {
    console.error(
      "Subscription failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to subscribe right now.",
    });
  }
});

/**
 * POST /api/subscribers/unsubscribe
 *
 * Requires the secret token from email.
 */
router.post("/unsubscribe", async (req, res) => {
  const parsed = unsubscribeValidation.safeParse(
    req.body
  );

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid unsubscribe link.",
    });
    return;
  }

  try {
    await unsubscribeFromCauses(
      parsed.data.token
    );

    res.status(200).json({
      success: true,
      message:
        "Your unsubscribe request has been processed.",
    });
  } catch (error) {
    console.error(
      "Unsubscribe failed:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to unsubscribe right now.",
    });
  }
});

export default router;
