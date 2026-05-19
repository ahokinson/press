import { type Accessor, createSignal } from "solid-js"

export interface WizardState<TStep extends string> {
  step: Accessor<TStep>
  /** Zero-based position of the current step in the configured order. */
  index: Accessor<number>
  isFirst: Accessor<boolean>
  isLast: Accessor<boolean>
  /** Advance one step; no-op on the last step. */
  next: () => void
  /** Retreat one step; no-op on the first step. */
  prev: () => void
  /** Jump to a specific step; unknown steps are silently ignored. */
  goto: (step: TStep) => void
  /** Return to the initial step. */
  reset: () => void
}

export interface WizardOptions<TStep extends string> {
  /** Override the entry point. Defaults to `steps[0]`. */
  initial?: TStep
}

/**
 * Step-machine for multi-stage forms / flows. The caller defines an `enum`
 * (per the project convention of enums over union literals) and passes
 * `Object.values(MyEnum)` as `steps`; the wizard tracks the current step and
 * exposes next/prev/goto/reset plus first/last accessors.
 *
 * Pure state — no UI. Pair with `<WizardRail>` for a visual step indicator,
 * or roll your own renderer keyed on `state.step()`.
 */
export function createWizard<TStep extends string>(
  steps: readonly TStep[],
  opts: WizardOptions<TStep> = {},
): WizardState<TStep> {
  if (steps.length === 0) {
    throw new Error("createWizard requires at least one step")
  }

  const initialStep = opts.initial ?? steps[0]!
  if (steps.indexOf(initialStep) === -1) {
    throw new Error(`createWizard: initial step "${initialStep}" is not in steps`)
  }

  const [step, setStep] = createSignal<TStep>(initialStep)

  const index = (): number => steps.indexOf(step())
  const isFirst = (): boolean => index() === 0
  const isLast = (): boolean => index() === steps.length - 1

  function next(): void {
    const i = index()
    if (i >= steps.length - 1) return
    setStep(() => steps[i + 1]!)
  }

  function prev(): void {
    const i = index()
    if (i <= 0) return
    setStep(() => steps[i - 1]!)
  }

  function goto(target: TStep): void {
    if (steps.indexOf(target) === -1) return
    setStep(() => target)
  }

  function reset(): void {
    setStep(() => initialStep)
  }

  return { step, index, isFirst, isLast, next, prev, goto, reset }
}
