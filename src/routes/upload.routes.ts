
import { Router, type RequestHandler } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { requireAuth } from "../middleware/require-auth.js";

/**
 * Event Image Upload
 *
 * PURPOSE:
 * Upload a local image from the user's computer.
 *
 * SECURITY:
 * - Authenticated users only
 * - Maximum 5 MB per image
 * - Only JPEG, PNG and WebP accepted
 * - Decode and convert using Sharp
 * - Generate a safe random filename
 * - Never trust the original filename
 */

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Files are served from this fixed directory.
// Set UPLOAD_DIR to a persistent location in production.
const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || "uploads"
);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 0,
    parts: 1,
  },

  fileFilter: (_req, file, callback) => {
    const supported = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!supported.includes(file.mimetype)) {
      callback(
        new Error(
          "Only JPG, PNG and WebP images are allowed."
        )
      );
      return;
    }

    callback(null, true);
  },
});

/**
 * Convert Multer errors into a JSON response.
 */
const parseImage: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be smaller than 5 MB."
            : "Invalid image upload.",
      });
      return;
    }

    next();
  });
};

/**
 * POST /api/uploads/event-image
 *
 * This route requires a valid Better Auth JWT.
 */
router.post(
  "/event-image",
  requireAuth,
  parseImage,
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
      return;
    }

    try {
      /**
       * Decode the actual image, rather than
       * trusting only MIME type or file extension.
       *
       * Limit image dimensions to reduce
       * decompression-bomb risks.
       */
      const metadata = await sharp(req.file.buffer, {
        limitInputPixels: 40_000_000,
      }).metadata();

      if (
        !["jpeg", "png", "webp"].includes(
          metadata.format ?? ""
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Unsupported image format.",
        });
        return;
      }

      // Resize and convert to WebP.
      const optimizedImage = await sharp(req.file.buffer, {
        limitInputPixels: 40_000_000,
        animated: false,
      })
        .rotate()
        .resize({
          width: 1600,
          height: 1000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();

      // Generate a filename without user input.
      const filename = `${randomUUID()}.webp`;

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      await writeFile(
        path.join(uploadDirectory, filename),
        optimizedImage,
        { flag: "wx" }
      );

      // Use the server's own configured public URL.
      const baseUrl = (
        process.env.PUBLIC_API_BASE_URL ||
        "http://localhost:5000"
      ).replace(/\/$/, "");

      const imageUrl =
        `${baseUrl}/uploads/${filename}`;

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        data: {
          url: imageUrl,
        },
      });
    } catch (error) {
      console.error("Image upload failed:", error);

      res.status(400).json({
        success: false,
        message:
          "Image could not be processed. Please choose another image.",
      });
    }
  }
);

export default router;
