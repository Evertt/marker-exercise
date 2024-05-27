import passport from 'passport'
import { logger } from '../utils'
import type { Request, Response, NextFunction } from 'express'

type AuthenticateCallback = (
  err: any,
  user?: Express.User | false | null,
  info?: object | string | Array<string | undefined>,
  status?: number | Array<number | undefined>
) => any

const requireLocalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', ((err, user, info) => {
    if (err) {
      logger.error({
        title: '(requireLocalAuth) Error at passport.authenticate',
        parameters: [{ name: 'error', value: err }]
      })
      return next(err)
    }
    if (!user) {
      logger.error({
        title: '(requireLocalAuth) Error: No user'
      })
      return res.status(422).send(info)
    }
    req.user = user
    next()
  }) as AuthenticateCallback)(req, res, next)
}

export default requireLocalAuth
