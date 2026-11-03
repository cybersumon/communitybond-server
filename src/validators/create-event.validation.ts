
import { z } from "zod";

export const createEventSchema = z.strictObject({ title: z.string().trim().min(5).max(120),
  

  description: z.string().trim().min(20).max(5000),

  eventType: z.string().trim().min(2).max(60),


/**
 * Validate Event Thumbnail URL
 *
 * RULES:
 * 1. External images must use HTTPS.
 * 2. Local development uploads may use HTTP.
 * 3. Other HTTP URLs are rejected.
 */
thumbnailUrl: z.url().refine(
  (value) => {
    const url = new URL(value);

    // Allow public HTTPS image URLs.
    if (url.protocol === "https:") {
      return true;
    }

    // Allow local uploads during development only.
    if (process.env.NODE_ENV !== "production") {
      const allowedOrigins = [
        "http://localhost:5000",
        "http://127.0.0.1:5000",
      ];

      const isLocalUpload =
        allowedOrigins.includes(url.origin) &&
        /^\/uploads\/[a-f0-9-]+\.webp$/i.test(
          url.pathname
        );

      if (isLocalUpload) {
        return true;
      }
    }

    return false;
  },
  "Please provide an HTTPS image URL or a valid local upload URL."
),


  location: z.string().trim().min(3).max(200),

  eventDate: z.iso.datetime({ offset: true }).refine( (value) => new Date(value).getTime() > Date.now(),
    
    "Event date must be in the future"
  ),
});


export type CreateEventInput = z.infer<
  typeof createEventSchema
>;
