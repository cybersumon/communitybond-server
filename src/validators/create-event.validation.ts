
import { z } from "zod";

export const createEventSchema = z.strictObject({ title: z.string().trim().min(5).max(120),
  

  description: z.string().trim().min(20).max(5000),

  eventType: z.string().trim().min(2).max(60),

  thumbnailUrl: z
    .url()
    .refine(
      (value) => value.startsWith("https://"),
      "Image URL must use HTTPS"
    ),

  location: z.string().trim().min(3).max(200),

  eventDate: z.iso.datetime({ offset: true }).refine( (value) => new Date(value).getTime() > Date.now(),
    
    "Event date must be in the future"
  ),
});


export type CreateEventInput = z.infer<
  typeof createEventSchema
>;
