/**
 * Render an unknown thrown value as a single human-readable line. Walks the
 * `Error.cause` chain (Node 16.9+) so wrapped errors don't lose their inner
 * message.
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
