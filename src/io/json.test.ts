import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { LoadFailureReason, loadJson, saveJson } from "@io/json.ts"
import { z } from "zod"

const Schema = z.object({ name: z.string(), count: z.number() })

let workdir: string

beforeEach(async () => {
  workdir = await fs.mkdtemp(path.join(tmpdir(), "press-iojson-"))
})

afterEach(async () => {
  await fs.rm(workdir, { recursive: true, force: true })
})

describe("loadJson", () => {
  test("returns ok with the parsed value when the file is valid", async () => {
    const target = path.join(workdir, "data.json")
    await fs.writeFile(target, JSON.stringify({ name: "press", count: 3 }))
    const result = await loadJson(target, Schema)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ name: "press", count: 3 })
    }
  })

  test("reports Missing for a non-existent file", async () => {
    const result = await loadJson(path.join(workdir, "nope.json"), Schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(LoadFailureReason.Missing)
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  test("reports Parse for malformed JSON", async () => {
    const target = path.join(workdir, "broken.json")
    await fs.writeFile(target, "{ not json")
    const result = await loadJson(target, Schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(LoadFailureReason.Parse)
    }
  })

  test("reports Invalid with ZodIssues for a schema mismatch", async () => {
    const target = path.join(workdir, "bad.json")
    await fs.writeFile(target, JSON.stringify({ name: "press", count: "three" }))
    const result = await loadJson(target, Schema)
    expect(result.ok).toBe(false)
    if (!result.ok && result.reason === LoadFailureReason.Invalid) {
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]?.path).toEqual(["count"])
    } else {
      throw new Error("expected Invalid result")
    }
  })

  test("reports Io for a permission/read failure (directory passed as file)", async () => {
    const result = await loadJson(workdir, Schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(LoadFailureReason.Io)
    }
  })
})

describe("saveJson", () => {
  test("round-trips through loadJson", async () => {
    const target = path.join(workdir, "nested", "config.json")
    await saveJson(target, { name: "press", count: 7 })
    const result = await loadJson(target, Schema)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual({ name: "press", count: 7 })
  })

  test("formats JSON with two-space indent and trailing newline", async () => {
    const target = path.join(workdir, "out.json")
    await saveJson(target, { a: 1, b: [2, 3] })
    const raw = await fs.readFile(target, "utf8")
    expect(raw).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}\n')
  })
})
