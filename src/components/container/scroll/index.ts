import { MacOSScrollAccel } from "@opentui/core"
import type { Theme } from "@theme/palette.ts"

/**
 * Theme-aware option bag for opentui's `<scrollbox>`. Disables arrow widgets,
 * tints the track to match the theme, and uses the MacOS scroll-momentum
 * curve.
 */
export function createScrollboxOptions(theme: Theme) {
  return {
    verticalScrollbarOptions: {
      showArrows: false,
      trackOptions: {
        backgroundColor: theme.backgroundElevated,
        foregroundColor: theme.textFaint,
      },
    },
    scrollAcceleration: new MacOSScrollAccel(),
  } as const
}
