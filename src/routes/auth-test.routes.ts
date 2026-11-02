
import { Router } from "express";

import { requireAuth } from "../middleware/require-auth.js";

/**
 * Authentication Test Routes
 *
 * PURPOSE:
 * Verify that Express recognizes
 * a Better Auth authenticated user.
 *
 * GET /api/auth-test/me
 */

const router = Router();

// This endpoint is protected by JWT middleware.
router.get("/me", requireAuth, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated request successful",
    user: {
      id: res.locals.authUserId,
    },
  });
});

export default router;
