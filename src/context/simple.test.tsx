import { describe, expect, test } from "bun:test"
import { createSimpleContext } from "@context/simple.tsx"
import { testRender } from "@opentui/solid"

interface CounterApi {
  label: string
  value: number
}

const Counter = createSimpleContext<CounterApi, { start: number; label: string }>({
  name: "Counter",
  init: (props) => ({ label: props.label, value: props.start }),
})

function Consumer() {
  const api = Counter.use()
  return <text>{`${api.label}=${api.value}`}</text>
}

describe("createSimpleContext", () => {
  test("Provider exposes init() result through use()", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <Counter.Provider start={5} label="hits">
          <Consumer />
        </Counter.Provider>
      ),
      { width: 30, height: 1 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("hits=5")
  })

  test("use() throws when called outside the Provider", () => {
    expect(() => Counter.use()).toThrow(/Counter context must be used within its Provider/)
  })
})
