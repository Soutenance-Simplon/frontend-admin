import { ref } from 'vue'

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

const state = ref<ConfirmState>({
  isOpen: false,
  title: 'Confirmation requise',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  variant: 'danger',
  resolve: () => {}
})

export function useConfirm() {
  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
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

  const handleConfirm = () => {
    state.value.isOpen = false
    state.value.resolve(true)
  }

  const handleCancel = () => {
    state.value.isOpen = false
    state.value.resolve(false)
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel
  }
}
