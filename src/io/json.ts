import { promises as fs } from "node:fs"
import { writeAtomicWithMkdir } from "@io/atomic.ts"
import { formatError } from "@io/error.ts"
import type { z } from "zod"

export enum LoadFailureReason {
  Missing = "missing",
  Io = "io",
  Parse = "parse",
  Invalid = "invalid",
}

/** ZodError issue array — works on both zod 3 and zod 4 ("issues" is public in both). */
export type ZodIssues = z.ZodError["issues"]

export type LoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: Exclude<LoadFailureReason, LoadFailureReason.Invalid>; error: string }
  | { ok: false; reason: LoadFailureReason.Invalid; error: string; issues: ZodIssues }

function errnoCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code
    return typeof c === "string" ? c : undefined
  }
  return undefined
}

/**
 * Read a JSON file and validate it against a Zod schema. Distinguishes the
 * four failure modes so callers can choose how to respond — e.g. treat
 * `Missing` as "first run", surface `Io` as a recoverable system error,
 * `Parse` as corruption, and `Invalid` to the user as a schema problem.
 *
 * On `Invalid`, `issues` carries the full `ZodIssue[]` so the caller can
 * render field-level validation errors. `error` keeps the human-readable
 * message for quick logging.
 */
export async function loadJson<T>(filePath: string, schema: z.ZodType<T>): Promise<LoadResult<T>> {
  let raw: string
  try {
    raw = await fs.readFile(filePath, "utf8")
  } catch (err) {
    const code = errnoCode(err)
    return {
      ok: false,
      reason: code === "ENOENT" ? LoadFailureReason.Missing : LoadFailureReason.Io,
      error: formatError(err),
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    return { ok: false, reason: LoadFailureReason.Parse, error: formatError(err) }
  }
  const result = schema.safeParse(parsed)
  if (!result.success) {
    return {
      ok: false,
      reason: LoadFailureReason.Invalid,
      error: result.error.message,
      issues: result.error.issues,
    }
  }
  return { ok: true, value: result.data }
}

/** Pretty-print JSON and atomically write it, creating parent dirs as needed. */
export async function saveJson(filePath: string, value: unknown): Promise<void> {
  await writeAtomicWithMkdir(filePath, `${JSON.stringify(value, null, 2)}\n`)
}
