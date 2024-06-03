import { defineStore, acceptHMRUpdate } from 'pinia'
import type { LiteralUnion } from 'type-fest'
import type { Ref, UnwrapNestedRefs } from 'vue'
import {
  type PaginatedResults,
  type FeedbackItem,
  feedbackSchema,
  type FeedbackFetchParams,
  type URLFeedbackFetchParams
} from '$shared/zod'
import ENV from '@/env'

type CompleteCache = UnwrapNestedRefs<{
  asc: CachedItems // from previously fetched pages in 'asc' mode
  desc: CachedItems // from previously fetched pages in 'desc' mode
}>

type CachedItems = UnwrapNestedRefs<{
  items: FeedbackItem[] // why the Ref will become clear later
  metadata?: CacheMetaData
}>

type CacheMetaData = UnwrapNestedRefs<{
  minCreatedAt?: Date // from the oldest item in the list
  maxCreatedAt?: Date // from the latest item in the list
  maxUpdatedAt?: Date // most recently updated item the list

  // All those fields are optional of course, because our cache can be empty
}>

export const useFeedbackStore = defineStore({
  id: 'feedback',
  state: () => ({
    cache: {
      asc: {
        items: []
      } as CachedItems,
      desc: {
        items: []
      } as CachedItems
    },
    sort: 'asc' as 'asc' | 'desc',
    filter: null as null | LiteralUnion<'bug' | 'suggestion', string>
  }),
  getters: {
    items: (state): FeedbackItem[] => {
      return state.cache[state.sort].items
    },
    metadata: (state): CacheMetaData => {
      return {
        minCreatedAt: state.cache[state.sort].items.at(0)?.createdAt,
        maxCreatedAt: state.cache[state.sort].items.at(-1)?.createdAt,
        maxUpdatedAt: state.cache[state.sort].items.at(-1)?.updatedAt
      }
    }
  },
  actions: {
    async fetchItems(params: URLFeedbackFetchParams) {
      const queryParams = new URLSearchParams(Object.entries(params))
      const response = await fetch(`${ENV.VITE_API_URL}/feedback?${queryParams}`)
      const items = (await response.json()) as PaginatedResults
      this.cache[params.order].items = items
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFeedbackStore, import.meta.hot))
}
