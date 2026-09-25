import './assets/main.css'
import 'vue-tel-input/vue-tel-input.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueTelInput from 'vue-tel-input'

const app = createApp(App)

app.use(router)
app.use(VueTelInput)
app.mount('#app')
