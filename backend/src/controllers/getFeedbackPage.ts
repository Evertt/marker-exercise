import { Request, Response } from 'express'
import { mongooseSchemas, zodSchemas } from '../../../shared/src'
import { GetModelGenerics } from '@/utils'
import type z from 'zod'

const { feedbackFetchParamsSchema } = zodSchemas
const { FeedbackModel } = mongooseSchemas

type FeedbackModel = z.infer<typeof zodSchemas.feedbackSchema>

type FeedbackModelGenerics = GetModelGenerics<typeof FeedbackModel>
type HydratedDocument = FeedbackModelGenerics['HydratedDocument']
type FeedbackFindFn = typeof FeedbackModel.find<HydratedDocument>
type FeedbackQuery = ReturnType<FeedbackFindFn>
type FeedbackFilter = ReturnType<FeedbackQuery['getFilter']>

export async function getFeedbackPage(req: Request, res: Response) {
  const parseResult = await feedbackFetchParamsSchema.safeParseAsync(req.query)

  if (!parseResult.success) {
    return res.status(400).send({
      message: 'Invalid request query',
      errors: parseResult.error.errors
    })
  }

  const totalItemsInDB = await FeedbackModel.countDocuments()

  const {
    order,
    itemsPerPage,
    // localItemCount,
    minCreatedAt,
    maxCreatedAt,
    // minUpdatedAt,
    maxUpdatedAt
  } = parseResult.data
  const isAsc = order === 'asc'

  // Here I'm starting to build the query from an empty object
  // That is because if neither dates are defined, then I want
  // the query to return all the results, which it will only do
  // when the query object is completely empty.
  const queryForNextPage: FeedbackFilter = {}

  // I'm choosing to use $gte and $lte instead of $gt and $lt,
  // because if this app gets a lot of traffic, then it's possible
  // that multiple feedback items will be created at the same time.
  // So I want to make sure that I don't miss any items.
  // This does mean that the query will also always
  // return one item that the user already has.
  // We will deal with that later.
  isAsc && maxCreatedAt && (queryForNextPage.createdAt = { $gte: maxCreatedAt })
  !isAsc && minCreatedAt && (queryForNextPage.createdAt = { $lte: minCreatedAt })

  const nextFeedbacksPage = FeedbackModel.find(queryForNextPage)
    .sort({ updatedAt: order })
    .limit(itemsPerPage)

  // If any of these variables are not defined,
  // then the query will return zero results,
  // which in this case is exactly what I'd want.
  // Because that would mean there are no local
  // feedback items that might need updating.
  const updatedLocalFeedbacks = FeedbackModel.find({
    createdAt: { $gte: minCreatedAt, $lte: maxCreatedAt },
    ...(maxUpdatedAt && { updatedAt: { $gt: maxUpdatedAt } })
  }).sort({ updatedAt: order })
  // .limit(localItemCount)

  const sortDirection = isAsc ? 1 : -1

  return Promise.all([nextFeedbacksPage, updatedLocalFeedbacks])
    .then(([newPageItems, updatedCacheItems]) => {
      // Like I said before, if the query for the new page
      // returned only one item, then it can only be
      // an item that the user already has.
      // So we need to remove it.
      if (newPageItems.length === 1) newPageItems.pop()

      // We're sorting the items based on the requested sort order
      newPageItems.sort((a, b) => {
        return sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
      })

      updatedCacheItems.sort((a, b) => {
        return sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
      })

      res.status(200).send({ newPageItems, updatedCacheItems, totalItemsInDB })
    })
    .catch((error) => {
      res.status(500).send({ error, message: 'Failed to fetch feedbacks' })
    })
}
