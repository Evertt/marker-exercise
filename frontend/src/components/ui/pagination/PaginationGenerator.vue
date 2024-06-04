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
import { type PaginationRootProps, type PaginationRootEmits } from 'radix-vue'

import { Button } from '../button'

const props = defineProps<PaginationRootProps & { class: string }>()

const emits = defineEmits<PaginationRootEmits>()
</script>

<template>
  <Pagination
    :class="props.class"
    v-slot="{ page }"
    :total="props.total"
    :sibling-count="props.siblingCount"
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
          :value="Math.ceil(item.value)"
          as-child
        >
          <Button
            class="w-10 h-10 p-0"
            :variant="Math.ceil(item.value) === page ? 'default' : 'outline'"
          >
            {{ Math.ceil(item.value) }}
          </Button>
        </PaginationListItem>
        <PaginationEllipsis v-else :key="item.type" :index="index" />
      </template>

      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </Pagination>
</template>
