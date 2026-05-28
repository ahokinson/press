import { defaultTheme, type Theme } from "@theme/palette.ts"
import { createContext, type JSX, type ParentProps, useContext } from "solid-js"

const ThemeContext = createContext<Theme>(defaultTheme)

export function ThemeProvider<T extends Theme = Theme>(props: ParentProps<{ value?: T }>): JSX.Element {
  return <ThemeContext.Provider value={props.value ?? defaultTheme}>{props.children}</ThemeContext.Provider>
}

/**
 * Read the active theme. Returns the base `Theme`. Cast at the call site if
 * you passed an extended theme to `ThemeProvider`:
 *
 *   const theme = useTheme() as MyTheme
 *
 * There's no runtime link between provider and hook, so the type system can't
 * verify the cast.
 */
export function useTheme<T extends Theme = Theme>(): T {
  return useContext(ThemeContext) as T
}
