import { defineConfig, loadEnv, type UserConfigFnObject, type ConfigEnv } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import VueRouter from 'unplugin-vue-router/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { fileURLToPath, URL } from 'node:url'
import type { Merge, LiteralUnion, SetParameterType, Simplify } from 'type-fest'
import VueComplexTypes from '@vue.ts/complex-types/vite'

type NewConfigEnv = Merge<
  ConfigEnv,
  {
    mode: LiteralUnion<'development' | 'production' | 'test', string>
  }
>
type NewUserConfigFnObject = SetParameterType<UserConfigFnObject, { 0: NewConfigEnv }>

// https://vitejs.dev/config/
export default (({ mode }) => {
  // eslint-disable-next-line no-undef
  const loadedEnv = loadEnv(mode, process.cwd(), mode === 'production' ? '' : 'PUBLIC_')
  console.log(loadedEnv)

  return defineConfig({
    ssr: {
      noExternal: mode === 'development' ? ['vue-router'] : []
    },
    plugins: [
      AutoImport({
        include: [
          /\.[jt]sx?$/, // .js, .ts, .jsx, .tsx
          /\.vue\??/ // .vue
        ],
        imports: [
          'vue',
          '@vueuse/core',
          // 'vue/macros',
          'pinia',
          {
            'vue-router/auto': [
              'useRouter',
              'useRoute',
              'useLink',
              'onBeforeRouteLeave',
              'onBeforeRouteUpdate',
              'RouterLink',
              'RouterView'
            ]
          }
        ]
      }),
      VueRouter({
        importMode: 'sync',
        loqs: true
      } as any),
      tailwindcss(),
      // VueComplexTypes(),
      vue(),
      VueDevTools()
    ],
    define: loadedEnv,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        $shared: fileURLToPath(new URL('../shared/src', import.meta.url))
      }
    }
  })
}) as NewUserConfigFnObject
