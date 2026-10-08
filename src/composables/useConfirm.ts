// Importation du module ou composant
import { ref } from 'vue'

// Exportation
export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: (value: boolean) => void
}

// Déclaration de variable
const state = ref<ConfirmState>({
  isOpen: false,
  title: 'Confirmation requise',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  variant: 'danger',
  resolve: () => {}
})

// Exportation
export function useConfirm() {
  // Déclaration de variable
  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    // Retourne la valeur
    return new Promise((resolve) => {
      // Déclaration de variable
      const opts: ConfirmOptions = typeof options === 'string'
        ? { message: options }
        : options

      state.value = {
        isOpen: true,
        title: opts.title || 'Confirmation requise',
        message: opts.message,
        confirmText: opts.confirmText || 'Confirmer',
        cancelText: opts.cancelText || 'Annuler',
        variant: opts.variant || 'danger',
        resolve
      }
    })
  }

  // Déclaration de variable
  const handleConfirm = () => {
    state.value.isOpen = false
    state.value.resolve(true)
  }

  // Déclaration de variable
  const handleCancel = () => {
    state.value.isOpen = false
    state.value.resolve(false)
  }

  // Retourne la valeur
  return {
    state,
    confirm,
    handleConfirm,
    handleCancel
  }
}
