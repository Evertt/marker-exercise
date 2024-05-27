import crypto from 'crypto'
import mongoose from 'mongoose'
import signPayload from '../services/signPayload'
import { logger } from '../utils'

const { REFRESH_TOKEN_EXPIRY = '0' } = process.env ?? {}
const expires = +REFRESH_TOKEN_EXPIRY ?? 1000 * 60 * 60 * 24 * 7

const sessionSchema = new mongoose.Schema(
  {
    refreshTokenHash: {
      type: String,
      required: true
    },
    expiration: {
      type: Date,
      required: true,
      expires: 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    statics: {
      deleteAllUserSessions: async function (userId) {
        try {
          if (!userId) {
            return
          }
          const result = await this.deleteMany({ user: userId })
          if (result && result?.deletedCount > 0) {
            logger.debug(
              `[deleteAllUserSessions] Deleted ${result.deletedCount} sessions for user ${userId}.`
            )
          }
        } catch (error) {
          logger.error('[deleteAllUserSessions] Error in deleting user sessions:', error)
          throw error
        }
      }
    },
    methods: {
      generateRefreshToken: async function () {
        try {
          let expiresIn
          if (this.expiration) {
            expiresIn = this.expiration.getTime()
          } else {
            expiresIn = Date.now() + expires
            this.expiration = new Date(expiresIn)
          }

          const { JWT_REFRESH_SECRET } = process.env

          if (!JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not set in the .env file.')
          }

          const refreshToken = await signPayload({
            payload: { id: this.user },
            secret: JWT_REFRESH_SECRET,
            expirationTime: Math.floor((expiresIn - Date.now()) / 1000)
          })

          const hash = crypto.createHash('sha256')
          this.refreshTokenHash = hash.update(refreshToken).digest('hex')

          await this.save()

          return refreshToken
        } catch (error) {
          logger.error(
            'Error generating refresh token. Is a `JWT_REFRESH_SECRET` set in the .env file?\n\n',
            error
          )
          throw error
        }
      }
    }
  }
)

const Session = mongoose.model('Session', sessionSchema)

export default Session
