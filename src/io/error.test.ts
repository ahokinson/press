import { describe, expect, test } from "bun:test"
import { formatError } from "@io/error.ts"

describe("formatError", () => {
  test("stringifies non-Error values", () => {
    expect(formatError("oops")).toBe("oops")
    expect(formatError(42)).toBe("42")
    expect(formatError(null)).toBe("null")
    expect(formatError(undefined)).toBe("undefined")
  })

  test("returns the message of a bare Error", () => {
    expect(formatError(new Error("boom"))).toBe("boom")
  })

  test("walks the Error.cause chain", () => {
    const inner = new Error("disk full")
    const middle = new Error("write failed", { cause: inner })
    const outer = new Error("save failed", { cause: middle })
    expect(formatError(outer)).toBe("save failed caused by: write failed caused by: disk full")
  })

  test("stops walking when cause is not an Error", () => {
    const e = new Error("top", { cause: "plain string" })
    expect(formatError(e)).toBe("top")
  })
})
