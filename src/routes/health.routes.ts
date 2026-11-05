
import { Router } from "express";
import { getDatabase } from "../config/database.js";


const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CommunityBond API is running",
  });
});


router.get("/database", async (_req, res) => {
  try {
    const db = getDatabase();

    await db.command({ ping: 1 });

    res.status(200).json({
      success: true,
      message: "MongoDB is connected",
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Database is unavailable",
    });
  }
});

export default router;
