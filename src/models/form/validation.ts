import { type Accessor, createMemo, createSignal } from "solid-js"

/**
 * Validator returns `null` on success, an error message on failure. Chain
 * via `createValidator` (first failure wins).
 */
export type ValidationRule<T> = (value: T) => string | null

/**
 * Compose rules into a single validator. Returns the first non-null message,
 * or null when every rule passes.
 */
export function createValidator<T>(rules: ReadonlyArray<ValidationRule<T>>): ValidationRule<T> {
  return (value) => {
    for (const rule of rules) {
      const result = rule(value)
      if (result !== null) return result
    }
    return null
  }
}

/* ---- stock rules ---- */

/** Reject empty / whitespace-only strings. */
export function nonEmpty(message = "required"): ValidationRule<string> {
  return (value) => (value.trim().length === 0 ? message : null)
}

/** Require a regex match. */
export function matches(pattern: RegExp, message: string): ValidationRule<string> {
  return (value) => (pattern.test(value) ? null : message)
}

/** Reject strings longer than `n` characters. */
export function maxLength(n: number, message?: string): ValidationRule<string> {
  return (value) => (value.length > n ? (message ?? `must be at most ${n} characters`) : null)
}

/** Reject strings shorter than `n` characters. */
export function minLength(n: number, message?: string): ValidationRule<string> {
  return (value) => (value.length < n ? (message ?? `must be at least ${n} characters`) : null)
}

export interface NumericRuleOptions {
  min?: number
  max?: number
  /** When true, an empty/whitespace-only string passes without error. */
  allowBlank?: boolean
}

/**
 * Validate a string as a number with optional min/max bounds. Rejects NaN,
 * ±Infinity, and blanks by default. Set `allowBlank` to make the field
 * optional while still validating non-empty input.
 */
export function numeric(options: NumericRuleOptions = {}, message?: string): ValidationRule<string> {
  const fallback = message ?? "must be a valid number"
  return (value) => {
    const trimmed = value.trim()
    if (trimmed === "") {
      return options.allowBlank ? null : fallback
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return fallback
    if (options.min !== undefined && parsed < options.min) return fallback
    if (options.max !== undefined && parsed > options.max) return fallback
    return null
  }
}

/* ---- per-field reactive bundle ---- */

export interface FieldStateOptions<T> {
  initial: T
  validate?: ValidationRule<T>
}

export interface FieldState<T> {
  value: Accessor<T>
  set: (next: T) => void
  /** Current error, or null when valid. Always derived from `value`. */
  error: Accessor<string | null>
  touched: Accessor<boolean>
  /** Mark the field as touched. For deferring error display until blur. */
  markTouched: () => void
  /** Convenience: `error() === null`. */
  valid: Accessor<boolean>
  /** Restore the initial value and clear `touched`. */
  reset: () => void
}

/**
 * Reactive bundle for a single form field: value, derived error, touched
 * flag. Hook a validator at construction. The error memo recomputes on every
 * value change.
 */
export function createFieldState<T>(opts: FieldStateOptions<T>): FieldState<T> {
  const [value, setValue] = createSignal<T>(opts.initial)
  const [touched, setTouched] = createSignal(false)

  const error = createMemo<string | null>(() => {
    if (!opts.validate) return null
    return opts.validate(value())
  })

  const valid = createMemo(() => error() === null)

  return {
    value,
    set: (next) => setValue(() => next),
    error,
    touched,
    markTouched: () => setTouched(true),
    valid,
    reset: () => {
      setValue(() => opts.initial)
      setTouched(false)
    },
  }
}
