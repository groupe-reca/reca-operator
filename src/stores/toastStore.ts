type ToastVariant = 'success' | 'error'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

let toasts: Toast[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function push(message: string, variant: ToastVariant) {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message, variant }]
  emit()
  setTimeout(() => dismissToast(id), 4000)
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToastsSnapshot() {
  return toasts
}

export const toast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error'),
}
