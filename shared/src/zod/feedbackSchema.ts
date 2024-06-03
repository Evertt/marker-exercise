import { z } from 'zod'
import makeEnumObject from '../utils/enum-object-factory'
import { Schema } from 'mongoose'

const ObjectId = Schema.Types.ObjectId

const FeedbackType = makeEnumObject({
  bug: 'Bug',
  suggestion: 'Suggestion'
} as const)

export const _idObjectSchema = z.instanceof(ObjectId)
export const _idStringSchema = z.string()
export const _idSchema = _idStringSchema.or(_idObjectSchema)

export const feedbackSchema = z.object({
  _id: _idSchema,
  name: z.string().min(3).max(32),
  email: z.string().email(),
  type: z.enum(FeedbackType.keys()),
  title: z.string().min(8).max(64),
  message: z.string().min(8),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date())
})

export const newFeedbackSchema = feedbackSchema.extend({
  _id: feedbackSchema.shape._id.optional()
})

export type FeedbackItem = z.infer<typeof feedbackSchema>
export type NewFeedbackItem = z.infer<typeof newFeedbackSchema>
