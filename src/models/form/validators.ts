import { matches, maxLength, minLength, nonEmpty, numeric } from "@models/form/validation.ts"

/**
 * Stock `ValidationRule` factories. Compose with `createValidator(rules)` to
 * bundle them per field.
 *
 *   createFieldState({
 *     initial: "",
 *     validate: createValidator([Validators.nonEmpty(), Validators.maxLength(80)]),
 *   })
 */
export const Validators = {
  /** Require a regex match. */
  matches,
  /** Reject strings longer than `n` characters. */
  maxLength,
  /** Reject strings shorter than `n` characters. */
  minLength,
  /** Reject empty / whitespace-only strings. */
  nonEmpty,
  /** Validate a string as a number with optional min/max bounds. */
  numeric,
} as const
