
import { z } from "zod";

const imageUrlValidation = z.url().refine(
  (value) => {
    const url = new URL(value);

    if (url.protocol === "https:") {
      return true;
    }

    if (process.env.NODE_ENV !== "production") {
      const allowedOrigins = [
        "http://localhost:5001",
        "http://127.0.0.1:5001",
      ];

      const isLocalUpload =
        allowedOrigins.includes(url.origin) &&
        /^\/uploads\/[a-f0-9-]+\.webp$/i.test(
          url.pathname
        ) &&
        url.search === "" &&
        url.hash === "";

      return isLocalUpload;
    }

    return false;
  },
  {
    message:
      "Please provide an HTTPS image URL or a valid local upload URL.",
  }
);
export const createEventValidation = z.strictObject({
  title: z
    .string()
    .trim()
    .min(5, "Event title must contain at least 5 characters.")
    .max(120, "Event title cannot exceed 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters.")
    .max(5000, "Description cannot exceed 5000 characters."),
  eventType: z
    .string()
    .trim()
    .min(2, "Please enter a valid event category.")
    .max(60, "Category cannot exceed 60 characters."),
  thumbnailUrl: imageUrlValidation,
  location: z
    .string()
    .trim()
    .min(3, "Location must contain at least 3 characters.")
    .max(200, "Location cannot exceed 200 characters."),
  eventDate: z
    .iso
    .datetime({ offset: true })
    .refine(
      (value) =>
        new Date(value).getTime() > Date.now(),
      {
        message: "Event date must be in the future.",
      }
    ),
});
export type CreateEventInput = z.infer<
  typeof createEventValidation
>;
