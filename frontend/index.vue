<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'
import FeedbackItemComp from '@/components/ui/feedback/FeedbackItem.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { z } from 'zod'
import { PaginationGenerator } from '@/components/ui/pagination'
import { useProvideFeedbackStore } from "@/stores/feedback"
import { useRouteQuery } from '@vueuse/router'

// We'll synch the current page number on the URL query
const page = useRouteQuery('page', '1', { transform: Number })

// We'll use this to get the height of the items list
const itemsListEl = ref<HTMLDivElement | null>(null)
const { height: itemsListElHeight } = useElementSize(itemsListEl)

// We'll use this to calculate the number of items per page
const itemsPerPage = computedWithControl(
  () => [itemsListEl.value, itemsListElHeight.value],
  () => !itemsListEl.value ? 0 : getComputedStyle(itemsListEl.value).getPropertyValue("grid-template-rows").split(" ").length
)

// Then we make the store, while synching the store's page and itemsPerPage, with ours
// also this provider function will be used to provide the store to the child component
const feedbackStore = useProvideFeedbackStore({ itemsPerPage, page })
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
        ref="itemsListEl"
        id="items-list"
        class="grow shrink p-2 h-full overflow-hidden grid grid-flow-col gap-2"
      >
        <FeedbackItemComp
          v-for="item in feedbackStore.pageItems"
          :key="item._id as string"
          :id="item._id as string"
          :type="item.type"
          :title="item.title"
          :reporter="item.name"
          :date="item.updatedAt"
        />
        <!-- <div>
        </div> -->
      </div>
      <div class="h-16 flex flex-col justify-center items-center p-2">
        <PaginationGenerator class="w-full *:justify-center *:gap-2" 
          :total="feedbackStore.total ?? feedbackStore.totalInOurCache"
          :itemsPerPage="feedbackStore.itemsPerPage"
          v-model:page="page"
          :siblingCount="1"
          showEdges
        />
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
              <component
                :is="Component"
                :key="$route.fullPath"
              ></component>
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
