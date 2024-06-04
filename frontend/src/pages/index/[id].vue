<script lang="ts" setup>
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useFeedbackStore } from '@/stores/feedback'
import SuggestionIcon from '@/assets/icons/suggestion.svg'
import BugIcon from '@/assets/icons/bug.svg'

const iconMap = {
  suggestion: SuggestionIcon,
  bug: BugIcon
} as const

const router = useRouter()
// @ts-ignore
const id = router.currentRoute.value.params.id as string
const feedbackStore = useFeedbackStore()
feedbackStore.selectedId = id
const item = feedbackStore.selectedItem
</script>

<template>
  <div class="bg-white h-full overflow-y-scroll flex justify-center items-center">
    <template v-if="item">
      <div class="max-w-[600px] min-w-min p-14 min-h-max">
        <small class="text-muted-foreground">{{
          formatDistanceToNow(item.updatedAt, { locale: enUS, addSuffix: true })
        }}</small>
        <h1 class="text-2xl relative">
          <img
            :src="iconMap[item.type]"
            width="25"
            height="25"
            :alt="`${item.type} icon`"
            class="absolute top-0 bottom-0 left-[-33px] w-[25px] h-[25px] my-auto"
          />
          {{ item.title }}
        </h1>
        <small class="text-muted-foreground">{{ item.name }} ({{ item.email }})</small>

        <div class="mt-8 whitespace-pre text-wrap">{{ item.message }}</div>
      </div>
    </template>
    <template v-else-if="id == '404'">
      <div class="p-16">
        <h1 class="text-2xl">Feedback not found</h1>

        <div class="mt-8 whitespace-pre text-wrap">This item probably got deleted.</div>
      </div>
    </template>
  </div>
</template>
