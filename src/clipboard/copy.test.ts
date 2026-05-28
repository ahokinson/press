import { describe, expect, test } from "bun:test"
import {
  ClipboardMethod,
  CopyFailureReason,
  copy,
  defaultNativeCommands,
  type NativeCommand,
  osc52Sequence,
  type SpawnHandle,
  type SpawnImpl,
} from "@clipboard/copy.ts"

/** A test stream that captures writes for assertions. */
function capturingStream(): NodeJS.WritableStream & { writes: string[]; isTTY: boolean } {
  const writes: string[] = []
  // biome-ignore lint/suspicious/noExplicitAny: minimal writable stream surface for tests
  const stream: any = {
    isTTY: true,
    writes,
    write(chunk: string | Buffer): boolean {
      writes.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"))
      return true
    },
  }
  return stream
}

/** Build a fake spawn that simulates a sequence of subprocess outcomes. */
interface FakeOutcome {
  /** What `stdin.end(text)` receives. Populated when run. */
  receivedStdin?: string
  /** Exit code to deliver. If `errorAfterStart` is set, exit is not delivered. */
  exitCode?: number
  /** If set, deliver this error before/instead of an exit. */
  errorAfterStart?: Error
  /** If set, throw synchronously from spawn (ENOENT-style). */
  throwOnSpawn?: Error
}

function fakeSpawn(outcomes: FakeOutcome[]): { spawnImpl: SpawnImpl; calls: string[] } {
  const calls: string[] = []
  let index = 0
  const spawnImpl: SpawnImpl = (command, args) => {
    calls.push([command, ...args].join(" "))
    const outcome = outcomes[index++]
    if (!outcome) throw new Error(`fakeSpawn out of outcomes for ${command}`)
    if (outcome.throwOnSpawn) throw outcome.throwOnSpawn
    const listeners: { error: ((err: Error) => void)[]; exit: ((code: number | null) => void)[] } = {
      error: [],
      exit: [],
    }
    const stdin = {
      end(chunk: string): void {
        outcome.receivedStdin = chunk
        queueMicrotask(() => {
          if (outcome.errorAfterStart) {
            for (const listener of listeners.error) listener(outcome.errorAfterStart)
          } else {
            for (const listener of listeners.exit) listener(outcome.exitCode ?? 0)
          }
        })
      },
    } as unknown as NodeJS.WritableStream
    const handle: SpawnHandle = {
      stdin,
      on(event, listener) {
        if (event === "error") listeners.error.push(listener as (err: Error) => void)
        if (event === "exit") listeners.exit.push(listener as (code: number | null) => void)
        return handle
      },
    }
    return handle
  }
  return { spawnImpl, calls }
}

describe("osc52Sequence", () => {
  test("encodes UTF-8 text as base64 inside the OSC 52 clipboard envelope", () => {
    const sequence = osc52Sequence("hello")
    expect(sequence).toBe("\x1b]52;c;aGVsbG8=\x07")
  })

  test("round-trips through base64", () => {
    const prefix = "\x1b]52;c;"
    const suffix = "\x07"
    const sequence = osc52Sequence("日本語")
    expect(sequence.startsWith(prefix)).toBe(true)
    expect(sequence.endsWith(suffix)).toBe(true)
    const payload = sequence.slice(prefix.length, -suffix.length)
    expect(Buffer.from(payload, "base64").toString("utf8")).toBe("日本語")
  })
})

describe("copy via OSC 52", () => {
  test("writes the OSC 52 escape to the supplied stream", async () => {
    const stream = capturingStream()
    const result = await copy("hi", { method: ClipboardMethod.Osc52, stream })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.method).toBe(ClipboardMethod.Osc52)
    expect(stream.writes.join("")).toBe(osc52Sequence("hi"))
  })

  test("returns Spawn failure when the stream write throws", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal writable stream surface for tests
    const throwingStream: any = {
      isTTY: true,
      write() {
        throw new Error("stream full")
      },
    }
    const result = await copy("hi", { method: ClipboardMethod.Osc52, stream: throwingStream })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(CopyFailureReason.Spawn)
      expect(result.error).toContain("stream full")
    }
  })

  test("Auto prefers OSC 52 when the stream is a TTY", async () => {
    const stream = capturingStream()
    const result = await copy("hi", { stream })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.method).toBe(ClipboardMethod.Osc52)
    expect(stream.writes.join("")).toBe(osc52Sequence("hi"))
  })

  test("Auto falls back to Native when the stream is not a TTY", async () => {
    const stream = capturingStream()
    stream.isTTY = false
    const { spawnImpl, calls } = fakeSpawn([{ exitCode: 0 }])
    const result = await copy("hi", {
      stream,
      platform: "darwin",
      spawnImpl,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.method).toBe(ClipboardMethod.Native)
    expect(calls).toEqual(["pbcopy"])
    expect(stream.writes).toEqual([])
  })
})

describe("copy via Native", () => {
  test("darwin uses pbcopy", async () => {
    const { spawnImpl, calls } = fakeSpawn([{ exitCode: 0 }])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "darwin", spawnImpl })
    expect(result.ok).toBe(true)
    expect(calls).toEqual(["pbcopy"])
  })

  test("win32 uses clip", async () => {
    const { spawnImpl, calls } = fakeSpawn([{ exitCode: 0 }])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "win32", spawnImpl })
    expect(result.ok).toBe(true)
    expect(calls).toEqual(["clip"])
  })

  test("linux tries wl-copy → xclip → xsel until one runs", async () => {
    const enoent = Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" })
    const { spawnImpl, calls } = fakeSpawn([{ errorAfterStart: enoent }, { errorAfterStart: enoent }, { exitCode: 0 }])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "linux", spawnImpl })
    expect(result.ok).toBe(true)
    expect(calls).toEqual(["wl-copy", "xclip -selection clipboard", "xsel --clipboard --input"])
  })

  test("synchronously thrown spawn errors do not stop the next candidate", async () => {
    const { spawnImpl, calls } = fakeSpawn([{ throwOnSpawn: new Error("ENOENT wl-copy") }, { exitCode: 0 }])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "linux", spawnImpl })
    expect(result.ok).toBe(true)
    expect(calls).toEqual(["wl-copy", "xclip -selection clipboard"])
  })

  test("non-zero exit stops the search and reports Process failure", async () => {
    const { spawnImpl, calls } = fakeSpawn([{ exitCode: 1 }])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "darwin", spawnImpl })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(CopyFailureReason.Process)
      expect(result.error).toContain("pbcopy")
    }
    expect(calls).toEqual(["pbcopy"])
  })

  test("all candidates failing to spawn surfaces Spawn failure", async () => {
    const enoent = new Error("ENOENT")
    const { spawnImpl } = fakeSpawn([
      { errorAfterStart: enoent },
      { errorAfterStart: enoent },
      { errorAfterStart: enoent },
    ])
    const result = await copy("hi", { method: ClipboardMethod.Native, platform: "linux", spawnImpl })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe(CopyFailureReason.Spawn)
  })

  test("unknown platform reports Unsupported", async () => {
    const result = await copy("hi", {
      method: ClipboardMethod.Native,
      platform: "android" as NodeJS.Platform,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe(CopyFailureReason.Unsupported)
  })

  test("custom nativeCommands override the platform defaults", async () => {
    const commands: readonly NativeCommand[] = [{ command: "my-clip", args: ["--copy"] }]
    const { spawnImpl, calls } = fakeSpawn([{ exitCode: 0 }])
    const result = await copy("hi", {
      method: ClipboardMethod.Native,
      nativeCommands: commands,
      spawnImpl,
    })
    expect(result.ok).toBe(true)
    expect(calls).toEqual(["my-clip --copy"])
  })

  test("the text is piped into the command's stdin", async () => {
    let received: string | undefined
    const spawnImpl: SpawnImpl = () => {
      const listeners: { error: ((err: Error) => void)[]; exit: ((code: number | null) => void)[] } = {
        error: [],
        exit: [],
      }
      const stdin = {
        end(chunk: string) {
          received = chunk
          queueMicrotask(() => {
            for (const listener of listeners.exit) listener(0)
          })
        },
      } as unknown as NodeJS.WritableStream
      const handle: SpawnHandle = {
        stdin,
        on(event, listener) {
          if (event === "error") listeners.error.push(listener as (err: Error) => void)
          if (event === "exit") listeners.exit.push(listener as (code: number | null) => void)
          return handle
        },
      }
      return handle
    }
    const result = await copy("payload", { method: ClipboardMethod.Native, platform: "darwin", spawnImpl })
    expect(result.ok).toBe(true)
    expect(received).toBe("payload")
  })
})

describe("size limit", () => {
  test("text exceeding maxBytes yields TooLarge without writing anything", async () => {
    const stream = capturingStream()
    const big = "x".repeat(150_000)
    const result = await copy(big, { stream })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(CopyFailureReason.TooLarge)
      expect(result.error).toContain("150000")
    }
    expect(stream.writes).toEqual([])
  })

  test("custom maxBytes caps shorter than the default", async () => {
    const stream = capturingStream()
    const result = await copy("abcdef", { stream, maxBytes: 3 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe(CopyFailureReason.TooLarge)
  })

  test("UTF-8 byte length is what's measured, not character count", async () => {
    // "日" is 3 bytes in UTF-8; two of them exceed a 5-byte cap.
    const stream = capturingStream()
    const result = await copy("日日", { stream, maxBytes: 5 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe(CopyFailureReason.TooLarge)
  })
})

describe("defaultNativeCommands", () => {
  test("darwin returns pbcopy", () => {
    expect(defaultNativeCommands("darwin")).toEqual([{ command: "pbcopy", args: [] }])
  })

  test("win32 returns clip", () => {
    expect(defaultNativeCommands("win32")).toEqual([{ command: "clip", args: [] }])
  })

  test("linux returns wl-copy then xclip then xsel", () => {
    expect(defaultNativeCommands("linux")).toEqual([
      { command: "wl-copy", args: [] },
      { command: "xclip", args: ["-selection", "clipboard"] },
      { command: "xsel", args: ["--clipboard", "--input"] },
    ])
  })

  test("unknown platforms return an empty list", () => {
    expect(defaultNativeCommands("android" as NodeJS.Platform)).toEqual([])
  })
})
