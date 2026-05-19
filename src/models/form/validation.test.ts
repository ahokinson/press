import { describe, expect, test } from "bun:test"
import {
  createFieldState,
  createValidator,
  matches,
  maxLength,
  minLength,
  nonEmpty,
  numeric,
} from "@models/form/validation.ts"
import { createRoot } from "solid-js"

describe("createValidator", () => {
  test("returns null when all rules pass", () => {
    const v = createValidator<string>([nonEmpty(), maxLength(10)])
    expect(v("hi")).toBeNull()
  })

  test("returns the first failing rule's message", () => {
    const v = createValidator<string>([nonEmpty("blank!"), maxLength(2, "long!")])
    expect(v("")).toBe("blank!")
    expect(v("abc")).toBe("long!")
  })

  test("empty rule array always passes", () => {
    const v = createValidator<string>([])
    expect(v("anything")).toBeNull()
  })
})

describe("nonEmpty", () => {
  test("rejects empty string", () => {
    expect(nonEmpty()("")).toBe("required")
  })
  test("rejects whitespace-only string", () => {
    expect(nonEmpty()("   \t  ")).toBe("required")
  })
  test("accepts non-empty string", () => {
    expect(nonEmpty()("x")).toBeNull()
  })
  test("uses custom message", () => {
    expect(nonEmpty("nope")("")).toBe("nope")
  })
})

describe("matches", () => {
  test("returns null on match", () => {
    expect(matches(/^\d+$/, "digits only")("123")).toBeNull()
  })
  test("returns message on miss", () => {
    expect(matches(/^\d+$/, "digits only")("abc")).toBe("digits only")
  })
})

describe("maxLength", () => {
  test("accepts at the boundary", () => {
    expect(maxLength(3)("abc")).toBeNull()
  })
  test("rejects above boundary with default message", () => {
    expect(maxLength(3)("abcd")).toBe("must be at most 3 characters")
  })
  test("rejects above boundary with custom message", () => {
    expect(maxLength(3, "too long!")("abcd")).toBe("too long!")
  })
})

describe("minLength", () => {
  test("accepts at the boundary", () => {
    expect(minLength(3)("abc")).toBeNull()
  })
  test("rejects below boundary with default message", () => {
    expect(minLength(3)("ab")).toBe("must be at least 3 characters")
  })
  test("rejects below boundary with custom message", () => {
    expect(minLength(3, "too short!")("a")).toBe("too short!")
  })
})

describe("numeric", () => {
  test("accepts integers and decimals", () => {
    expect(numeric()("42")).toBeNull()
    expect(numeric()("3.14")).toBeNull()
    expect(numeric()("-5")).toBeNull()
  })
  test("rejects NaN-producing input", () => {
    expect(numeric()("abc")).toBe("must be a valid number")
  })
  test("rejects Infinity", () => {
    expect(numeric()("Infinity")).toBe("must be a valid number")
    expect(numeric()("-Infinity")).toBe("must be a valid number")
  })
  test("rejects blank by default", () => {
    expect(numeric()("")).toBe("must be a valid number")
    expect(numeric()("   ")).toBe("must be a valid number")
  })
  test("accepts blank when allowBlank", () => {
    expect(numeric({ allowBlank: true })("")).toBeNull()
    expect(numeric({ allowBlank: true })("  ")).toBeNull()
  })
  test("enforces min", () => {
    expect(numeric({ min: 0 })("-1")).toBe("must be a valid number")
    expect(numeric({ min: 0 })("0")).toBeNull()
  })
  test("enforces max", () => {
    expect(numeric({ max: 10 })("11")).toBe("must be a valid number")
    expect(numeric({ max: 10 })("10")).toBeNull()
  })
  test("uses custom message", () => {
    expect(numeric({ min: 1 }, "positive only")("0")).toBe("positive only")
  })
})

describe("createFieldState", () => {
  test("initial value is exposed and error is null without a validator", () => {
    createRoot(() => {
      const f = createFieldState({ initial: "hello" })
      expect(f.value()).toBe("hello")
      expect(f.error()).toBeNull()
      expect(f.valid()).toBe(true)
      expect(f.touched()).toBe(false)
    })
  })

  test("error derives reactively from value via validate", () => {
    createRoot(() => {
      const f = createFieldState<string>({
        initial: "",
        validate: nonEmpty("required!"),
      })
      expect(f.error()).toBe("required!")
      expect(f.valid()).toBe(false)
      f.set("ok")
      expect(f.error()).toBeNull()
      expect(f.valid()).toBe(true)
    })
  })

  test("markTouched flips touched", () => {
    createRoot(() => {
      const f = createFieldState({ initial: "" })
      expect(f.touched()).toBe(false)
      f.markTouched()
      expect(f.touched()).toBe(true)
    })
  })

  test("reset restores initial value and clears touched", () => {
    createRoot(() => {
      const f = createFieldState<string>({
        initial: "seed",
        validate: nonEmpty(),
      })
      f.set("changed")
      f.markTouched()
      expect(f.value()).toBe("changed")
      expect(f.touched()).toBe(true)
      f.reset()
      expect(f.value()).toBe("seed")
      expect(f.touched()).toBe(false)
      expect(f.error()).toBeNull()
    })
  })
})
