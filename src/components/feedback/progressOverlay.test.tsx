import { describe, expect, test } from "bun:test"
import { ProgressOverlay, type ProgressTask } from "@components/feedback/progressOverlay.tsx"
import { testRender } from "@opentui/solid"
import { ThemeProvider } from "@theme"

describe("ProgressOverlay", () => {
  test("renders the title and one row per task", async () => {
    const tasks: ProgressTask[] = [
      { id: "a", icon: "◆", label: "aikido", detail: "delta", value: "1,204 rows" },
      { id: "b", icon: "◇", label: "orca", detail: "full pull", value: "37 rows" },
    ]
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <ThemeProvider>
          <ProgressOverlay tasks={() => tasks} title={() => "Refreshing…"} />
        </ThemeProvider>
      ),
      { width: 50, height: 8 },
    )
    await renderOnce()
    const frame = captureCharFrame()
    expect(frame).toContain("Refreshing…")
    expect(frame).toContain("aikido")
    expect(frame).toContain("delta")
    expect(frame).toContain("1,204 rows")
    expect(frame).toContain("orca")
  })

  test("shows the empty label when there are no tasks", async () => {
    const { captureCharFrame, renderOnce } = await testRender(
      () => (
        <ThemeProvider>
          <ProgressOverlay tasks={() => []} title={() => "Loading…"} emptyLabel="starting…" />
        </ThemeProvider>
      ),
      { width: 50, height: 6 },
    )
    await renderOnce()
    expect(captureCharFrame()).toContain("starting…")
  })
})
