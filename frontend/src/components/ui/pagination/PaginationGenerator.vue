<script setup lang="ts">
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev
} from '.'

import { Button } from '../button'

const props = defineProps<{
  class?: string
  total: number
  siblingCount?: number
  showEdges?: boolean
  page: number
}>()

const emits = defineEmits<{'update:page':[page: number]}>()
</script>

<template>
  <Pagination
    :class="props.class"
    v-slot="{ page }"
    :total="props.total"
    :sibling-count="0.5"
    :show-edges="props.showEdges"
    :page="props.page"
    @update:page="emits('update:page', $event)"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-1">
      <PaginationFirst />
      <PaginationPrev />

      <template v-for="(item, index) in items">
        <PaginationListItem
          v-if="item.type === 'page'"
          :key="index"
          :value="item.value"
          as-child
        >
          <Button
            class="w-10 h-10 p-0"
            :variant="item.value === page ? 'default' : 'outline'"
          >
            {{ item.value }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else :key="item.type" :index="index" />
      </template>

      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </Pagination>
</template>
