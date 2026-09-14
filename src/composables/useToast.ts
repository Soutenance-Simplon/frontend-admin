import { ref } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

const toasts = ref<ToastMessage[]>([])
let counter = 0

export function useToast() {
  const show = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3500) => {
    const id = ++counter
    toasts.value.push({ id, type, text })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    success: (text: string, duration?: number) => show(text, 'success', duration),
    error: (text: string, duration?: number) => show(text, 'error', duration),
    warning: (text: string, duration?: number) => show(text, 'warning', duration),
    info: (text: string, duration?: number) => show(text, 'info', duration),
    remove
  }
}
