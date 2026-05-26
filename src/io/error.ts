/**
 * Render an unknown thrown value as one human-readable line. Walks the
 * `Error.cause` chain (Node 16.9+).
 */
export function formatError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const parts = [err.message]
  let cause: unknown = err.cause
  while (cause instanceof Error) {
    parts.push(`caused by: ${cause.message}`)
    cause = cause.cause
  }
  return parts.join(" ")
}
