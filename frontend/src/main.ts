import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryPlugin as PiniaColadaPlugin } from '@pinia/colada'

import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router/auto'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL)
})

const app = createApp(App)

app.use(createPinia())
app.use(PiniaColadaPlugin)
app.use(router)

app.mount('#app')
