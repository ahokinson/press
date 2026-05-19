import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { writeAtomic, writeAtomicWithMkdir } from "@io/atomic.ts"

let workdir: string

beforeEach(async () => {
  workdir = await fs.mkdtemp(path.join(tmpdir(), "press-atomic-"))
})

afterEach(async () => {
  await fs.rm(workdir, { recursive: true, force: true })
})

describe("writeAtomic", () => {
  test("creates the target file with the given contents", async () => {
    const target = path.join(workdir, "out.txt")
    await writeAtomic(target, "hello")
    expect(await fs.readFile(target, "utf8")).toBe("hello")
  })

  test("replaces an existing file in place", async () => {
    const target = path.join(workdir, "out.txt")
    await fs.writeFile(target, "old")
    await writeAtomic(target, "new")
    expect(await fs.readFile(target, "utf8")).toBe("new")
  })

  test("leaves no .tmp residue on success", async () => {
    const target = path.join(workdir, "out.txt")
    await writeAtomic(target, "x")
    const files = await fs.readdir(workdir)
    expect(files).toEqual(["out.txt"])
  })

  test("supports Uint8Array payloads", async () => {
    const target = path.join(workdir, "binary.bin")
    await writeAtomic(target, new Uint8Array([1, 2, 3]))
    const read = await fs.readFile(target)
    expect(Array.from(read)).toEqual([1, 2, 3])
  })

  test("cleans up the tmp file when rename fails", async () => {
    // Rename onto an existing directory fails with EISDIR — writeFile succeeds
    // first, exercising the catch-and-unlink path.
    const target = path.join(workdir, "collides")
    await fs.mkdir(target)
    await expect(writeAtomic(target, "x")).rejects.toThrow()
    const entries = await fs.readdir(workdir)
    expect(entries).toEqual(["collides"])
  })
})

describe("writeAtomicWithMkdir", () => {
  test("creates missing parent directories", async () => {
    const target = path.join(workdir, "a", "b", "c", "out.txt")
    await writeAtomicWithMkdir(target, "deep")
    expect(await fs.readFile(target, "utf8")).toBe("deep")
  })

  test("is idempotent when directories already exist", async () => {
    const target = path.join(workdir, "exists", "out.txt")
    await fs.mkdir(path.join(workdir, "exists"))
    await writeAtomicWithMkdir(target, "v1")
    await writeAtomicWithMkdir(target, "v2")
    expect(await fs.readFile(target, "utf8")).toBe("v2")
  })
})
