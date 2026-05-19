import { createContext, type JSX, type ParentProps, splitProps, useContext } from "solid-js"

export interface SimpleContext<T, Props extends Record<string, unknown>> {
  Provider: (props: ParentProps<Props>) => JSX.Element
  use: () => T
}

// eslint-disable-next-line @typescript-eslint/ban-types -- {} is the right default: ParentProps<{}> allows children.
export function createSimpleContext<T, Props extends Record<string, unknown> = Record<string, unknown>>(input: {
  name: string
  init: (props: Props) => T
}): SimpleContext<T, Props> {
  const ctx = createContext<T>()

  return {
    Provider: (props: ParentProps<Props>) => {
      const [local, rest] = splitProps(props, ["children"])
      const value = input.init(rest as Props)
      return <ctx.Provider value={value}>{local.children}</ctx.Provider>
    },
    use(): T {
      const value = useContext(ctx)
      if (!value) throw new Error(`${input.name} context must be used within its Provider`)
      return value
    },
  }
}
