
import { Router } from "express";

import { requireAuth } from "../middleware/require-auth.js";

const router = Router();


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
