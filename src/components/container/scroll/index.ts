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
      // Keep the scrollbar gutter permanently reserved (thumb hidden when it all fits). Otherwise
      // the vertical scrollbar only appears once the content overflows, which (a) reflows the body a
      // column narrower the moment a list crosses the viewport height and (b) leaves any fixed header
      // rendered outside the scrollbox one column wider than the scrolled rows. A constant gutter
      // keeps a header (e.g. a table's) aligned with the rows below it at every list length.
      visible: true,
      showArrows: false,
      trackOptions: {
        backgroundColor: theme.backgroundElevated,
        foregroundColor: theme.textFaint,
      },
    },
    scrollAcceleration: new MacOSScrollAccel(),
  } as const
}
