<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { RouterLink } from 'vue-router/auto'
import { type FeedbackItem } from '$shared/zod'
import SuggestionIcon from '@/assets/icons/suggestion.svg'
import BugIcon from '@/assets/icons/bug.svg'

const iconMap = {
  suggestion: SuggestionIcon,
  bug: BugIcon
} as const

const props = defineProps<{
  id: string
  title: string
  reporter: string
  type: FeedbackItem['type']
  date: Date
}>()
</script>

<template>
  <RouterLink
    class="max-w-full w-full p-4 bg-[#F8FAFC] aria-[current=page]:!bg-[#EAF0F6] hover:bg-[#EAF0F6]/70 rounded-md cursor-pointer block *:left-auto"
    :to="$props.id"
  >
    <div class="h-full flex flex-col justify-between gap-1 *:bottom-auto">
      <h4 class="min-w-4 pr-2">
        <img
          :src="iconMap[props.type]"
          width="20"
          height="20"
          alt="Bug Icon"
          class="inline align-middle mr-2"
        />
        <span class="align-middle inline-block truncate max-w-[calc(100%-28px)]">{{
          props.title
        }}</span>
      </h4>
      <small class="ml-[28px] text-muted-foreground flex justify-between gap-8">
        <span class="truncate shrink min-w-4 max-w-fit">{{ props.reporter }}</span>
        <span class="shrink-[2] truncate">{{
          formatDistanceToNow(props.date, { locale: enUS, addSuffix: true })
        }}</span>
      </small>
    </div>
  </RouterLink>
</template>
