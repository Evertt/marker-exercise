import express from 'express'
import connectDb from './db'
import cors from 'cors'
import mongoSanitize from 'express-mongo-sanitize'
import { logger } from './utils'
import routes from './router'
import methodOverride from 'method-override'

async function startServer() {
  await connectDb()
  logger.info('Connected to MongoDB')

  const app = express()

  app.use(mongoSanitize())
  app.use(cors())

  app.use(methodOverride('_method'))
  app.use('/api', routes)

  const port = process.env.PORT || 3000

  app.get('/health', (_req, res) => res.status(200).send('OK'))

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

startServer()
