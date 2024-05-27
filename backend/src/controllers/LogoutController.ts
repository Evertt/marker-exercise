import cookies from 'cookie'
import { logoutUser } from '../services/AuthService'
import { logger } from '../utils'
import type { Request, Response } from 'express'

const logoutController = async (req: Request, res: Response) => {
  const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : ''
  try {
    // @ts-ignore it does have an _id field
    const logout = await logoutUser(`${req.user?._id}`, refreshToken)
    const { status, message } = logout
    res.clearCookie('refreshToken')
    return res.status(status).send({ message })
  } catch (err: any) {
    logger.error('[logoutController]', err)
    return res.status(500).json({ message: err.message as string })
  }
}

export { logoutController }
