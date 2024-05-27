import User from '../models/User'
import { setAuthTokens } from '../services/AuthService'
import { logger } from '../utils'
import type { Request, Response } from 'express'

const loginController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore it does have an _id field
    const user = await User.findById(`${req.user?._id}`)

    // If user doesn't exist, return error
    if (!user) {
      // typeof user !== User) { // this doesn't seem to resolve the User type ??
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const token = await setAuthTokens(`${user._id}`, res)

    return res.status(200).send({ token, user })
  } catch (err) {
    logger.error('[loginController]', err)
  }

  // Generic error messages are safer
  return res.status(500).json({ message: 'Something went wrong' })
}

export { loginController }
