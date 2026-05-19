import { defaultTheme, type Theme } from "@theme/palette.ts"
import { createContext, type JSX, type ParentProps, useContext } from "solid-js"

const ThemeContext = createContext<Theme>(defaultTheme)

export function ThemeProvider<T extends Theme = Theme>(props: ParentProps<{ value?: T }>): JSX.Element {
  return <ThemeContext.Provider value={props.value ?? defaultTheme}>{props.children}</ThemeContext.Provider>
}

/**
 * Read the active theme. Returns the base `Theme` shape — there is no runtime
 * link between provider and hook, so the type system cannot verify whether a
 * caller-extended theme was actually supplied upstream. Callers that pass an
 * extended theme to `ThemeProvider` should cast at the call site:
 *
 *   const theme = useTheme() as MyTheme
 *
 * The cast is explicit, visible in review, and the consumer-side risk is
 * acknowledged rather than hidden inside a misleading generic.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}
