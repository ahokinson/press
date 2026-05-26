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
  alert: icon("\u{F071}", 2),
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
  errorCircle: icon("\u{F057}", 2),
  file: icon("\u{F15B}", 2),
  folder: icon("\u{F07B}", 2),
  gear: icon("\u{F013}", 2),
  hidden: icon("\u{F070}", 2),
  info: icon("\u{F05A}", 2),
  link: icon("\u{F44E}", 2),
  lock: icon("\u{F023}", 2),
  minus: icon("\u{F068}", 2),
  play: icon("\u{F0DA}", 2),
  plus: icon("\u{F067}", 2),
  refresh: icon("\u{F021}", 2),
  save: icon("\u{F0C7}", 2),
  search: icon("\u{F002}", 2),
  selectMarker: icon("\u{25B8}", 1),
  sort: icon("\u{F0DC}", 2),
  star: icon("\u{F005}", 2),
  successCircle: icon("\u{F058}", 2),
  terminal: icon("\u{F120}", 2),
  trash: icon("\u{F1F8}", 2),
  treeBranch: icon("\u{251C}", 1),
  treeLast: icon("\u{2514}", 1),
  treePipe: icon("\u{2502}", 1),
  unlock: icon("\u{F09C}", 2),
  upload: icon("\u{F062}", 2),
  visible: icon("\u{F06E}", 2),
} as const

/** Dashed placeholder of approximate column width `n`. */
export function placeholder(n: number): string {
  return "╌".repeat(Math.ceil(n / 2))
}
