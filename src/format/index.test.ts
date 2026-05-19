import { describe, expect, test } from "bun:test"
import {
  columnWidth,
  compactNumber,
  formatClock,
  highlightSegments,
  padLeft,
  padRight,
  progressParts,
  RANGE_BAR_LEFT_CAP,
  RANGE_BAR_MARKER,
  RANGE_BAR_RIGHT_CAP,
  RANGE_BAR_TRACK,
  rangeBar,
  relativeAge,
  relativeAgeMs,
  shortProject,
  truncateEnd,
} from "@format"

describe("relativeAgeMs", () => {
  test("seconds under a minute", () => {
    expect(relativeAgeMs(0)).toBe("0s")
    expect(relativeAgeMs(999)).toBe("0s")
    expect(relativeAgeMs(45_000)).toBe("45s")
    expect(relativeAgeMs(59_999)).toBe("59s")
  })

  test("minutes under an hour", () => {
    expect(relativeAgeMs(60_000)).toBe("1m")
    expect(relativeAgeMs(180_000)).toBe("3m")
    expect(relativeAgeMs(59 * 60_000)).toBe("59m")
  })

  test("hours under two days", () => {
    expect(relativeAgeMs(60 * 60_000)).toBe("1h")
    expect(relativeAgeMs(47 * 60 * 60_000)).toBe("47h")
  })

  test("days at or beyond 48 hours", () => {
    expect(relativeAgeMs(48 * 60 * 60_000)).toBe("2d")
    expect(relativeAgeMs(5 * 24 * 60 * 60_000)).toBe("5d")
  })

  test("negative clamps to 0s", () => {
    expect(relativeAgeMs(-5000)).toBe("0s")
  })

  test("NaN/Infinity returns fallback", () => {
    expect(relativeAgeMs(Number.NaN)).toBe("-")
    expect(relativeAgeMs(Number.POSITIVE_INFINITY, "n/a")).toBe("n/a")
  })
})

describe("relativeAge (ISO)", () => {
  test("preserves prior minute/hour/day grain for ISO inputs", () => {
    const now = Date.parse("2026-01-01T12:00:00Z")
    expect(relativeAge("2026-01-01T11:48:00Z", now)).toBe("12m")
    expect(relativeAge("2026-01-01T09:00:00Z", now)).toBe("3h")
    expect(relativeAge("2025-12-27T12:00:00Z", now)).toBe("5d")
  })

  test("invalid input returns fallback", () => {
    expect(relativeAge("not-a-date")).toBe("-")
  })
})

describe("formatClock", () => {
  test("zero-pads each segment", () => {
    const ts = new Date(2026, 0, 1, 3, 4, 5).getTime()
    expect(formatClock(ts)).toBe("03:04:05")
  })

  test("end-of-day", () => {
    const ts = new Date(2026, 0, 1, 23, 59, 59).getTime()
    expect(formatClock(ts)).toBe("23:59:59")
  })

  test("midnight", () => {
    const ts = new Date(2026, 0, 1, 0, 0, 0).getTime()
    expect(formatClock(ts)).toBe("00:00:00")
  })
})

describe("columnWidth", () => {
  test("ASCII counts one column per char", () => {
    expect(columnWidth("")).toBe(0)
    expect(columnWidth("hello")).toBe(5)
  })

  test("CJK and fullwidth count two columns", () => {
    expect(columnWidth("漢字")).toBe(4)
    expect(columnWidth("Ａ")).toBe(2)
  })

  test("control characters count zero", () => {
    expect(columnWidth("\x01\x02")).toBe(0)
  })

  test("emoji count two columns", () => {
    expect(columnWidth("🙂")).toBe(2)
  })
})

describe("truncateEnd", () => {
  test("returns input when it already fits", () => {
    expect(truncateEnd("abc", 10)).toBe("abc")
  })

  test("appends ellipsis when overflowing", () => {
    expect(truncateEnd("abcdef", 4)).toBe("abc…")
  })

  test("width 0 returns empty", () => {
    expect(truncateEnd("abc", 0)).toBe("")
  })

  test("width 1 returns just the ellipsis", () => {
    expect(truncateEnd("abc", 1)).toBe("…")
  })

  test("respects wide glyphs in budget", () => {
    expect(truncateEnd("漢字漢字", 5)).toBe("漢字…")
  })
})

describe("shortProject", () => {
  test("returns the basename", () => {
    expect(shortProject("org/repo", 10)).toBe("repo")
  })

  test("truncates the basename to width", () => {
    expect(shortProject("org/very-long-name", 6)).toBe("very-…")
  })

  test("falls back to the full path when there is no slash", () => {
    expect(shortProject("solo", 10)).toBe("solo")
  })
})

describe("rangeBar", () => {
  test("renders caps and marker in expected positions", () => {
    const bar = rangeBar(0, 0, 10, 5)
    expect(bar.length).toBe(5)
    expect(bar.startsWith(RANGE_BAR_MARKER)).toBe(true)
    expect(bar.endsWith(RANGE_BAR_RIGHT_CAP)).toBe(true)
  })

  test("marker lands at the right cap when current >= high", () => {
    const bar = rangeBar(10, 0, 10, 5)
    expect(bar.startsWith(RANGE_BAR_LEFT_CAP)).toBe(true)
    expect(bar.endsWith(RANGE_BAR_MARKER)).toBe(true)
  })

  test("middle value places marker between the caps", () => {
    const bar = rangeBar(5, 0, 10, 5)
    expect(bar[0]).toBe(RANGE_BAR_LEFT_CAP)
    expect(bar[bar.length - 1]).toBe(RANGE_BAR_RIGHT_CAP)
    expect(bar).toContain(RANGE_BAR_MARKER)
  })

  test("flat track when high === low", () => {
    expect(rangeBar(5, 5, 5, 4)).toBe(RANGE_BAR_TRACK.repeat(4))
  })

  test("width 0 returns empty", () => {
    expect(rangeBar(1, 0, 10, 0)).toBe("")
  })

  test("clamps out-of-range inputs", () => {
    expect(rangeBar(-99, 0, 10, 3).startsWith(RANGE_BAR_MARKER)).toBe(true)
    expect(rangeBar(99, 0, 10, 3).endsWith(RANGE_BAR_MARKER)).toBe(true)
  })
})

describe("compactNumber", () => {
  test("passes through sub-thousand values", () => {
    expect(compactNumber(0)).toBe("0")
    expect(compactNumber(42)).toBe("42")
    expect(compactNumber(999)).toBe("999")
  })

  test("thousands → K", () => {
    expect(compactNumber(1_000)).toBe("1.0K")
    expect(compactNumber(12_500)).toBe("12.5K")
  })

  test("millions → M", () => {
    expect(compactNumber(1_500_000)).toBe("1.5M")
  })

  test("billions → B", () => {
    expect(compactNumber(2_300_000_000)).toBe("2.3B")
  })
})

describe("padRight / padLeft", () => {
  test("pads to the target column width", () => {
    expect(padRight("hi", 5)).toBe("hi   ")
    expect(padLeft("hi", 5)).toBe("   hi")
  })

  test("returns unchanged when already at width", () => {
    expect(padRight("abc", 3)).toBe("abc")
    expect(padLeft("abc", 3)).toBe("abc")
  })

  test("clips when over width", () => {
    expect(padRight("abcdef", 3)).toBe("abc")
    expect(padLeft("abcdef", 3)).toBe("abc")
  })

  test("respects wide glyphs for both width and clipping", () => {
    expect(padRight("漢", 4)).toBe("漢  ")
    expect(padLeft("漢", 4)).toBe("  漢")
    expect(padRight("漢字", 2)).toBe("漢")
  })
})

describe("highlightSegments", () => {
  test("empty query yields one non-match segment", () => {
    expect(highlightSegments("hello", "")).toEqual([{ text: "hello", match: false }])
  })

  test("splits around a single match (case-insensitive default)", () => {
    expect(highlightSegments("Hello World", "world")).toEqual([
      { text: "Hello ", match: false },
      { text: "World", match: true },
    ])
  })

  test("captures multiple matches", () => {
    expect(highlightSegments("aXbXc", "x")).toEqual([
      { text: "a", match: false },
      { text: "X", match: true },
      { text: "b", match: false },
      { text: "X", match: true },
      { text: "c", match: false },
    ])
  })

  test("caseSensitive=true distinguishes case", () => {
    expect(highlightSegments("Aa", "a", true)).toEqual([
      { text: "A", match: false },
      { text: "a", match: true },
    ])
  })

  test("no match → single non-match segment", () => {
    expect(highlightSegments("abc", "z")).toEqual([{ text: "abc", match: false }])
  })
})

describe("progressParts", () => {
  test("splits filled/unfilled at the value/max ratio", () => {
    expect(progressParts(5, 10, 10)).toEqual({ filled: "█████", unfilled: "░░░░░" })
  })

  test("clamps ratio above max to fully filled", () => {
    expect(progressParts(20, 10, 4)).toEqual({ filled: "████", unfilled: "" })
  })

  test("clamps negative value to empty", () => {
    expect(progressParts(-5, 10, 4)).toEqual({ filled: "", unfilled: "░░░░" })
  })

  test("treats max <= 0 as indeterminate-complete (fully filled)", () => {
    expect(progressParts(0, 0, 3)).toEqual({ filled: "███", unfilled: "" })
    expect(progressParts(0, -1, 3)).toEqual({ filled: "███", unfilled: "" })
  })

  test("custom characters are respected", () => {
    expect(progressParts(1, 2, 4, "X", "-")).toEqual({ filled: "XX", unfilled: "--" })
  })

  test("width floors to at least 1 column", () => {
    expect(progressParts(0, 10, 0)).toEqual({ filled: "", unfilled: "░" })
    expect(progressParts(5, 10, 0)).toEqual({ filled: "█", unfilled: "" })
  })
})
