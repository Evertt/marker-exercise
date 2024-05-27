import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { errorsToString } from '../utils'
import { registerSchema } from '../auth/validators'
// import isDomainAllowed from './isDomainAllowed';
import Token from '../models/Token'
// import { sendEmail } from '../utils';
import Session from '../models/Session'
import { logger } from '../utils'
import User from '../models/User'
import { Types } from 'mongoose'
import type { Response } from 'express'

const domains = {
  client: process.env.DOMAIN_CLIENT,
  server: process.env.DOMAIN_SERVER
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Logout user
 *
 * @param {String} userId
 * @param {crypto.BinaryLike} refreshToken
 * @returns
 */
const logoutUser = async (userId: string, refreshToken: crypto.BinaryLike) => {
  try {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    // Find the session with the matching user and refreshTokenHash
    const session = await Session.findOne({ user: userId, refreshTokenHash: hash })
    if (session) {
      try {
        await Session.deleteOne({ _id: session._id })
      } catch (deleteErr) {
        logger.error('[logoutUser] Failed to delete session.', deleteErr)
        return { status: 500, message: 'Failed to delete session.' }
      }
    }

    return { status: 200, message: 'Logout successful' }
  } catch (err: any) {
    return { status: 500, message: err.message as string }
  }
}

/**
 * Register a new user
 *
 * @param {Object} user <email, password, name, username>
 * @returns
 */
const registerUser = async (user: InstanceType<typeof User>) => {
  const { error } = registerSchema.safeParse(user)
  if (error) {
    const errorMessage = errorsToString(error.errors)
    logger.info(
      'Route: register - Validation Error',
      { name: 'Request params:', value: user },
      { name: 'Validation error:', value: errorMessage }
    )

    return { status: 422, message: errorMessage }
  }

  const { email, password, name } = user

  try {
    const existingUser = await User.findOne({ email }).lean()

    if (existingUser) {
      logger.info(
        'Register User - Email in use',
        { name: 'Request params:', value: user },
        { name: 'Existing user:', value: existingUser }
      )

      // Sleep for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // TODO: We should change the process to always email and be generic is signup works or fails (user enum)
      return { status: 500, message: 'Something went wrong' }
    }

    //determine if this is the first registered user (not counting anonymous_user)
    const isFirstRegisteredUser = (await User.countDocuments({})) === 0

    const newUser = await new User({
      provider: 'local',
      email,
      password,
      name,
      role: isFirstRegisteredUser ? 'ADMIN' : 'USER'
    })

    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(newUser.password!, salt)
    newUser.password = hash
    await newUser.save()

    return { status: 200, user: newUser }
  } catch (err: any) {
    return { status: 500, message: (err?.message as string) || 'Something went wrong' }
  }
}

/**
 * Request password reset
 *
 * @param {String} email
 * @returns
 */
const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email }).lean()
  if (!user) {
    return new Error('Email does not exist')
  }

  const token = await Token.findOne({ userId: user._id })
  if (token) {
    await token.deleteOne()
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hash = bcrypt.hashSync(resetToken, 10)

  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now()
  }).save()

  const link = `${domains.client}/reset-password?token=${resetToken}&userId=${user._id}`

  return { link }
}

/**
 * Reset Password
 *
 * @param {Types.ObjectId} userId
 * @param {String} token
 * @param {String} password
 * @returns
 */
const resetPassword = async (userId: Types.ObjectId, token: string, password: string) => {
  const passwordResetToken = await Token.findOne({ userId })

  if (!passwordResetToken) {
    return new Error('Invalid or expired password reset token')
  }

  const isValid = bcrypt.compareSync(token, passwordResetToken.token)

  if (!isValid) {
    return new Error('Invalid or expired password reset token')
  }

  const hash = bcrypt.hashSync(password, 10)

  await User.updateOne({ _id: userId }, { $set: { password: hash } }, { new: true })

  const user = await User.findById({ _id: userId })

  await passwordResetToken.deleteOne()

  return { message: 'Password reset was successful' }
}

/**
 * Set Auth Tokens
 *
 * @param {String} userId
 * @param {Response} res
 * @param {String | null} sessionId
 * @returns
 */
const setAuthTokens = async (userId: string, res: Response, sessionId: string | null = null) => {
  try {
    const user = await User.findOne({ _id: userId })

    if (!user) {
      throw new Error('User not found')
    }

    const token = await user.generateToken()

    let session: InstanceType<typeof Session> | null
    let refreshTokenExpires: number
    if (sessionId) {
      session = await Session.findById(sessionId)

      if (!session) {
        throw new Error('Session not found')
      }

      refreshTokenExpires = session.expiration.getTime()
    } else {
      session = new Session({ user: userId })
      const { REFRESH_TOKEN_EXPIRY = '0' } = process.env ?? {}
      const expires = +REFRESH_TOKEN_EXPIRY || 1000 * 60 * 60 * 24 * 7
      refreshTokenExpires = Date.now() + expires
    }

    const refreshToken = await session.generateRefreshToken()

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(refreshTokenExpires),
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict'
    })

    return token
  } catch (error) {
    logger.error('[setAuthTokens] Error in setting authentication tokens:', error)
    throw error
  }
}

export { registerUser, logoutUser, requestPasswordReset, resetPassword, setAuthTokens }
