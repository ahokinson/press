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
 */
export const Icon = {
  chevronRight: icon("\u{EAB6}", 2),
  chevronDown: icon("\u{EAB4}", 2),
  chevronUp: icon("\u{EAB7}", 2),
  chevronLeft: icon("\u{EAB5}", 2),

  search: icon("\u{F002}", 2),
  alert: icon("\u{F071}", 2),
  info: icon("\u{F05A}", 2),
  check: icon("\u{F00C}", 2),
  cross: icon("\u{F00D}", 2),
  gear: icon("\u{F013}", 2),
  clock: icon("\u{F017}", 2),
  link: icon("\u{F44E}", 2),
  play: icon("\u{F0DA}", 2),
  sort: icon("\u{F0DC}", 2),
  upload: icon("\u{F062}", 2),
  download: icon("\u{F063}", 2),
  refresh: icon("\u{F021}", 2),

  selectMarker: icon("▸", 1),
  dot: icon("·", 1),
  bullet: icon("•", 1),
} as const

/** Dashed placeholder of approximate column width `n`. */
export function placeholder(n: number): string {
  return "╌".repeat(Math.ceil(n / 2))
}
