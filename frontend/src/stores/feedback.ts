import { defineStore } from 'pinia'
import type { UnwrapNestedRefs, MaybeRef } from 'vue'
import {
  paginatedResultsSchema,
  type FeedbackItem,
  feedbackSchema,
  type URLFeedbackFetchParams
} from '$shared/zod'
import ENV from '@/env'
import { sortedUniqBy, uniqBy, orderBy, escapeRegExp, chunk } from 'lodash-es'
import { type Serializer, useLocalStorage } from '@vueuse/core'
import { z } from 'zod'
import { createInjectionState } from '@vueuse/core'

type FeedbackCache = UnwrapNestedRefs<{
  asc: FeedbackItem[][] // from previously fetched pages in 'asc' mode
  desc: FeedbackItem[][] // from previously fetched pages in 'desc' mode
  // They are double arrays because we need to keep track of the pages.
}>

const serializer: Serializer<FeedbackCache> = {
  read: (value) =>
    z
      .object({
        asc: z.array(z.array(feedbackSchema)),
        desc: z.array(z.array(feedbackSchema))
      })
      .catch(({ error }) => {
        console.error('Failed to parse the cache from storage', error)
        return { asc: [], desc: [] }
      })
      .parse(JSON.parse(value)),
  write: JSON.stringify
}

export type FeedbackStoreOptions = {
  page?: MaybeRef<number>
  sort?: MaybeRef<'asc' | 'desc'>
  search?: MaybeRef<string>
  itemsPerPage?: MaybeRef<number>
}

const [useProvideFeedbackStore, innerUseFeedbackStore] = createInjectionState(
  (options?: FeedbackStoreOptions) =>
    defineStore('feedback', () => {
      const storedCache = reactive(
        useLocalStorage<FeedbackCache>(
          'feedback-cache',
          { asc: [], desc: [] },
          { serializer }
        ).value
      )

      // SelectedId and selectedItem are used to show the details of a selected item.
      const selectedId = ref<string | null>(null)
      const selectedItem = computed(() => {
        if (!selectedId.value) return null

        return (
          storedCache.asc.flat().find((item) => item._id === selectedId.value) ??
          storedCache.desc.flat().find((item) => item._id === selectedId.value) ??
          null
        )
      })

      const search = ref(toValue(options?.search) ?? '')
      if (isRef(options?.search)) syncRef(options.search, search)
      const debouncedSearch = debouncedRef(search, 300)

      const totalInDB = ref<number | undefined>()
      const totalInOurCache = computed(
        () =>
          uniqBy(storedCache.asc.flat(), '_id').length +
          uniqBy(storedCache.desc.flat(), '_id').length
      )
      const cacheIsFull = computed(() =>
        totalInDB.value == null ? false : totalInOurCache.value >= totalInDB.value
      )

      const cache = reactiveComputed<FeedbackCache>(() => ({
        asc: storedCache.asc,
        desc: cacheIsFull.value ? storedCache.asc.toReversed() : storedCache.desc
      }))

      const isFetching = ref(false)
      const throttledIsFetching = throttledRef(isFetching, 400)

      const sort = ref<'asc' | 'desc'>(toValue(options?.sort) ?? 'desc')
      if (isRef(options?.sort)) syncRef(options.sort, sort)

      const pageNumber = ref(toValue(options?.page) ?? 1)
      if (isRef(options?.page)) syncRef(options.page, pageNumber)

      // itemsPerPage starts at 0, because we don't know the size of the window yet.
      // When the page is mounted, this will get updated to the correct value.
      // Which then also sets of the first fetch request.
      const itemsPerPage = ref(toValue(options?.itemsPerPage) ?? 0)
      if (isRef(options?.itemsPerPage)) syncRef(options.itemsPerPage, itemsPerPage)

      let triedFetching = false

      const items = reactiveComputed<FeedbackItem[]>(() => cache[sort.value].flat())

      whenever(
        () => !!debouncedSearch.value.trim() && !debouncedSearch.value && !triedFetching,
        fetchMoreItems
      )

      // Whenever the cache is full, we might as well merge the 'asc' and 'desc' arrays.
      // Because we don't want to be using up more memory than we need to.
      whenever(cacheIsFull, () => {
        if (storedCache.desc.length) {
          storedCache.asc = sortedUniqBy(
            orderBy(storedCache.asc.concat(storedCache.desc), ['updatedAt']),
            '_id'
          )

          console.log("emptying 'desc' cache now")
          storedCache.desc = []
        }

        if (storedCache.asc.length > totalInDB.value!) {
          storedCache.asc = storedCache.asc.slice(0, totalInDB.value)
        }
      })

      const pageFetchParams = reactiveComputed<URLFeedbackFetchParams>(() => ({
        page: `${pageNumber.value}`,
        order: sort.value,
        itemsPerPage: `${itemsPerPage.value}`,
        minCreatedAt: items.at(sort.value === 'asc' ? 0 : -1)?.createdAt.toISOString(),
        maxCreatedAt: items.at(sort.value === 'asc' ? -1 : 0)?.createdAt.toISOString(),
        maxUpdatedAt: items.at(sort.value === 'asc' ? -1 : 0)?.updatedAt.toISOString()
      }))

      const pageItems = computed(() => {
        const regex = new RegExp(escapeRegExp(debouncedSearch.value), 'i')
        let itemsCopy = toValue(cache[sort.value][pageNumber.value - 1] ?? [])

        if (debouncedSearch.value)
          itemsCopy = itemsCopy.filter((item) => {
            return (
              regex.test(item.title) ||
              regex.test(item.type) ||
              regex.test(item.name) ||
              regex.test(item.email)
            )
          })

        return itemsCopy
      })

      /**
       * When the pageItems length is not equal to the itemsPerPage,
       * that might mean that we need to fetch more items. But also,
       * it might not mean that. So we need to be careful with this.
       */
      watch(
        () => [pageItems.value.length, throttledIsFetching.value] as const,
        ([pageItemsCount, isFetching]) => {
          if (isFetching) return
          if (pageItemsCount === itemsPerPage.value) return (triedFetching = false)
          if (cacheIsFull.value && triedFetching) return (triedFetching = false)

          fetchMoreItems()
        }
      )

      // This watcher is used to update the pageNumber when the itemsPerPage changes.
      // Which would happen if the user would ever change the size of their window.
      watch(itemsPerPage, (itemsPerPage) => {
        const nth = items.findIndex((item) => item._id === pageItems.value[0]?._id) + 1
        pageNumber.value = Math.ceil(nth / itemsPerPage)
      })

      async function fetchMoreItems() {
        if (triedFetching || throttledIsFetching.value) return
        if (pageNumber.value < 1) return (pageNumber.value = 1)
        if (itemsPerPage.value < 1) return

        triedFetching = isFetching.value = true

        const params = unref(pageFetchParams)
        if (debouncedSearch.value) params.search = debouncedSearch.value
        const queryParams = new URLSearchParams(Object.entries(params))
        const data = await fetch(`${ENV.VITE_API_URL}/feedback?${queryParams}`)
          .then((res) => res.json())
          .then((data) => paginatedResultsSchema.parse(data))
          .catch((error) => {
            console.error('Failed to fetch or parse feedback items', error)

            return {
              newPageItems: [],
              updatedCacheItems: [],
              searchResults: [],
              totalItemsInDB: -1
            }
          })

        const { newPageItems, updatedCacheItems, searchResults, totalItemsInDB } = data
        if (totalItemsInDB === -1) return (isFetching.value = false)

        totalInDB.value = totalItemsInDB

        let items = storedCache[params.order][pageNumber.value - 1] ?? []

        items = items.concat(newPageItems).concat(searchResults)

        // Store the newly fetched page in the cache.
        storedCache[params.order][pageNumber.value - 1] = sortedUniqBy(
          orderBy(items, ['updatedAt'], [params.order]),
          '_id'
        )

        const flatArray = storedCache[params.order].flat()

        // Update stale items in the cache
        flatArray.forEach((item) => {
          const updatedItem = updatedCacheItems.find(
            (updatedItem) => updatedItem._id === item._id
          )
          if (updatedItem) Object.assign(item, updatedItem)
        })

        // If we have more items than we need for the current page,
        // then we can take a moment to reorganize the cache.
        if (flatArray.length > itemsPerPage.value * pageNumber.value) {
          storedCache[params.order] = chunk(flatArray, itemsPerPage.value)
        }

        isFetching.value = false
      }

      return {
        sort,
        search,
        total: totalInDB,
        totalInOurCache,
        isFetching,
        pageNumber,
        itemsPerPage,
        pageItems,
        selectedId,
        selectedItem
      }
    })()
)

export { useProvideFeedbackStore }

export function useFeedbackStore() {
  const feedbackStore = innerUseFeedbackStore()
  if (feedbackStore == null)
    throw new Error(
      'Please call `useProvideFeedbackStore` on the appropriate parent component'
    )
  return feedbackStore
}

// if (import.meta.hot) {
//   import.meta.hot.accept(acceptHMRUpdate(useProvideFeedbackStore, import.meta.hot))
// }
