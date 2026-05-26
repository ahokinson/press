import type { KeyBinding, KeyHint } from "@keyboard"

/** Default `group` label used when a `KeyBinding` has no explicit group. */
export const DEFAULT_CHEATSHEET_GROUP = "General"

export interface CheatsheetGroup {
  group: string
  entries: KeyHint[]
}

/**
 * Project a list of `KeyBinding`s into the structure the `HelpOverlay`
 * renders. Bindings without a `hint` are excluded (intentionally hidden, e.g.
 * internal Ctrl-C quit). Bindings without a `group` fall into
 * `DEFAULT_CHEATSHEET_GROUP`. Group order is first-seen. Entries inside a
 * group keep their declaration order.
 *
 * The cheatsheet derives entirely from `KeyBinding`s. Give a binding a hint
 * to make it appear in the help screen. Give it a group to cluster it.
 */
export function bindingCheatsheet(bindings: readonly KeyBinding[]): CheatsheetGroup[] {
  const groups: CheatsheetGroup[] = []
  const indexByName = new Map<string, number>()
  for (const binding of bindings) {
    if (!binding.hint) continue
    const groupName = binding.group ?? DEFAULT_CHEATSHEET_GROUP
    let index = indexByName.get(groupName)
    if (index === undefined) {
      index = groups.length
      indexByName.set(groupName, index)
      groups.push({ group: groupName, entries: [] })
    }
    groups[index]!.entries.push(binding.hint)
  }
  return groups
}
