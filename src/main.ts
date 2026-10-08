/**
 * ====================================================================================================
 * TABLEAU DE BORD ADMINISTRATEUR : POINT D'ENTRÉE VUE 3 / VITE (MAIN.TS)
 * ====================================================================================================
 * 
 * 🎓 CONCEPTS D'ARCHITECTURE FRONTEND WEB POUR LA SOUTENANCE :
 * Pourquoi avoir choisi Vue 3 avec Vite et TypeScript pour le Dashboard d'administration ?
 * 
 * 🚀 PERFORMANCE & PRODUCTIVITÉ :
 * 1. Vite (Next Generation Frontend Tooling) :
 *    - Serveur de développement instantané basé sur les ES Modules natifs du navigateur.
 *    - Bundling de production ultra-rapide et optimisé via Rollup.
 * 
 * 2. Vue 3 Composition API & Typage Stricte TypeScript :
 *    - Meilleure inférence de types, détection précoce des bugs à la compilation.
 *    - Logique découpée en composables réutilisables (`useToast`, `useConfirm`, `useSidebar`).
 * 
 * 3. VueTelInput (Plugin de Saisie Téléphonique Internationale) :
 *    - Détection automatique du drapeau sénégalais (+221) et validation syntaxique en direct.
 * ====================================================================================================
 */

// Importation du module ou composant
import './assets/main.css'
// Importation du module ou composant
import 'vue-tel-input/vue-tel-input.css'

// Importation du module ou composant
import { createApp } from 'vue'
// Importation du module ou composant
import App from './App.vue'
// Importation du module ou composant
import router from './router'
// Importation du module ou composant
import VueTelInput from 'vue-tel-input'

// Création de l'application racine Vue 3
const app = createApp(App)

// Enregistrement du routeur Vue Router
app.use(router)

// Enregistrement du composant de saisie téléphonique international
app.use(VueTelInput)

// Montage de l'application sur la balise <div id="app"> du fichier index.html
app.mount('#app')

