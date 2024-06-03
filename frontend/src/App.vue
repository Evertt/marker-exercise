<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router/auto'
import { Button } from './components/ui/button'

const inDevMode = import.meta.env.DEV

async function generateFakeFeedback() {
  const resp = await fetch('http://localhost:3000/api/feedback/generate', {
    method: 'POST'
  })

  if (!resp.ok) {
    console.error(resp)
    alert('Failed to generate feedback')
    return
  }

  // location.reload()
}

async function clearAllFeedback() {
  const resp = await fetch('http://localhost:3000/api/feedback', {
    method: 'DELETE'
  })

  if (!resp.ok) {
    console.error(resp)
    alert('Failed to delete feedback')
    return
  }

  location.reload()
}
</script>

<template>
  <div class="flex flex-col h-screen max-h-screen">
    <header class="flex justify-between border-b p-2 shrink-0 grow-0 h-[94px]">
      <img
        src="@/assets/logo.png"
        width="70"
        height="70"
        alt="Feedback"
        class="h-auto self-center"
      />

      <nav v-if="inDevMode" class="text-red-500 flex items-center gap-5">
        <p class="text-xs max-w-max">
          Only here in<br />
          development:
        </p>
        <Button @click="generateFakeFeedback"> Generate fake data </Button>
        <Button variant="destructive" @click="clearAllFeedback"> Delete all feedback </Button>
      </nav>

      <nav class="p-4 flex items-center gap-5">
        <Button variant="secondary" :as="RouterLink" to="/"> All feedback </Button>
        <Button :as="RouterLink" to="/new"> New feedback </Button>
      </nav>
    </header>

    <main class="h-full max-h-[calc(100vh-95px)] overflow-hidden">
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <Transition mode="out-in">
            <KeepAlive>
              <component :is="Component"></component>
            </KeepAlive>
          </Transition>
        </template>
      </RouterView>
      <!-- <RouterView /> -->
    </main>
  </div>
</template>
