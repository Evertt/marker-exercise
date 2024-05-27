import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { logger } from '../utils'
import User from '../models/User'

// JWT strategy
const jwtLogin = async () => {
  const { JWT_SECRET } = process.env

  if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable')
  }

  return new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload?.id)
        if (user) {
          done(null, user)
        } else {
          logger.warn('[jwtLogin] JwtStrategy => no user found: ' + payload?.id)
          done(null, false)
        }
      } catch (err) {
        done(err, false)
      }
    }
  )
}

export default jwtLogin
