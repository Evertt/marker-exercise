import type { Request, Response } from 'express'
import { FeedbackModel } from '../models/Feedback'
import { feedbackSchema, type FeedbackItem } from '../../../shared/src/zod'
import { faker } from '@faker-js/faker'
export * from './getFeedbackPage'
import { Schema, type AnyBulkWriteOperation } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

export async function createFeedback(req: Request, res: Response) {
  const parseResult = await feedbackSchema
    .safeParseAsync(req.body)
    .catch((error: unknown) => {
      res.status(500).send({ error, message: 'Failed to parse the request payload' })
    })

  if (!parseResult) return

  if (!parseResult.success) {
    return res.status(400).send({
      message: 'Invalid request payload',
      errors: parseResult.error.errors
    })
  }

  const feedbackData = parseResult.data
  const feedback = new FeedbackModel(feedbackData)

  await feedback.save().catch((error: unknown) => {
    return res.status(500).send({ error, message: 'Failed to save feedback' })
  })

  res.status(201).send(feedback)
}

export function getFeedbackList(_req: Request, res: Response) {
  FeedbackModel.find()
    .sort({ updatedAt: 'desc' })
    .then((feedbacks) => {
      res.status(200).send(feedbacks)
    })
    .catch((error: unknown) => {
      res.status(500).send({ error, message: 'Failed to fetch feedbacks' })
    })
}

export async function getFeedbackById(req: Request, res: Response) {
  const feedbackId = req.params.id

  const feedback = await FeedbackModel.findById(feedbackId).catch((error: unknown) => {
    res.status(500).send({ error, message: `Failed to fetch feedback ${feedbackId}` })
  })

  if (!feedback) {
    return res.status(404).send({ message: `Feedback not found ${feedbackId}` })
  }

  res.status(200).send(feedback)
}

export function clearAllFeedback(_req: Request, res: Response) {
  const isFormRequest = _req.headers['content-type']?.includes('form')

  FeedbackModel.deleteMany()
    .then(() => {
      isFormRequest ? res.redirect('back') : res.status(204).send()
    })
    .catch((error: unknown) => {
      res.status(500).send({ error, message: 'Failed to clear feedbacks' })
    })
}

export async function generateFakeData(_req: Request, res: Response) {
  const newItemsCount = faker.number.int({ min: 5, max: 15 })

  const insertOpsWithFakeData = Array.from({ length: newItemsCount }, () => {
    faker.setDefaultRefDate(new Date())
    const createdAt = faker.date.recent({ days: 90 })
    const wasUpdated = faker.helpers.arrayElement([true, false])
    const updatedAt = wasUpdated
      ? faker.date.between({ from: createdAt, to: new Date() })
      : createdAt

    return {
      insertOne: {
        document: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          type: faker.helpers.arrayElement(['bug', 'suggestion']),
          title: faker.lorem.sentence({ min: 2, max: 6 }),
          message: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
            faker.lorem.paragraph({ min: 3, max: 7 })
          ).join('\n\n'),
          createdAt,
          updatedAt
        }
      }
    }
  }) as AnyBulkWriteOperation[]

  const bulkOps = await generateBulkUpdateOps(newItemsCount)

  const result = await FeedbackModel.bulkWrite(insertOpsWithFakeData.concat(bulkOps), {
    timestamps: false
  })

  return res.status(201).send({
    message: `We created ${result.insertedCount} feedback items, and updated ${result.modifiedCount}.`
  })
}

async function generateBulkUpdateOps(
  creatingCount: number
): Promise<AnyBulkWriteOperation[]> {
  const count = await FeedbackModel.countDocuments()

  if (!count) return []

  const numberOfItemsToUpdate = faker.number.int({
    min: Math.min(3, count),
    max: Math.min(count, Math.min(creatingCount, Math.round(Math.max(count, 20) / 5)))
  })

  const itemsToUpdate = await FeedbackModel.aggregate<FeedbackItem>([
    { $sample: { size: numberOfItemsToUpdate } }
  ])

  if (!itemsToUpdate) return []

  const updatedDocuments = itemsToUpdate.map((document) => {
    document.title += '!'
    document.message += `\n\nPS: ${faker.lorem.paragraph(1)}`
    document.updatedAt = faker.date.between({
      from: document.updatedAt,
      to: new Date().getTime()
    })

    return document
  })

  return updatedDocuments.map(({ _id, title, message, updatedAt }) => {
    return {
      updateOne: {
        filter: { _id: { $eq: typeof _id === 'string' ? new ObjectId(_id) : _id } },
        update: {
          title,
          message,
          updatedAt
        },
        timestamps: false
      }
    }
  })
}
