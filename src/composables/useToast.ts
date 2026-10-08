// Importation du module ou composant
import { ref } from 'vue'

// Exportation
export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  text: string
}

// Déclaration de variable
const toasts = ref<ToastMessage[]>([])
// Déclaration de variable
let counter = 0

// Exportation
export function useToast() {
  // Déclaration de variable
  const show = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3500) => {
    // Déclaration de variable
    const id = ++counter
    toasts.value.push({ id, type, text })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  // Déclaration de variable
  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Retourne la valeur
  return {
    toasts,
    success: (text: string, duration?: number) => show(text, 'success', duration),
    error: (text: string, duration?: number) => show(text, 'error', duration),
    warning: (text: string, duration?: number) => show(text, 'warning', duration),
    info: (text: string, duration?: number) => show(text, 'info', duration),
    remove
  }
}
