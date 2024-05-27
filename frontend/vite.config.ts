import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import VueRouter from 'unplugin-vue-router/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    AutoImport({
      include: [
        /\.[jt]sx?$/, // .js, .ts, .jsx, .tsx
        /\.vue\??/ // .vue
      ],
      imports: ['vue', 'vue-router', 'vue-router/composables']
    }),
    VueRouter(),
    tailwindcss(),
    vue(),
    VueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
