import type { KeyHint } from "@keyboard"
import { createSignal } from "solid-js"

/**
 * Shape consumed by `<ConfirmDialog>`. Owned by the models layer because the
 * dialog component is a pure renderer over this state; the component imports
 * the type from here, not vice versa.
 */
export interface ConfirmAction {
  message: string
  detail?: string
  destructive?: boolean
  title?: string
  keyHints?: ReadonlyArray<KeyHint>
  onConfirm: () => void
  onCancel?: () => void
}

export interface ConfirmRequest {
  message: string
  detail?: string
  destructive?: boolean
  title?: string
  onConfirm: () => void | Promise<void>
  /**
   * Called when `onConfirm` returns a Promise that rejects. Without this hook
   * the rejection would surface as an unhandled rejection.
   */
  onError?: (err: unknown) => void
}

export interface ConfirmState {
  action: () => ConfirmRequest | null
  request: (action: ConfirmRequest) => void
  cancel: () => void
  execute: () => void
  /**
   * Pre-wired accessor for `<ConfirmDialog action={state.dialogAction} />`:
   * fills in `onCancel` from `cancel()` so the dialog has both halves.
   */
  dialogAction: () => ConfirmAction | null
}

/**
 * Modal confirmation lifecycle. Pairs with `<ConfirmDialog>`.
 *
 * Usage:
 *   const confirm = createConfirmState()
 *   confirm.request({ message: "Delete?", destructive: true, onConfirm: () => doIt() })
 *   // in keymap: enter → confirm.execute(); esc → confirm.cancel()
 *   // in render: <ConfirmDialog action={confirm.dialogAction} />
 */
export function createConfirmState(): ConfirmState {
  const [action, setAction] = createSignal<ConfirmRequest | null>(null)

  function request(next: ConfirmRequest) {
    setAction(next)
  }

  function cancel() {
    setAction(null)
  }

  function execute() {
    const current = action()
    if (!current) return
    setAction(null)
    let result: void | Promise<void>
    try {
      result = current.onConfirm()
    } catch (err) {
      current.onError?.(err)
      return
    }
    if (result instanceof Promise) {
      result.catch((err) => current.onError?.(err))
    }
  }

  function dialogAction(): ConfirmAction | null {
    const current = action()
    if (!current) return null
    return {
      message: current.message,
      detail: current.detail,
      destructive: current.destructive,
      title: current.title,
      onConfirm: () => execute(),
      onCancel: () => cancel(),
    }
  }

  return { action, request, cancel, execute, dialogAction }
}
