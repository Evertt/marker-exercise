<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'
import FeedbackItemComp from '@/components/ui/feedback/FeedbackItem.vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PaginationGenerator } from '@/components/ui/pagination'
import { useProvideFeedbackStore } from '@/stores/feedback'
import { useRouteQuery } from '@vueuse/router'

// We'll sync these ref values with the url query params
const page = useRouteQuery('page', '1', { transform: Number })
const sort = useRouteQuery<'asc' | 'desc'>('sort', 'desc')
const search = useRouteQuery('q', '')

// I honestly don't know why this happens,
// but something somewhere is setting the page to 0, sometimes...
watch(page, (newPage, oldPage) => {
  if (newPage === 0 && oldPage > 0) {
    // Here I'm just making sure that if the old page number is not valid (anymore),
    // which could happen on a window resize or something, then we'll just set it to the last page.
    page.value = Math.min(
      oldPage,
      Math.ceil(
        (feedbackStore.total ?? feedbackStore.itemsPerPage) / feedbackStore.itemsPerPage
      )
    )
  }
})

// We'll use this to get the height of the items list
const itemsListEl = ref<HTMLDivElement | null>(null)
const { height: itemsListElHeight } = useElementSize(itemsListEl)

// We'll use this to calculate the number of items per page
const itemsPerPage = computedWithControl(
  () => [itemsListEl.value, itemsListElHeight.value],
  () =>
    !itemsListEl.value
      ? 0
      : getComputedStyle(itemsListEl.value)
          .getPropertyValue('grid-template-rows')
          .split(' ').length
)

// Then we make the store, while synching the store's page and itemsPerPage, with ours
// also this provider function will be used to provide the store to the child component
const feedbackStore = useProvideFeedbackStore({ itemsPerPage, page, sort, search })
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
      <div class="h-16 flex justify-between align-center p-2 gap-2">
        <Input v-model="search" class="grow shrink" placeholder="Search" />
        <Select v-model="sort">
          <SelectTrigger class="w-[128px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="asc"> Oldest </SelectItem>
              <SelectItem value="desc"> Newest </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div
        ref="itemsListEl"
        id="items-list"
        class="grow shrink px-2 h-full overflow-hidden grid grid-flow-col gap-2"
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
        <PaginationGenerator
          class="w-full *:justify-center *:gap-2"
          :total="feedbackStore.total ?? feedbackStore.totalInOurCache"
          :items-per-page="feedbackStore.itemsPerPage"
          v-model:page="page"
          :sibling-count="0.5"
          :show-edges="true"
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
              <component :is="Component" :key="$route.fullPath"></component>
            </KeepAlive>
          </Transition>
        </template>
      </RouterView>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>

<style scoped>
/*
  There are a few things that TailwindCSS can't do well.
  One of them is to create an auto-filling grid.
*/
#items-list {
  grid-template-rows: repeat(auto-fill, minmax(80px, 1fr));
  grid-template-columns: repeat(auto-fill, 100%);
}
</style>
