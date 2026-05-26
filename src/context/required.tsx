import { createContext, type JSX, type ParentProps, splitProps, useContext } from "solid-js"

export interface RequiredContext<T, Props extends Record<string, unknown>> {
  Provider: (props: ParentProps<Props>) => JSX.Element
  use: () => T
}

// eslint-disable-next-line @typescript-eslint/ban-types -- {} is the right default: ParentProps<{}> allows children.
export function createRequiredContext<T, Props extends Record<string, unknown> = Record<string, unknown>>(input: {
  name: string
  init: (props: Props) => T
}): RequiredContext<T, Props> {
  const context = createContext<T>()

  return {
    Provider: (props: ParentProps<Props>) => {
      const [local, rest] = splitProps(props, ["children"])
      const value = input.init(rest as Props)
      return <context.Provider value={value}>{local.children}</context.Provider>
    },
    use(): T {
      const value = useContext(context)
      if (!value) throw new Error(`${input.name} context must be used within its Provider`)
      return value
    },
  }
}
