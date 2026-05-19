import { MacOSScrollAccel } from "@opentui/core"
import type { Theme } from "@theme/palette.ts"

/**
 * Theme-aware option bag for opentui's `<scrollbox>`. Disables arrow widgets,
 * tints the track to match the theme, and turns on the MacOS scroll-momentum
 * curve. Spread the result into the scrollbox element.
 */
export function createScrollboxOptions(theme: Theme) {
  return {
    verticalScrollbarOptions: {
      showArrows: false,
      trackOptions: {
        backgroundColor: theme.bgAlt,
        foregroundColor: theme.faint,
      },
    },
    scrollAcceleration: new MacOSScrollAccel(),
  } as const
}
