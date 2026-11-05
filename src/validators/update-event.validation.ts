
import { z } from "zod";

import {
  createEventValidation,
} from "./create-event.validation.js";
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
export type UpdateEventInput = z.infer<
  typeof updateEventValidation
>;

