<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'
import FeedbackItemComp from '@/components/ui/feedback/FeedbackItem.vue'
import { Button } from '@/components/ui/button'
import { onMounted } from 'vue'
import {
  type PaginatedResults,
  type FeedbackItem,
  feedbackSchema,
  type FeedbackFetchParams
} from '$shared/zod'
import { z } from 'zod'
import type { Schema, Merge } from 'type-fest'
import { sortedUniqBy } from 'lodash-es'
import { PaginationGenerator } from '@/components/ui/pagination'

const items = ref<FeedbackItem[]>([])

function fetchSomeMoreFeedback() {
  type FetchParamsSchema = Merge<
    Schema<FeedbackFetchParams, string>,
    {
      order: 'asc' | 'desc'
    }
  >

  const params: FetchParamsSchema = {
    itemsPerPage: '5',
    // localItemCount: `${items.value.length}`,
    minCreatedAt: items.value
      ?.toSorted(
        (a: FeedbackItem, b: FeedbackItem) =>
          a.createdAt.getTime() - b.createdAt.getTime()
      )[0]
      ?.createdAt.toISOString(), // ?? new Date(Date.now() - 3600 * 24 * 7).toISOString(),
    maxCreatedAt: items.value
      ?.toSorted(
        (a: FeedbackItem, b: FeedbackItem) =>
          b.createdAt.getTime() - a.createdAt.getTime()
      )[0]
      ?.createdAt.toISOString(), // ?? new Date(Date.now() - 3600 * 24 * 7).toISOString(),
    maxUpdatedAt: items.value
      ?.toSorted(
        (a: FeedbackItem, b: FeedbackItem) =>
          b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0]
      ?.updatedAt.toISOString(), // ?? new Date(Date.now() - 3600 * 24 * 7).toISOString(),
    order: 'desc'
  }

  const urlSearchParams = new URLSearchParams(Object.entries(params))

  fetch(`${import.meta.env.VITE_API_URL}/feedback?${urlSearchParams}`)
    .then((res) => res.json())
    .then((data: PaginatedResults) => {
      const sortDirection = params.order === 'asc' ? 1 : -1
      const nextItems = z.array(feedbackSchema).parse(data.newPageItems)
      const updatedCacheItems = z.array(feedbackSchema).parse(data.updatedCacheItems)
      console.log({ nextItems, updatedCacheItems })

      items.value = sortedUniqBy(
        items.value
          .concat(nextItems)
          .map((item) => {
            const updatedItem = updatedCacheItems.find(
              (updatedItem) => updatedItem._id === item._id
            )
            return updatedItem ?? item
          })
          .sort(
            (a, b) => sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
          ),
        '_id'
      )
    })
    .catch((err) => {
      console.error(err)
    })
}

onMounted(() => {
  if (items.value.length) return
  fetchSomeMoreFeedback()
})

watchEffect(() => {
  console.log('items', [...items.value.map((o) => ({ ...o }))])
})
</script>

<template>
  <ResizablePanelGroup
    id="demo-group-1"
    direction="horizontal"
    class="rounded-lg max-h-full"
  >
    <ResizablePanel
      id="demo-panel-1"
      :default-size="30"
      :collapsible="false"
      :min-size="20"
      :max-size="40"
      class="flex flex-col h-full overflow-hidden"
    >
      <!-- <div class="flex justify-center items-center p-2">
        <Button @click="fetchSomeMoreFeedback"> Fetch more feedback </Button>
      </div> -->
      <!-- <div class="h-12 p-2 flex justify-between">
        <div>Filter <Combobox /></div>
        <div>
          Sort
          <Select>
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="apple"> Apple </SelectItem>
                <SelectItem value="banana"> Banana </SelectItem>
                <SelectItem value="blueberry"> Blueberry </SelectItem>
                <SelectItem value="grapes"> Grapes </SelectItem>
                <SelectItem value="pineapple"> Pineapple </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div> -->
      <!-- <div class="h-full group flex flex-col gap-2 p-2 flex-wrap justify-between *:top-auto @container"> -->
      <div class="h-12 bg-blue-100">
        <span>Filter and Sort</span>
      </div>
      <div
        id="items-list"
        class="grow shrink p-2 h-full overflow-hidden grid grid-flow-col gap-1 items-center"
      >
        <div>
          <FeedbackItemComp
            v-for="item in items"
            :key="item._id as string"
            :id="item._id as string"
            :type="item.type"
            :title="item.title"
            :reporter="item.name"
            :date="item.updatedAt"
          />
        </div>
      </div>
      <div class="h-16 flex flex-col justify-center items-center p-2">
        <PaginationGenerator class="w-full" />
      </div>
    </ResizablePanel>
    <ResizableHandle id="demo-handle-1" />
    <ResizablePanel
      id="demo-panel-2"
      :default-size="70"
      :collapsible="false"
      :max-size="80"
      :min-size="60"
    >
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <Transition mode="out-in">
            <KeepAlive>
              <component :is="Component" :key="$route.fullPath"></component>
            </KeepAlive>
          </Transition>
        </template>
      </RouterView>
      <!-- <RouterView /> -->
    </ResizablePanel>
  </ResizablePanelGroup>
</template>

<style scoped>
#items-list {
  grid-template-rows: repeat(auto-fill, minmax(80px, 1fr));
  grid-template-columns: repeat(auto-fill, 100%);
}
</style>
