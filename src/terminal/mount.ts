import { type CliRenderer, type CliRendererConfig, createCliRenderer } from "@opentui/core"
import { render } from "@opentui/solid"
import type { JSX } from "solid-js"

/**
 * Mounting a TUI, with the parts that are easy to get wrong.
 *
 * `buildTUI` owns the awkward build-time bits; this is its runtime half. Three
 * things here were each learned by an app getting them wrong:
 *
 * 1. **The debug console takes the keyboard.** The renderer opens it on error
 *    and it renders *focused*, so from the first thrown error every keystroke
 *    goes to the console rather than the app. The screen keeps painting, so it
 *    reads as a hang with no clue why. `consoleMode: "disabled"` by default.
 *
 * 2. **`render` hands back nothing.** It resolves to `void`, so an app that
 *    awaits it hoping for a handle gets `undefined` and can never stop the
 *    renderer. The process then keeps stdin in raw mode on the alternate screen
 *    and never exits — the quit key looks frozen while every other key works.
 *    The renderer is constructed here so there is always a handle.
 *
 * 3. **A failed mount must not hang.** `void render(...)` swallows the
 *    rejection and leaves the caller waiting forever, which looks identical to
 *    the bug above.
 *
 * Stopping the renderer is *not* the same as ending the process: it still holds
 * handles that keep the loop alive. Callers that mean to quit should exit — see
 * `runTUI`, which returns so the caller can, and the note on it.
 */
export interface MountOptions {
  /**
   * Renderer config. Merged over the defaults, so passing `{}` still disables
   * the console; pass `consoleMode` explicitly to opt back in.
   */
  renderer?: CliRendererConfig
  /** Supply the renderer instead of creating one. For tests, or a shared one. */
  create?: () => Promise<CliRenderer>
}

const defaults: CliRendererConfig = { consoleMode: "disabled" }

async function rendererFor(options: MountOptions): Promise<CliRenderer> {
  if (options.create) return options.create()
  return createCliRenderer({ ...defaults, ...options.renderer })
}

/**
 * Mount an app and return the renderer.
 *
 * Use this when the app owns its own exit — a `q` binding that calls
 * `process.exit(0)`, say. The returned renderer is the handle for
 * `createTerminalHandover`, `stop()`, or anything else that needs one.
 */
export async function mountTUI(node: () => JSX.Element, options: MountOptions = {}): Promise<CliRenderer> {
  const renderer = await rendererFor(options)
  await render(node, renderer)
  return renderer
}

/**
 * Mount an app, wait for it to finish, and put the terminal back.
 *
 * `node` receives a `finish` callback; whatever it is called with becomes the
 * resolved value. Use this when something has to happen *after* the TUI —
 * handing the terminal to another process, printing a result, choosing an exit
 * code — which is exactly what an app that calls `process.exit` from inside a
 * key handler cannot do.
 *
 * The renderer is stopped in a `finally`, so a thrown mount also restores the
 * terminal rather than leaving the shell in raw mode with no prompt. Stopping
 * does not end the process; if the caller means to quit, it should exit once
 * this resolves.
 */
export async function runTUI<T>(
  node: (finish: (value: T) => void) => JSX.Element,
  options: MountOptions = {},
): Promise<T> {
  const renderer = await rendererFor(options)
  try {
    return await new Promise<T>((resolve, reject) => {
      // `.catch(reject)`, not `void`: a mount that throws would otherwise
      // settle nothing and hang here.
      render(() => node(resolve), renderer).catch(reject)
    })
  } finally {
    renderer.stop()
  }
}
