import { spawn } from "node:child_process"

/**
 * How `copy()` reaches the system clipboard. `Auto` tries OSC 52 first when
 * stdout is a TTY (works over SSH), then falls back to the platform's native
 * command. `Osc52` and `Native` force one path or the other.
 */
export enum ClipboardMethod {
  Auto = "auto",
  Osc52 = "osc52",
  Native = "native",
}

/** Why `copy()` reported failure. The discriminant for the recovery path. */
export enum CopyFailureReason {
  TooLarge = "too-large",
  Unsupported = "unsupported",
  Spawn = "spawn",
  Process = "process",
}

export type CopyResult =
  | { ok: true; method: ClipboardMethod.Osc52 | ClipboardMethod.Native }
  | { ok: false; reason: CopyFailureReason; error: string }

/** A single native clipboard command + the args it needs to read stdin. */
export interface NativeCommand {
  command: string
  args: readonly string[]
}

export interface CopyOptions {
  /** Strategy to use. Defaults to `ClipboardMethod.Auto`. */
  method?: ClipboardMethod
  /** Max UTF-8 byte length. Defaults to 100_000 (typical OSC 52 cap). */
  maxBytes?: number
  /** Stream the OSC 52 escape is written to. Defaults to `process.stdout`. */
  stream?: NodeJS.WritableStream
  /** Platform identifier used to pick the native command. Defaults to `process.platform`. */
  platform?: NodeJS.Platform
  /** Override the native command list (mainly for tests). */
  nativeCommands?: readonly NativeCommand[]
  /** Override the spawn implementation (mainly for tests). */
  spawnImpl?: SpawnImpl
}

/** Subprocess spawner shape. Matches the slice of `node:child_process` `spawn` that `copy()` uses. */
export type SpawnImpl = (command: string, args: readonly string[]) => SpawnHandle

export interface SpawnHandle {
  stdin: NodeJS.WritableStream | null
  on(event: "error", listener: (err: Error) => void): SpawnHandle
  on(event: "exit", listener: (code: number | null) => void): SpawnHandle
}

const DEFAULT_MAX_BYTES = 100_000

/**
 * Copy `text` to the system clipboard. Resolves to a discriminated result so
 * callers can branch on failure without `try/catch`.
 *
 * `ClipboardMethod.Auto` (default) writes an OSC 52 escape when stdout is a
 * TTY, otherwise runs the platform's native command. Linux walks wl-copy,
 * xclip, xsel and picks the first that exits 0. macOS uses pbcopy. Windows
 * uses clip.
 */
export async function copy(text: string, options: CopyOptions = {}): Promise<CopyResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const byteLength = Buffer.byteLength(text, "utf8")
  if (byteLength > maxBytes) {
    return {
      ok: false,
      reason: CopyFailureReason.TooLarge,
      error: `text is ${byteLength} bytes, exceeds limit of ${maxBytes}`,
    }
  }

  const method = options.method ?? ClipboardMethod.Auto
  const stream = options.stream ?? process.stdout

  if (method === ClipboardMethod.Osc52) {
    return copyOsc52(text, stream)
  }
  if (method === ClipboardMethod.Native) {
    return copyNative(text, options)
  }

  if (isTty(stream)) {
    const result = copyOsc52(text, stream)
    if (result.ok) return result
  }
  return copyNative(text, options)
}

/** Encode `text` as the OSC 52 set-clipboard escape sequence (target: clipboard). */
export function osc52Sequence(text: string): string {
  const payload = Buffer.from(text, "utf8").toString("base64")
  return `\x1b]52;c;${payload}\x07`
}

function copyOsc52(text: string, stream: NodeJS.WritableStream): CopyResult {
  try {
    stream.write(osc52Sequence(text))
    return { ok: true, method: ClipboardMethod.Osc52 }
  } catch (err) {
    return {
      ok: false,
      reason: CopyFailureReason.Spawn,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Default native commands for `platform`, ordered most-preferred first. Linux
 * and BSDs return wl-copy, xclip, xsel. macOS returns pbcopy. Windows returns
 * clip. Other platforms return an empty list.
 */
export function defaultNativeCommands(platform: NodeJS.Platform): readonly NativeCommand[] {
  if (platform === "darwin") return [{ command: "pbcopy", args: [] }]
  if (platform === "win32") return [{ command: "clip", args: [] }]
  if (platform === "linux" || platform === "freebsd" || platform === "openbsd") {
    return [
      { command: "wl-copy", args: [] },
      { command: "xclip", args: ["-selection", "clipboard"] },
      { command: "xsel", args: ["--clipboard", "--input"] },
    ]
  }
  return []
}

function copyNative(text: string, options: CopyOptions): Promise<CopyResult> {
  const platform = options.platform ?? process.platform
  const candidates = options.nativeCommands ?? defaultNativeCommands(platform)
  if (candidates.length === 0) {
    return Promise.resolve({
      ok: false,
      reason: CopyFailureReason.Unsupported,
      error: `no native clipboard command known for platform "${platform}"`,
    })
  }
  return tryNativeCommands(text, candidates, options.spawnImpl ?? defaultSpawn)
}

async function tryNativeCommands(
  text: string,
  candidates: readonly NativeCommand[],
  spawnImpl: SpawnImpl,
): Promise<CopyResult> {
  let lastError = ""
  for (const candidate of candidates) {
    const result = await runOne(text, candidate, spawnImpl)
    if (result.ok) return result
    lastError = result.error
    if (result.reason === CopyFailureReason.Process) {
      // Non-zero exit. Surface the error instead of masking it with the next candidate.
      return result
    }
  }
  return { ok: false, reason: CopyFailureReason.Spawn, error: lastError }
}

function runOne(text: string, candidate: NativeCommand, spawnImpl: SpawnImpl): Promise<CopyResult> {
  return new Promise((resolve) => {
    let settled = false
    const settle = (result: CopyResult): void => {
      if (settled) return
      settled = true
      resolve(result)
    }
    let child: SpawnHandle
    try {
      child = spawnImpl(candidate.command, candidate.args)
    } catch (err) {
      settle({
        ok: false,
        reason: CopyFailureReason.Spawn,
        error: err instanceof Error ? err.message : String(err),
      })
      return
    }
    child.on("error", (err) => {
      settle({ ok: false, reason: CopyFailureReason.Spawn, error: err.message })
    })
    child.on("exit", (code) => {
      if (code === 0) {
        settle({ ok: true, method: ClipboardMethod.Native })
      } else {
        settle({
          ok: false,
          reason: CopyFailureReason.Process,
          error: `${candidate.command} exited with code ${code ?? "null"}`,
        })
      }
    })
    if (child.stdin !== null) {
      child.stdin.end(text)
    }
  })
}

function isTty(stream: NodeJS.WritableStream): boolean {
  return "isTTY" in stream && (stream as NodeJS.WriteStream).isTTY === true
}

const defaultSpawn: SpawnImpl = (command, args) => spawn(command, [...args], { stdio: ["pipe", "ignore", "ignore"] })
