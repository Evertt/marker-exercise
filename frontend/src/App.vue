<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="grid grid-cols-1 grid-rows-[94px_1fr]">
    <header>
      <img src="@/assets/logo.png" width="70" height="70" alt="Feedback" />

      <nav>
        <RouterLink to="/feedback/list"> Feedback </RouterLink>
        <RouterLink to="/feedback/new"> Register </RouterLink>
      </nav>
    </header>

    <main>
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <Transition mode="out-in">
            <KeepAlive>
              <Suspense>
                <!-- main content -->
                <component :is="Component"></component>

                <!-- loading state -->
                <template #fallback> Loading... </template>
              </Suspense>
            </KeepAlive>
          </Transition>
        </template>
      </RouterView>
    </main>
  </div>
</template>
