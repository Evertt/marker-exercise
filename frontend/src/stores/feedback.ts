import { defineStore, acceptHMRUpdate } from 'pinia'
import type { LiteralUnion } from 'type-fest'
import type { Ref, UnwrapNestedRefs } from 'vue'
import {
  paginatedResultsSchema,
  type PaginatedResults,
  type FeedbackItem,
  feedbackSchema,
  type FeedbackFetchParams,
  type URLFeedbackFetchParams
} from '$shared/zod'
import ENV from '@/env'
import { sortedUniqBy } from 'lodash-es'
import { is } from 'date-fns/locale'

type CompleteCache = UnwrapNestedRefs<{
  asc: FeedbackItem[] // from previously fetched pages in 'asc' mode
  desc: FeedbackItem[] // from previously fetched pages in 'desc' mode
}>

// type CachedItems = UnwrapNestedRefs<{
//   items: FeedbackItem[] // why the Ref will become clear later
//   metadata?: CacheMetaData
// }>

type CacheMetaData = UnwrapNestedRefs<{
  minCreatedAt?: Date // from the oldest item in the list
  maxCreatedAt?: Date // from the latest item in the list
  maxUpdatedAt?: Date // most recently updated item the list

  // All those fields are optional of course, because our cache can be empty
}>

export const useFeedbackStore = defineStore('feedback', () => {
  const cache = reactive<CompleteCache>({
    asc: [],
    desc: []
  })

  const isFetching = ref(false)
  const sort = ref<'asc' | 'desc'>('asc')
  const pageNumber = ref(1)
  const itemsPerPage = ref(10)
  const total = ref(0)
  const triedFetching = ref(false)

  const items = computed(() => {
    const sortDirection = sort.value === 'asc' ? 1 : -1

    return sortedUniqBy(
      cache[sort.value].sort(
        (a, b) => sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
      ),
      '_id'
    )
  })

  const metadata = computed<CacheMetaData>(() => {
    return {
      minCreatedAt: items.value.at(0)?.createdAt,
      maxCreatedAt: items.value.at(-1)?.createdAt,
      maxUpdatedAt: items.value.at(-1)?.updatedAt
    }
  })

  const pageFetchParams = reactiveComputed<URLFeedbackFetchParams>(() => ({
    page: `${pageNumber.value}`,
    order: sort.value,
    itemsPerPage: `${itemsPerPage.value}`,
    minCreatedAt: metadata.value.minCreatedAt?.toISOString(),
    maxCreatedAt: metadata.value.maxCreatedAt?.toISOString(),
    maxUpdatedAt: metadata.value.maxUpdatedAt?.toISOString()
  }))

  const pageItems = computed(() => {
    return items.value.slice(
      (pageNumber.value - 1) * itemsPerPage.value,
      pageNumber.value * itemsPerPage.value
    )
  })

  watch(pageItems, (newPageItems) => {
    console.log({
      newPageItems,
      itemsPerPage: itemsPerPage.value,
      isFetching: isFetching.value,
      triedFetching: triedFetching.value
    })

    if (
      newPageItems.length < itemsPerPage.value &&
      !isFetching.value &&
      !triedFetching.value
    ) {
      console.log('fetching more items')
      isFetching.value = true
      fetchMoreItems().then(() => (isFetching.value = false))
      triedFetching.value = true
    } else if (newPageItems.length === itemsPerPage.value && triedFetching.value) {
      console.log('resetting triedFetching')
      triedFetching.value = false
    }
  })

  async function fetchMoreItems() {
    const queryParams = new URLSearchParams(Object.entries(pageFetchParams))
    const response = await fetch(`${ENV.VITE_API_URL}/feedback?${queryParams}`)
    const data = await response.json()
    const { newPageItems, updatedCacheItems, totalItemsInDB } =
      paginatedResultsSchema.parse(data)

    total.value = totalItemsInDB
    cache[pageFetchParams.order] = cache[pageFetchParams.order]
      .concat(newPageItems)
      .map((item) => {
        const updatedItem = updatedCacheItems.find(
          (updatedItem) => updatedItem._id === item._id
        )
        return updatedItem ?? item
      })
  }

  return {
    sort,
    total,
    isFetching,
    pageNumber,
    itemsPerPage,
    pageItems
  }
})

// defineStore({
//   id: 'feedback',
//   state: () => ({
//     cache: {
//       asc: {
//         items: []
//       } as CachedItems,
//       desc: {
//         items: []
//       } as CachedItems
//     },
//     itemsPerPage: computed(() => 10),
//     sort: 'asc' as 'asc' | 'desc',
//     filter: null as null | LiteralUnion<'bug' | 'suggestion', string>
//   }),
//   getters: {
//     items: (state): FeedbackItem[] => {
//       return state.cache[state.sort].items
//     },
//     metadata: (state): CacheMetaData => {
//       return {
//         minCreatedAt: state.cache[state.sort].items.at(0)?.createdAt,
//         maxCreatedAt: state.cache[state.sort].items.at(-1)?.createdAt,
//         maxUpdatedAt: state.cache[state.sort].items.at(-1)?.updatedAt
//       }
//     }
//   },
//   actions: {
//     setItemsPerPage(itemsPerPage: ComputedRef<number>) {
//       this.itemsPerPage = itemsPerPage
//     },
// async fetchItems(params: URLFeedbackFetchParams) {
//   const queryParams = new URLSearchParams(Object.entries(params))
//   const response = await fetch(`${ENV.VITE_API_URL}/feedback?${queryParams}`)
//   const items = (await response.json()) as PaginatedResults
//   this.cache[params.order].items = items
// }
// }
// })

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFeedbackStore, import.meta.hot))
}
