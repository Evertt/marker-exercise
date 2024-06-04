import { z } from 'zod'
import { feedbackSchema } from './feedbackSchema'
import type { Schema, Merge } from 'type-fest'

const undefinedString = z.literal('undefined') //.transform(() => undefined)
const nullString = z.literal('null') //.transform(() => null)
const nullishStrings = z.union([undefinedString, nullString]).nullish()

const isoStringToDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(nullishStrings.transform(() => void 0))
  .transform((value) => {
    const date = new Date(value as string)
    return isNaN(date.getTime()) ? undefined : date
  })

export const feedbackFetchParamsSchema = z.object({
  page: z.coerce.number(),
  search: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  itemsPerPage: z.coerce.number().default(20),
  // localItemCount: z.coerce.number().default(0),
  minCreatedAt: isoStringToDateSchema.describe('ISO formatted date string'),
  maxCreatedAt: isoStringToDateSchema.describe('ISO formatted date string'),
  // minUpdatedAt: isoStringToDateSchema.describe("ISO formatted date string"),
  maxUpdatedAt: isoStringToDateSchema.describe('ISO formatted date string')
})

export const paginatedResultsSchema = z.object({
  newPageItems: z.array(feedbackSchema),
  updatedCacheItems: z.array(feedbackSchema),
  searchResults: z.array(feedbackSchema),
  totalItemsInDB: z.number()
})

export type PaginatedResults = z.infer<typeof paginatedResultsSchema>

export type FeedbackFetchParams = z.infer<typeof feedbackFetchParamsSchema>

export type URLFeedbackFetchParams = Merge<
  Schema<FeedbackFetchParams, string>,
  {
    page: `${number}`
    order: 'asc' | 'desc'
    itemsPerPage: `${number}`
  }
>
