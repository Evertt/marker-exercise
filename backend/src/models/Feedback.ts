import { set, model } from 'mongoose'
import { feedbackSchema as zodFeedbackSchema } from '../../../shared/src/zod'
import { zodToMongooseSchema } from '../../../shared/src/utils'

set('overwriteModels', true)

export const feedbackSchema = zodToMongooseSchema(zodFeedbackSchema, {
  timestamps: true
})

// delete models['Feedback']
export const FeedbackModel = model('Feedback', feedbackSchema)
