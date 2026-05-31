import { Icon } from "@icons"
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
  done: Icon.circleFilled.char,
  active: Icon.circleDot.char,
  pending: Icon.circleEmpty.char,
  connector: Icon.lineHorizontal.char,
}

/**
 * One-row visual step indicator (`● ─ ◉ ─ ○`) with the current step bolded.
 * Pass `glyphs` to swap any of the four marks. Drive `current` from
 * `createWizard`.
 */
export function WizardRail<TStep extends string>(props: WizardRailProps<TStep>): JSX.Element {
  const theme = useTheme()
  const currentIndex = (): number => props.steps.findIndex((step) => step.key === props.current())
  const glyphs = (): Required<WizardGlyphs> => ({ ...DEFAULT_GLYPHS, ...(props.glyphs ?? {}) })

  return (
    <box flexDirection="row" height={1}>
      <For each={props.steps}>
        {(step, index) => {
          const status = (): StepStatus => {
            const stepIndex = index()
            const activeIndex = currentIndex()
            if (stepIndex < activeIndex) return StepStatus.Done
            if (stepIndex === activeIndex) return StepStatus.Active
            return StepStatus.Pending
          }
          const glyph = (): string => {
            const glyphSet = glyphs()
            switch (status()) {
              case StepStatus.Done:
                return glyphSet.done
              case StepStatus.Active:
                return glyphSet.active
              case StepStatus.Pending:
                return glyphSet.pending
            }
          }
          const color = (): string => {
            switch (status()) {
              case StepStatus.Done:
                return theme.accent
              case StepStatus.Active:
                return theme.text
              case StepStatus.Pending:
                return theme.textDim
            }
          }
          return (
            <text>
              <span style={{ fg: color() }}>{`${glyph()} ${step.label}`}</span>
              <Show when={index() < props.steps.length - 1}>
                <span style={{ fg: theme.textFaint }}>{` ${glyphs().connector} `}</span>
              </Show>
            </text>
          )
        }}
      </For>
    </box>
  )
}
