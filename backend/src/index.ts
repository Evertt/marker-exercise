import express from 'express'
import connectDb from './db'
import cors from 'cors'
import passport from 'passport'
import mongoSanitize from 'express-mongo-sanitize'
import { jwtLogin, passportLogin } from './auth'
import { logger } from './utils'
import * as routes from './routes'

async function startServer() {
  await connectDb()
  logger.info('Connected to MongoDB')

  const app = express()

  app.use(mongoSanitize())
  app.use(cors())
  app.use(passport.initialize())
  passport.use(await jwtLogin())
  passport.use(passportLogin())

  app.use('/api/auth', routes.auth)

  const port = process.env.PORT || 3000

  app.get('/health', (_req, res) => res.status(200).send('OK'))

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

startServer()
