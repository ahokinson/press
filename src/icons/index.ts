export interface Icon {
  readonly char: string
  readonly columns: number
}

export function icon(char: string, columns: number): Icon {
  return { char, columns }
}

/**
 * Generic glyph registry. Most are Nerd Font codepoints (install one of the
 * patched fonts at https://www.nerdfonts.com/font-downloads). Domain glyphs
 * stay in consumer apps.
 *
 * Naming convention: noun-first, full words.
 * - Shape glyphs: noun + qualifier  (circleFilled, triangleWarning, lineHorizontal)
 * - Action glyphs: verb or noun     (copy, edit, save, search)
 */
export const Icon = {
  // ── Block / half-block ───────────────────────────────────────────────────
  blockFilled: icon("\u{2588}", 1), // █  progress filled
  blockShaded: icon("\u{2591}", 1), // ░  progress unfilled / light shade
  blockLeft: icon("\u{258C}", 1), // ▌  left half block (rail / callout gutter)

  // ── Box-drawing ──────────────────────────────────────────────────────────
  lineHorizontal: icon("\u{2500}", 1), // ─  horizontal line
  lineDashed: icon("\u{254C}", 2), // ╌  dashed horizontal (2 cols)
  lineVertical: icon("\u{2502}", 1), // │  vertical line
  cornerBottomLeft: icon("\u{2514}", 1), // └  bottom-left corner
  teeRight: icon("\u{251C}", 1), // ├  T-junction opening right
  teeLeft: icon("\u{2524}", 1), // ┤  T-junction opening left

  // ── Carets (small pointing) ──────────────────────────────────────────────
  caretRight: icon("\u{25B8}", 1), // ▸  small right-pointing triangle
  caretDown: icon("\u{25BE}", 1), // ▾  small down-pointing triangle

  // ── Triangles (large solid) ──────────────────────────────────────────────
  triangleUp: icon("\u{25B2}", 1), // ▲  solid up triangle
  triangleDown: icon("\u{25BC}", 1), // ▼  solid down triangle
  triangleWarning: icon("\u{F071}", 2), // Nerd Font warning / exclamation triangle

  // ── Circles ──────────────────────────────────────────────────────────────
  circleFilled: icon("\u{25CF}", 1), // ●  filled circle
  circleDot: icon("\u{25C9}", 1), // ◉  circle with dot (active state)
  circleEmpty: icon("\u{25CB}", 1), // ○  empty circle
  circleError: icon("\u{F057}", 2), // Nerd Font error circle (×)
  circleSuccess: icon("\u{F058}", 2), // Nerd Font success circle (✓)
  circleInfo: icon("\u{F05A}", 2), // Nerd Font info circle (ℹ)

  // ── Nerd Font (action / object) ──────────────────────────────────────────
  branch: icon("\u{F126}", 2),
  bullet: icon("\u{2022}", 1),
  check: icon("\u{F00C}", 2),
  chevronDown: icon("\u{EAB4}", 2),
  chevronLeft: icon("\u{EAB5}", 2),
  chevronRight: icon("\u{EAB6}", 2),
  chevronUp: icon("\u{EAB7}", 2),
  clock: icon("\u{F017}", 2),
  copy: icon("\u{F0C5}", 2),
  cross: icon("\u{F00D}", 2),
  dot: icon("\u{00B7}", 1),
  download: icon("\u{F063}", 2),
  edit: icon("\u{F040}", 2),
  ellipsis: icon("\u{F141}", 2),
  file: icon("\u{F15B}", 2),
  folder: icon("\u{F07B}", 2),
  gear: icon("\u{F013}", 2),
  hidden: icon("\u{F070}", 2),
  link: icon("\u{F44E}", 2),
  lock: icon("\u{F023}", 2),
  minus: icon("\u{F068}", 2),
  play: icon("\u{F0DA}", 2),
  plus: icon("\u{F067}", 2),
  refresh: icon("\u{F021}", 2),
  save: icon("\u{F0C7}", 2),
  search: icon("\u{F002}", 2),
  sort: icon("\u{F0DC}", 2),
  star: icon("\u{F005}", 2),
  terminal: icon("\u{F120}", 2),
  trash: icon("\u{F1F8}", 2),
  unlock: icon("\u{F09C}", 2),
  upload: icon("\u{F062}", 2),
  visible: icon("\u{F06E}", 2),
} as const

/** Dashed placeholder of approximate column width `n`. */
export function placeholder(n: number): string {
  return Icon.lineDashed.char.repeat(Math.ceil(n / 2))
}
