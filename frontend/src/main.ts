import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router/auto'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'border-indigo-500',
  linkExactActiveClass: 'border-indigo-700'
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
