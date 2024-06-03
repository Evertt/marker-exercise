import express from 'express'
import {
  createFeedback,
  getFeedbackList,
  getFeedbackById,
  clearAllFeedback,
  generateFakeData,
  getFeedbackPage
} from './controllers/FeedbackController'

const router = express.Router()

router.post('/feedback', express.json(), createFeedback)
router.get('/feedback', getFeedbackPage)
router.get('/feedback/:id', getFeedbackById)
router.delete('/feedback', clearAllFeedback)
router.post('/feedback/generate', generateFakeData)

export default router
