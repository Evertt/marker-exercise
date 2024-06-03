<script lang="ts" setup>
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import FeedbackItemComp from '@/components/ui/feedback/FeedbackItem.vue'
import { Button } from '@/components/ui/button'
import { onMounted } from 'vue'
import { type FeedbackItem, feedbackSchema } from '$shared/zod'
import { z } from 'zod'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const id = router.currentRoute.value.params.id as string
const item = ref<FeedbackItem | undefined>()

onMounted(() => {
  fetch(`http://localhost:3000/api/feedback/${id}`)
    .then((res) => res.json())
    .then((data: FeedbackItem[]) => {
      item.value = feedbackSchema.parse(data)
    })
    .catch((err) => {
      console.error(err)
    })
})
</script>

<template>
  <div class="bg-white h-full overflow-y-scroll">
    <template v-if="item">
      <div class="p-16">
        <h1 class="text-2xl">{{ item.title }}</h1>

        <div class="mt-8 whitespace-pre text-wrap">{{ item.message }}</div>
      </div>
    </template>
  </div>
</template>
