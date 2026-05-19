import { useTheme } from "@theme/provider.tsx"
import { For, type JSX, Show } from "solid-js"

export interface WizardStep<TStep extends string> {
  /** Step value (matches `current()`). */
  key: TStep
  /** Short label rendered under the bullet. */
  label: string
}

export interface WizardGlyphs {
  done?: string
  active?: string
  pending?: string
  connector?: string
}

export interface WizardRailProps<TStep extends string> {
  steps: ReadonlyArray<WizardStep<TStep>>
  current: () => TStep
  /** Override any subset of the default glyphs (●/◉/○/─). */
  glyphs?: WizardGlyphs
}

enum StepStatus {
  Done = "done",
  Active = "active",
  Pending = "pending",
}

const DEFAULT_GLYPHS: Required<WizardGlyphs> = {
  done: "●",
  active: "◉",
  pending: "○",
  connector: "─",
}

/**
 * One-row visual step indicator (`● ─ ◉ ─ ○`) with the current step bolded.
 * Pass `glyphs` to swap any of the four marks — e.g. numeric (`1`/`2`/`3`),
 * icon-based, or ASCII (`x`/`o`/`-`). Drive `current` from `createWizard`.
 */
export function WizardRail<TStep extends string>(props: WizardRailProps<TStep>): JSX.Element {
  const theme = useTheme()
  const currentIndex = (): number => props.steps.findIndex((s) => s.key === props.current())
  const glyphs = (): Required<WizardGlyphs> => ({ ...DEFAULT_GLYPHS, ...(props.glyphs ?? {}) })

  return (
    <box flexDirection="row" height={1}>
      <For each={props.steps}>
        {(step, index) => {
          const status = (): StepStatus => {
            const i = index()
            const c = currentIndex()
            if (i < c) return StepStatus.Done
            if (i === c) return StepStatus.Active
            return StepStatus.Pending
          }
          const glyph = (): string => {
            const g = glyphs()
            switch (status()) {
              case StepStatus.Done:
                return g.done
              case StepStatus.Active:
                return g.active
              case StepStatus.Pending:
                return g.pending
            }
          }
          const color = (): string => {
            switch (status()) {
              case StepStatus.Done:
                return theme.accent
              case StepStatus.Active:
                return theme.text
              case StepStatus.Pending:
                return theme.dim
            }
          }
          return (
            <text>
              <span style={{ fg: color() }}>{`${glyph()} ${step.label}`}</span>
              <Show when={index() < props.steps.length - 1}>
                <span style={{ fg: theme.faint }}>{` ${glyphs().connector} `}</span>
              </Show>
            </text>
          )
        }}
      </For>
    </box>
  )
}
