
import { z } from "zod";

import {
  createEventValidation,
} from "./create-event.validation.js";

/**
 * Update Event Validation
 *
 * PURPOSE:
 * Reuse Create Event validation rules
 * when editing an existing event.
 *
 * DIFFERENCE:
 * - Fields are optional.
 * - At least one field must be provided.
 * - Unknown fields are rejected.
 */

// All fields are optional for partial updates.
export const updateEventValidation =
  createEventValidation
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message:
          "Please provide at least one field to update.",
      }
    );

// TypeScript type for validated updates.
export type UpdateEventInput = z.infer<
  typeof updateEventValidation
>;

