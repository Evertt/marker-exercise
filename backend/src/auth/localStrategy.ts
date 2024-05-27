import { Strategy as PassportLocalStrategy, type VerifyFunction } from 'passport-local'
import { loginSchema } from './validators'
import { logger } from '../utils'
import User from '../models/User'
import { type ZodIssue } from 'zod'
import type { Request } from 'express'

type DoneFn = Parameters<VerifyFunction>[2]

function errorsToString(errors: ZodIssue[]): string {
  return errors.map((error) => error.message).join('\n')
}

async function validateLoginRequest(req: Request) {
  const { error } = loginSchema.safeParse(req.body)
  return error ? errorsToString(error.errors) : null
}

async function findUserByEmail(email: string) {
  return User.findOne({ email: email.trim() })
}

async function comparePassword(user: InstanceType<typeof User>, password: string) {
  return new Promise((resolve, reject) => {
    user.comparePassword(password, function (err, isMatch) {
      if (err) {
        return reject(err)
      }
      resolve(isMatch)
    })
  })
}

async function passportLogin(req: Request, email: string, password: string, done: DoneFn) {
  try {
    const validationError = await validateLoginRequest(req)
    if (validationError) {
      logError('Passport Local Strategy - Validation Error', { reqBody: req.body })
      logger.error(`[Login] [Login failed] [Username: ${email}] [Request-IP: ${req.ip}]`)
      return done(null, false, { message: validationError })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      logError('Passport Local Strategy - User Not Found', { email })
      logger.error(`[Login] [Login failed] [Username: ${email}] [Request-IP: ${req.ip}]`)
      return done(null, false, { message: 'Email does not exist.' })
    }

    const isMatch = await comparePassword(user, password)
    if (!isMatch) {
      logError('Passport Local Strategy - Password does not match', { isMatch })
      logger.error(`[Login] [Login failed] [Username: ${email}] [Request-IP: ${req.ip}]`)
      return done(null, false, { message: 'Incorrect password.' })
    }

    logger.info(`[Login] [Login successful] [Username: ${email}] [Request-IP: ${req.ip}]`)
    return done(null, user)
  } catch (err: any) {
    return done(err)
  }
}

function logError(title: string, parameters: Record<string, any>) {
  const entries = Object.entries(parameters).map(([name, value]) => ({ name, value }))
  logger.error(title, { parameters: entries })
}

export default () =>
  new PassportLocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
      passReqToCallback: true
    },
    passportLogin
  )
