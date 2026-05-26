/**
 * OSC 8 hyperlink support detection and escape-sequence construction.
 *
 * OSC 8 is the `ESC ] 8 ; <params> ; <url> ESC \\ <label> ESC ] 8 ; ; ESC \\`
 * sequence that modern terminals turn into clickable links. Once a renderer
 * has handshaken, opentui's `TerminalCapabilities.hyperlinks` is the source
 * of truth. The env-based detection here is the fallback for code that runs
 * before any renderer exists.
 */

/** Opening half of the OSC 8 sequence (caller appends `<url> ESC \\`). */
export const OSC8_OPEN = "\x1b]8;;"
/** ST (string terminator) used to close OSC 8 parameter blocks. */
export const OSC8_ST = "\x1b\\"
/** Closing OSC 8 (resets the active link). */
export const OSC8_CLOSE = `${OSC8_OPEN}${OSC8_ST}`

/**
 * Wrap `label` in OSC 8 escapes so a supporting terminal renders it as a
 * clickable hyperlink pointing at `href`. The returned string is the full
 * open + label + close sequence and can be written to stdout directly.
 *
 * Do not embed this in opentui span text. opentui doesn't emit OSC 8 itself
 * and counts the escape bytes as columns. Write it directly to stdout or
 * inside a `createTerminalHandover` block.
 */
export function wrapOsc8(href: string, label: string): string {
  return `${OSC8_OPEN}${href}${OSC8_ST}${label}${OSC8_CLOSE}`
}

/**
 * Best-effort detection of OSC 8 support from environment variables. Returns
 * true for known-good terminals (iTerm2, WezTerm, Kitty, Alacritty, modern
 * Windows Terminal, VS Code, Ghostty, Hyper).
 *
 * Prefer opentui's `TerminalCapabilities.hyperlinks` when a renderer is
 * available. It queries the terminal directly.
 */
export function supportsOsc8(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NO_HYPERLINKS !== undefined || env.FORCE_HYPERLINKS === "0") return false
  if (env.FORCE_HYPERLINKS !== undefined && env.FORCE_HYPERLINKS !== "0") return true

  const termProgram = env.TERM_PROGRAM
  if (termProgram === "iTerm.app") return true
  if (termProgram === "WezTerm") return true
  if (termProgram === "ghostty") return true
  if (termProgram === "vscode") return true
  if (termProgram === "Hyper") return true

  if (env.WT_SESSION !== undefined) return true
  if (env.KITTY_WINDOW_ID !== undefined) return true
  if (env.ALACRITTY_LOG !== undefined || env.ALACRITTY_WINDOW_ID !== undefined) return true
  if (env.DOMTERM !== undefined) return true

  return false
}
