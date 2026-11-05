
import { z } from "zod";
export const subscribeValidation = z.object({
  email: z.email().trim().toLowerCase().max(254),
}).strict();
export const unsubscribeValidation = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
