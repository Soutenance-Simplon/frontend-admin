// Importation du module ou composant
import { ref } from 'vue'

// Déclaration de variable
const isSidebarOpen = ref(false)

// Exportation
export function useSidebar() {
  // Déclaration de variable
  const toggle = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  // Déclaration de variable
  const close = () => {
    isSidebarOpen.value = false
  }

  // Déclaration de variable
  const open = () => {
    isSidebarOpen.value = true
  }

  // Retourne la valeur
  return {
    isSidebarOpen,
    toggle,
    close,
    open
  }
}
