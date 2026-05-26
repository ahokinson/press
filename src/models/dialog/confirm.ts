import type { KeyHint } from "@keyboard"
import { createSignal } from "solid-js"

/**
 * Shape consumed by `<ConfirmDialog>`. Owned by the models layer. The dialog
 * component is a pure renderer over this state and imports the type from
 * here.
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
   * Called when `onConfirm`'s returned Promise rejects. Without this hook
   * the rejection becomes unhandled.
   */
  onError?: (err: unknown) => void
}

export interface ConfirmState {
  action: () => ConfirmRequest | null
  request: (action: ConfirmRequest) => void
  cancel: () => void
  execute: () => void
  /**
   * Pre-wired accessor for `<ConfirmDialog action={state.dialogAction} />`.
   * Fills in `onCancel` from `cancel()`.
   */
  dialogAction: () => ConfirmAction | null
}

/**
 * Modal confirmation lifecycle.
 *
 *   const confirm = createConfirmState()
 *   confirm.request({ message: "Delete?", destructive: true, onConfirm: () => doIt() })
 *   // keymap: enter → confirm.execute(), esc → confirm.cancel()
 *   // render: <ConfirmDialog action={confirm.dialogAction} />
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
