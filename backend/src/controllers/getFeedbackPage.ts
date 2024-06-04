import { Request, Response } from 'express'
import { mongooseSchemas, zodSchemas } from '../../../shared/src'
import { GetModelGenerics } from '@/utils'
import { escapeRegExp } from 'lodash'
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

  const {
    page,
    order,
    itemsPerPage,
    search,
    // localItemCount,
    minCreatedAt,
    maxCreatedAt,
    // minUpdatedAt,
    maxUpdatedAt
  } = parseResult.data

  const isAsc = order === 'asc'

  const totalItemsInDB = await FeedbackModel.countDocuments()

  if (search) {
    const searchQuery = escapeRegExp(search)

    const searchResults = await FeedbackModel.find({
      $or: [
        { type: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { title: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .sort({ updatedAt: order })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    res.status(200).send({
      newPageItems: [],
      updatedCacheItems: [],
      totalItemsInDB,
      searchResults
    })
  }

  // Here I'm starting to build the query from an empty object
  // That is because if neither dates are defined, then I want
  // the query to return all the results, which it will only do
  // when the query object is completely empty.
  const queryForNextPage: FeedbackFilter = {}

  // As soon as we start using page numbers, we can't use this anymore
  // isAsc && maxCreatedAt && (queryForNextPage.createdAt = { $gte: maxCreatedAt })
  // !isAsc && minCreatedAt && (queryForNextPage.createdAt = { $lte: minCreatedAt })

  const skipItems = (page - 1) * itemsPerPage

  const nextFeedbacksPage = FeedbackModel.find(queryForNextPage)
    .sort({ updatedAt: order })
    .skip(skipItems)
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

  const sortDirection = isAsc ? 1 : -1

  return Promise.all([nextFeedbacksPage, updatedLocalFeedbacks])
    .then(([newPageItems, updatedCacheItems]) => {
      // Sorting the items based on the requested sort order
      newPageItems.sort((a, b) => {
        return sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
      })

      updatedCacheItems.sort((a, b) => {
        return sortDirection * (a.updatedAt.getTime() - b.updatedAt.getTime())
      })

      res.status(200).send({
        totalItemsInDB,
        newPageItems,
        updatedCacheItems,
        searchResults: []
      })
    })
    .catch((error) => {
      res.status(500).send({ error, message: 'Failed to fetch feedbacks' })
    })
}
