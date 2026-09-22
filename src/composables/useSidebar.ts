import { ref } from 'vue'

const isSidebarOpen = ref(false)

export function useSidebar() {
  const toggle = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const close = () => {
    isSidebarOpen.value = false
  }

  const open = () => {
    isSidebarOpen.value = true
  }

  return {
    isSidebarOpen,
    toggle,
    close,
    open
  }
}
