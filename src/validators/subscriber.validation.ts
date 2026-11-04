
import { z } from "zod";

/**
 * Validate newsletter email addresses.
 * Normalize email before storing it.
 */
export const subscribeValidation = z.object({
  email: z.email().trim().toLowerCase().max(254),
}).strict();

/**
 * Validate a secure unsubscribe token.
 */
export const unsubscribeValidation = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
