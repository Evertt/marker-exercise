import crypto from 'crypto'
import cookies from 'cookie'
import jwt from 'jsonwebtoken'
import { Session, User } from '../models'
import {
  registerUser,
  resetPassword,
  setAuthTokens,
  requestPasswordReset
} from '../services/AuthService'
import { logger } from '../utils'
import type { Request, Response } from 'express'

const registrationController = async (req: Request, res: Response) => {
  try {
    const response = await registerUser(req.body)
    if (response.status === 200) {
      const { status, user } = response

      if (!user) {
        return res.status(500).send({ message: 'User not found' })
      }

      let newUser = await User.findOne({ _id: user._id })
      if (!newUser) {
        newUser = new User(user)
        await newUser.save()
      }

      const token = await setAuthTokens(`${user._id}`, res)
      res.setHeader('Authorization', `Bearer ${token}`)
      res.status(status).send({ user })
    } else {
      const { status, message } = response
      res.status(status).send({ message })
    }
  } catch (err: any) {
    logger.error('[registrationController]', err)
    return res.status(500).json({ message: err.message as string })
  }
}

const getUserController = async (req: Request, res: Response) => {
  return res.status(200).send(req.user)
}

const resetPasswordRequestController = async (req: Request, res: Response) => {
  try {
    const resetService = await requestPasswordReset(req.body.email)
    if (resetService instanceof Error) {
      return res.status(400).json(resetService)
    } else {
      return res.status(200).json(resetService)
    }
  } catch (e: any) {
    logger.error('[resetPasswordRequestController]', e)
    return res.status(400).json({ message: e.message as string })
  }
}

const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const resetPasswordService = await resetPassword(
      req.body.userId,
      req.body.token,
      req.body.password
    )
    if (resetPasswordService instanceof Error) {
      return res.status(400).json(resetPasswordService)
    } else {
      return res.status(200).json(resetPasswordService)
    }
  } catch (e: any) {
    logger.error('[resetPasswordController]', e)
    return res.status(400).json({ message: e.message as string })
  }
}

const refreshController = async (req: Request, res: Response) => {
  const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : null
  if (!refreshToken) {
    return res.status(200).send('Refresh token not provided')
  }

  try {
    const { JWT_REFRESH_SECRET } = process.env

    if (!JWT_REFRESH_SECRET) {
      return res.status(500).send('JWT_REFRESH_SECRET not set')
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload
    const user = await User.findOne({ _id: payload.id })
    if (!user) {
      return res.status(401).redirect('/login')
    }

    const userId: string = payload.id

    if (process.env.NODE_ENV === 'CI') {
      const token = await setAuthTokens(userId, res)
      const userObj = user.toJSON()
      return res.status(200).send({ token, user: userObj })
    }

    // Hash the refresh token
    const hash = crypto.createHash('sha256')
    const hashedToken = hash.update(refreshToken).digest('hex')

    // Find the session with the hashed refresh token
    const session = await Session.findOne({ user: userId, refreshTokenHash: hashedToken })
    if (session && session.expiration > new Date()) {
      const token = await setAuthTokens(userId, res, `${session._id}`)
      const userObj = user.toJSON()
      res.status(200).send({ token, user: userObj })
    } else if (req?.query?.retry) {
      // Retrying from a refresh token request that failed (401)
      res.status(403).send('No session found')
    } else if (payload.exp && payload.exp < Date.now() / 1000) {
      res.status(403).redirect('/login')
    } else {
      res.status(401).send('Refresh token expired or not found for this user')
    }
  } catch (err) {
    logger.error(`[refreshController] Refresh token: ${refreshToken}`, err)
    res.status(403).send('Invalid refresh token')
  }
}

export {
  getUserController,
  refreshController,
  registrationController,
  resetPasswordController,
  resetPasswordRequestController
}
